import os from "node:os";
import path from "node:path";
import { quick } from "@/lib/sandbox/process";
import { artifactDir } from "@/lib/storage/paths";
import { agentEnv, describeInput, failureText, num, runCli, versionOf, which } from "./cli";
import type { AgentAdapter, Usage } from "./types";

export const CLAUDE_CRED_ENV = ["ANTHROPIC_API_KEY", "ANTHROPIC_BASE_URL", "ANTHROPIC_AUTH_TOKEN", "CLAUDE_CODE_USE_BEDROCK", "CLAUDE_CODE_USE_VERTEX"];

/**
 * Bash runs inside Claude Code's own OS sandbox (writes confined to the
 * workspace) and is auto-approved only because it is sandboxed. Edits are
 * auto-accepted; anything else that would prompt is denied, never waited on.
 */
const SANDBOX_SETTINGS = JSON.stringify({ sandbox: { enabled: true, autoAllowBashIfSandboxed: true } });

export const claudeCode: AgentAdapter = {
  id: "claude-code",
  name: "Claude Code",
  vendor: "Anthropic",
  kind: "local-cli",
  automation: "full",
  docsUrl: "https://code.claude.com/docs/en/headless",
  capabilities: {
    streaming: true,
    tokenUsage: true,
    costReporting: true,
    modelSelection: true,
    localWorkspace: true,
    budgetCap: true,
    cancellation: true,
    imageInput: true,
  },
  limitations: [
    "total_cost_usd is Claude Code's own client-side estimate, not an invoice. On a subscription login it reflects list price, not what you pay.",
    "Runs with your local login. User settings, hooks, plugins and personal CLAUDE.md are excluded (--setting-sources project, --strict-mcp-config); the repository's own CLAUDE.md still applies.",
    "Bash runs in Claude Code's sandbox; commands that need network or paths outside the workspace may be refused.",
  ],
  setup: [
    { label: "Install", command: "curl -fsSL https://claude.ai/install.sh | bash", url: "https://code.claude.com/docs/en/setup" },
    { label: "Sign in (or set ANTHROPIC_API_KEY in .env.local)", command: "claude auth login" },
    { label: "Check", command: "claude auth status" },
  ],
  credentialEnv: CLAUDE_CRED_ENV,
  models: [
    { id: "", label: "CLI default" },
    { id: "opus", label: "Opus (latest)" },
    { id: "sonnet", label: "Sonnet (latest)" },
    { id: "haiku", label: "Haiku (latest)" },
  ],

  async detect() {
    const checkedAt = new Date().toISOString();
    const bin = which(["claude"], "CLAUDE_BIN");
    if (!bin) return { agentId: "claude-code", installed: false, auth: "unknown", checkedAt };
    const version = await versionOf(bin);
    // `claude auth status` is local and free. Only non-identifying fields are kept.
    const r = await quick(bin, ["auth", "status"], os.tmpdir(), agentEnv(CLAUDE_CRED_ENV));
    let auth: "authenticated" | "missing" | "unknown" = "unknown";
    let authDetail: string | undefined;
    try {
      const j = JSON.parse(r.stdout) as { loggedIn?: boolean; authMethod?: string; apiProvider?: string };
      auth = j.loggedIn ? "authenticated" : "missing";
      authDetail = j.loggedIn ? `Signed in via ${j.authMethod ?? "unknown method"}` : "Not signed in";
    } catch {
      if (process.env.ANTHROPIC_API_KEY) {
        auth = "authenticated";
        authDetail = "ANTHROPIC_API_KEY is set";
      }
    }
    return { agentId: "claude-code", installed: true, version, auth, authDetail, checkedAt };
  },

  async testConnection() {
    const s = await this.detect();
    if (!s.installed) return { ok: false, detail: "claude is not on PATH.", billable: false };
    return {
      ok: s.auth === "authenticated",
      detail: `${s.version ?? "unknown version"}. ${s.authDetail ?? "Auth state unknown."} (checked with claude auth status, no tokens spent)`,
      billable: false,
    };
  },

  async run(ctx) {
    const bin = which(["claude"], "CLAUDE_BIN");
    if (!bin) return { ok: false, error: "claude is not installed.", retries: 0 };
    const args = [
      "-p",
      "--output-format",
      "stream-json",
      "--verbose",
      "--permission-mode",
      "acceptEdits",
      "--permission-prompts",
      "none",
      "--settings",
      SANDBOX_SETTINGS,
      "--setting-sources",
      "project",
      "--strict-mcp-config",
      "--no-session-persistence",
    ];
    if (ctx.model) args.push("--model", ctx.model);
    if (ctx.limits.maxTurns) args.push("--max-turns", String(ctx.limits.maxTurns));
    if (ctx.limits.maxBudgetUsd) args.push("--max-budget-usd", String(ctx.limits.maxBudgetUsd));

    let finalText: string | undefined;
    let usage: Usage | undefined;
    let sessionId: string | undefined;
    let turns: number | undefined;
    let isError = false;
    let subtype: string | undefined;
    let reportedModel: string | undefined;

    const res = await runCli(ctx, {
      bin,
      args,
      stdin: ctx.brief,
      env: agentEnv(CLAUDE_CRED_ENV),
      transcriptFile: path.join(artifactDir(ctx.experimentId, ctx.runId), "transcript.jsonl"),
      onJson: (o) => {
        const type = o.type as string;
        if (type === "system" && o.subtype === "init") {
          sessionId = o.session_id as string;
          if (typeof o.model === "string") reportedModel = o.model;
          ctx.emit({ type: "status", message: `Started (${o.model ?? "model unknown"})` });
          return;
        }
        if (type === "system" && o.subtype === "api_retry") {
          ctx.emit({ type: "log", stream: "system", text: `API retry ${o.attempt}: ${String(o.error ?? "")}` });
          return;
        }
        if (type === "assistant") {
          const content = ((o.message as { content?: unknown[] })?.content ?? []) as Record<string, unknown>[];
          for (const block of content) {
            if (block.type === "text" && typeof block.text === "string" && block.text.trim()) {
              ctx.emit({ type: "message", text: block.text });
            } else if (block.type === "tool_use") {
              ctx.emit({ type: "tool", name: String(block.name), detail: describeInput(block.input) });
            }
          }
          return;
        }
        if (type === "result") {
          subtype = o.subtype as string;
          isError = Boolean(o.is_error);
          finalText = typeof o.result === "string" ? o.result : undefined;
          turns = num(o.num_turns);
          sessionId = (o.session_id as string) ?? sessionId;
          const u = (o.usage ?? {}) as Record<string, unknown>;
          const cost = num(o.total_cost_usd);
          // Claude's input_tokens excludes cache traffic; add it back so the total matches
          // what other agents (Codex) report as input.
          const parts = [num(u.input_tokens), num(u.cache_read_input_tokens), num(u.cache_creation_input_tokens)];
          usage = {
            inputTokens: parts.some((x) => x !== undefined) ? parts.reduce<number>((a, b) => a + (b ?? 0), 0) : undefined,
            outputTokens: num(u.output_tokens),
            cacheReadTokens: num(u.cache_read_input_tokens),
            cacheWriteTokens: num(u.cache_creation_input_tokens),
            costUsd: cost,
            costSource: cost !== undefined ? "reported" : undefined,
          };
          ctx.emit({ type: "usage", usage });
        }
      },
    });

    const ok = res.exitCode === 0 && !isError && !res.timedOut && !res.cancelled;
    return {
      ok,
      exitCode: res.exitCode,
      summary: finalText,
      usage,
      sessionId,
      reportedModel,
      turns,
      retries: 0,
      error: ok ? undefined : subtype && subtype !== "success" ? `Claude Code ended with ${subtype}` : failureText(res, "Claude Code exited with an error."),
    };
  },
};
