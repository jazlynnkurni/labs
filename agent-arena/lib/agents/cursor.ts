import os from "node:os";
import path from "node:path";
import { quick } from "@/lib/sandbox/process";
import { artifactDir } from "@/lib/storage/paths";
import { agentEnv, describeInput, failureText, runCli, versionOf, which } from "./cli";
import type { AgentAdapter } from "./types";

const CRED_ENV = ["CURSOR_API_KEY"];
const BINS = ["agent", "cursor-agent"];

export const cursor: AgentAdapter = {
  id: "cursor",
  name: "Cursor Agent",
  vendor: "Cursor",
  kind: "local-cli",
  automation: "full",
  docsUrl: "https://cursor.com/docs/cli/headless",
  capabilities: {
    streaming: true,
    tokenUsage: false,
    costReporting: false,
    modelSelection: true,
    localWorkspace: true,
    budgetCap: false,
    cancellation: true,
    imageInput: false,
  },
  limitations: [
    "The CLI documents no token or cost fields, so usage shows as not reported.",
    "Runs with --force so shell commands are allowed without prompts. Cursor documents no OS sandbox for them; they run with your user's permissions inside the workspace directory.",
    "A team admin can disable headless mode, in which case -p exits with an error.",
    "Images are passed as file paths in the brief, not as image input.",
  ],
  setup: [
    { label: "Install", command: "curl https://cursor.com/install -fsS | bash", url: "https://cursor.com/docs/cli/installation" },
    { label: "Sign in (or set CURSOR_API_KEY in .env.local)", command: "agent login" },
    { label: "Check", command: "agent status" },
  ],
  credentialEnv: CRED_ENV,
  models: [{ id: "", label: "CLI default" }],

  async listModels() {
    const bin = which(BINS, "CURSOR_AGENT_BIN");
    if (!bin) return [];
    // `agent models` lists what this account can use, one "id - Label" per line.
    const r = await quick(bin, ["models"], os.tmpdir(), agentEnv(CRED_ENV));
    if (!r.ok) return [];
    const out = [{ id: "", label: "CLI default (Auto)" }];
    for (const raw of r.stdout.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "").split("\n")) {
      const m = raw.trim().match(/^([a-z0-9][\w.-]*)\s+-\s+(.+)$/i);
      if (!m || m[1] === "auto") continue;
      out.push({ id: m[1], label: m[2].replace(/\s*\((current|default)[^)]*\)\s*$/i, "").trim() });
    }
    return out.length > 1 ? out : [];
  },

  async detect() {
    const checkedAt = new Date().toISOString();
    const bin = which(BINS, "CURSOR_AGENT_BIN");
    if (!bin) return { agentId: "cursor", installed: false, auth: "unknown", checkedAt };
    const version = await versionOf(bin, ["-v"]);
    const r = await quick(bin, ["status"], os.tmpdir(), agentEnv(CRED_ENV));
    const text = `${r.stdout}\n${r.stderr}`.toLowerCase();
    let auth: "authenticated" | "missing" | "unknown" = "unknown";
    let authDetail: string | undefined;
    // An API key in the environment authenticates headless runs even when no
    // browser login exists, so it wins over the status text.
    if (process.env.CURSOR_API_KEY) {
      auth = "authenticated";
      authDetail = "CURSOR_API_KEY is set";
    } else if (/not (logged|signed) in|unauthenticated|login required/.test(text)) {
      auth = "missing";
      authDetail = "Not signed in";
    } else if (r.ok && /(logged|signed) in|authenticated/.test(text)) {
      auth = "authenticated";
      authDetail = "Signed in";
    }
    return { agentId: "cursor", installed: true, version, auth, authDetail, checkedAt };
  },

  async testConnection() {
    const s = await this.detect();
    if (!s.installed) return { ok: false, detail: "agent (Cursor CLI) is not on PATH.", billable: false };
    return {
      ok: s.auth === "authenticated",
      detail: `${s.version ?? "unknown version"}. ${s.authDetail ?? "Auth state unknown."} (checked with agent status, no tokens spent)`,
      billable: false,
    };
  },

  async run(ctx) {
    const bin = which(BINS, "CURSOR_AGENT_BIN");
    if (!bin) return { ok: false, error: "The Cursor CLI is not installed.", retries: 0 };
    const args = ["-p", "--force", "--trust", "--output-format", "stream-json", "--workspace", ctx.workspaceDir];
    if (ctx.model) args.push("--model", ctx.model);
    args.push(ctx.brief);

    let finalText: string | undefined;
    // Cursor's result field repeats every assistant message run together; the last message is the summary.
    let lastMessage: string | undefined;
    let sessionId: string | undefined;
    let isError = false;
    let reportedModel: string | undefined;

    const res = await runCli(ctx, {
      bin,
      args,
      env: agentEnv(CRED_ENV),
      transcriptFile: path.join(artifactDir(ctx.experimentId, ctx.runId), "transcript.jsonl"),
      onJson: (o) => {
        const type = o.type as string;
        if (type === "system" && o.subtype === "init") {
          sessionId = o.session_id as string;
          if (typeof o.model === "string") reportedModel = o.model;
          ctx.emit({ type: "status", message: `Started (${o.model ?? "model unknown"})` });
        } else if (type === "assistant") {
          const content = ((o.message as { content?: unknown[] })?.content ?? []) as Record<string, unknown>[];
          for (const b of content) {
            if (b.type === "text" && typeof b.text === "string" && b.text.trim()) {
              lastMessage = b.text;
              ctx.emit({ type: "message", text: b.text });
            }
          }
        } else if (type === "tool_call" && o.subtype === "started") {
          const call = (o.tool_call ?? {}) as Record<string, unknown>;
          const key = Object.keys(call)[0] ?? "tool";
          const args = (call[key] as { args?: unknown })?.args;
          ctx.emit({ type: "tool", name: key.replace(/ToolCall$/, ""), detail: describeInput(args) });
        } else if (type === "result") {
          isError = Boolean(o.is_error);
          finalText = typeof o.result === "string" ? o.result : undefined;
          sessionId = (o.session_id as string) ?? sessionId;
        }
      },
    });

    const ok = res.exitCode === 0 && !isError && !res.timedOut && !res.cancelled;
    return {
      ok,
      exitCode: res.exitCode,
      summary: lastMessage ?? finalText,
      sessionId,
      reportedModel,
      retries: 0,
      error: ok ? undefined : failureText(res, "Cursor Agent exited with an error."),
    };
  },
};
