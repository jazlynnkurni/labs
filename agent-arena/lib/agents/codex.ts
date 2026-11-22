import os from "node:os";
import path from "node:path";
import { quick } from "@/lib/sandbox/process";
import { artifactDir } from "@/lib/storage/paths";
import { agentEnv, failureText, num, runCli, versionOf, which } from "./cli";
import type { AgentAdapter, Usage } from "./types";

const CRED_ENV = ["CODEX_API_KEY", "OPENAI_API_KEY", "CODEX_HOME"];

export const codex: AgentAdapter = {
  id: "codex",
  name: "Codex CLI",
  vendor: "OpenAI",
  kind: "local-cli",
  automation: "full",
  docsUrl: "https://learn.chatgpt.com/docs/non-interactive-mode",
  capabilities: {
    streaming: true,
    tokenUsage: true,
    costReporting: false,
    modelSelection: true,
    localWorkspace: true,
    budgetCap: false,
    cancellation: true,
    imageInput: true,
  },
  limitations: [
    "Reports tokens (turn.completed.usage) but no dollar cost. The arena shows tokens only and never estimates a price.",
    "Runs under --sandbox workspace-write: writes are confined to the workspace and network is off by default, so dependency installs inside the run may fail.",
    "No budget cap flag. Only the time limit is enforced.",
    "Your ~/.codex config and any global AGENTS.md still apply.",
  ],
  setup: [
    { label: "Install", command: "curl -fsSL https://chatgpt.com/codex/install.sh | sh", url: "https://learn.chatgpt.com/docs/codex/cli" },
    { label: "Sign in (or set CODEX_API_KEY in .env.local)", command: "codex login" },
    { label: "Check", command: "codex login status" },
  ],
  credentialEnv: CRED_ENV,
  models: [{ id: "", label: "CLI default" }],

  async listModels() {
    const bin = which(["codex"], "CODEX_BIN");
    if (!bin) return [];
    // `codex debug models` prints the catalog for the signed-in account; only "list" models are user-selectable.
    const r = await quick(bin, ["debug", "models"], os.tmpdir(), agentEnv(CRED_ENV));
    if (!r.ok) return [];
    try {
      const d = JSON.parse(r.stdout) as { models?: { slug: string; display_name?: string; visibility?: string; priority?: number }[] };
      const listed = (d.models ?? []).filter((m) => m.visibility === "list").sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99));
      return [{ id: "", label: "CLI default" }, ...listed.map((m) => ({ id: m.slug, label: m.display_name || m.slug }))];
    } catch {
      return [];
    }
  },

  async detect() {
    const checkedAt = new Date().toISOString();
    const bin = which(["codex"], "CODEX_BIN");
    if (!bin) return { agentId: "codex", installed: false, auth: "unknown", checkedAt };
    const version = await versionOf(bin);
    const r = await quick(bin, ["login", "status"], os.tmpdir(), agentEnv(CRED_ENV));
    const text = `${r.stdout}\n${r.stderr}`.toLowerCase();
    let auth: "authenticated" | "missing" | "unknown" = "unknown";
    let authDetail: string | undefined;
    if (r.ok && /logged in/.test(text)) {
      auth = "authenticated";
      authDetail = /api key/.test(text) ? "Signed in with an API key" : /chatgpt/.test(text) ? "Signed in with ChatGPT" : "Signed in";
    } else if (/not logged in/.test(text)) {
      auth = "missing";
      authDetail = "Not signed in";
    } else if (process.env.CODEX_API_KEY) {
      auth = "authenticated";
      authDetail = "CODEX_API_KEY is set";
    }
    return { agentId: "codex", installed: true, version, auth, authDetail, checkedAt };
  },

  async testConnection() {
    const s = await this.detect();
    if (!s.installed) return { ok: false, detail: "codex is not on PATH.", billable: false };
    return {
      ok: s.auth === "authenticated",
      detail: `${s.version ?? "unknown version"}. ${s.authDetail ?? "Auth state unknown."} (checked with codex login status, no tokens spent)`,
      billable: false,
    };
  },

  async run(ctx) {
    const bin = which(["codex"], "CODEX_BIN");
    if (!bin) return { ok: false, error: "codex is not installed.", retries: 0 };
    const args = ["exec", "--json", "--sandbox", "workspace-write", "-C", ctx.workspaceDir];
    if (ctx.model) args.push("-m", ctx.model);
    for (const a of ctx.attachments) if (a.mime.startsWith("image/")) args.push("-i", a.absPath);
    // `-i` takes several files, so end options first; `-` reads the brief from stdin.
    args.push("--", "-");

    const usage: Usage = {};
    let sawUsage = false;
    let lastMessage: string | undefined;
    let threadId: string | undefined;
    let failed: string | undefined;
    let turns = 0;

    const res = await runCli(ctx, {
      bin,
      args,
      stdin: ctx.brief,
      env: agentEnv(CRED_ENV),
      transcriptFile: path.join(artifactDir(ctx.experimentId, ctx.runId), "transcript.jsonl"),
      onJson: (o) => {
        const type = o.type as string;
        if (type === "thread.started") {
          threadId = o.thread_id as string;
          ctx.emit({ type: "status", message: "Started" });
        } else if (type === "turn.completed") {
          turns++;
          const u = (o.usage ?? {}) as Record<string, unknown>;
          // Each turn reports its own usage; sum them.
          const add = (k: keyof Usage, v: unknown) => {
            const n = num(v);
            if (n === undefined) return;
            sawUsage = true;
            (usage[k] as number | undefined) = ((usage[k] as number | undefined) ?? 0) + n;
          };
          add("inputTokens", u.input_tokens);
          add("cacheReadTokens", u.cached_input_tokens);
          add("outputTokens", u.output_tokens);
          const reasoning = num(u.reasoning_output_tokens);
          if (reasoning !== undefined) usage.other = { ...(usage.other ?? {}), reasoningTokens: (usage.other?.reasoningTokens ?? 0) + reasoning };
          if (sawUsage) ctx.emit({ type: "usage", usage: { ...usage } });
        } else if (type === "turn.failed" || type === "error") {
          const err = (o.error as { message?: string })?.message ?? (o.message as string) ?? "Codex reported an error";
          failed = err;
          ctx.emit({ type: "log", stream: "stderr", text: err });
        } else if (type.startsWith("item.")) {
          const item = (o.item ?? {}) as Record<string, unknown>;
          const itemType = String(item.type ?? item.item_type ?? "");
          if (type === "item.completed" && /agent_message|assistant_message/.test(itemType) && typeof item.text === "string") {
            lastMessage = item.text;
            ctx.emit({ type: "message", text: item.text });
          } else if (type === "item.started" && /command/.test(itemType)) {
            ctx.emit({ type: "tool", name: "command", detail: String(item.command ?? "").slice(0, 200) });
          } else if (type === "item.completed" && /file_change|patch/.test(itemType)) {
            const changes = (item.changes as { path?: string }[] | undefined)?.map((c) => c.path).filter(Boolean) ?? [];
            ctx.emit({ type: "tool", name: "edit", detail: changes.join(", ").slice(0, 200) || undefined });
          } else if (type === "item.completed" && /reasoning/.test(itemType) && typeof item.text === "string") {
            ctx.emit({ type: "log", stream: "system", text: item.text.slice(0, 400) });
          }
        }
      },
    });

    const ok = res.exitCode === 0 && !failed && !res.timedOut && !res.cancelled;
    return {
      ok,
      exitCode: res.exitCode,
      summary: lastMessage,
      usage: sawUsage ? usage : undefined,
      sessionId: threadId,
      turns: turns || undefined,
      retries: 0,
      error: ok ? undefined : failed ?? failureText(res, "Codex exited with an error."),
    };
  },
};
