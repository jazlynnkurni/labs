import fs from "node:fs";
import path from "node:path";
import { artifactDir } from "@/lib/storage/paths";
import { agentEnv, failureText, runCli, versionOf, which } from "./cli";
import type { AgentAdapter } from "./types";

const CRED_ENV = ["BLACKBOX_API_KEY"];

/**
 * BLACKBOX's documented non-interactive entry point is `blackbox run
 * <instructions-file>`. Its output format, permission behaviour and auth
 * status command are not documented, so this adapter is marked partial:
 * it runs the documented command, keeps the plain-text output, and falls back
 * to a manual patch import if the run does not finish on its own.
 */
export const blackbox: AgentAdapter = {
  id: "blackbox",
  name: "BLACKBOX CLI",
  vendor: "BLACKBOX AI",
  kind: "local-cli",
  automation: "partial",
  docsUrl: "https://docs.blackbox.ai/features/blackbox-cli/commands-reference.md",
  capabilities: {
    streaming: true,
    tokenUsage: false,
    costReporting: false,
    modelSelection: false,
    localWorkspace: true,
    budgetCap: false,
    cancellation: true,
    imageInput: false,
  },
  limitations: [
    "Headless flags, output format and approval behaviour are not documented. The adapter uses the documented `blackbox run <file>` and treats output as plain text.",
    "If the CLI waits for input, the run stops at the time limit and you can import a patch by hand.",
    "No documented auth status command, so authentication shows as unknown until a run succeeds.",
    "Model is whatever `blackbox configure` set. It cannot be chosen per run.",
    "No token or cost reporting.",
  ],
  setup: [
    { label: "Install", command: "curl -fsSL https://blackbox.ai/install.sh | bash", url: "https://docs.blackbox.ai/features/blackbox-cli/getting-started.md" },
    { label: "Configure your API key and model", command: "blackbox configure" },
    { label: "Check the flags your version supports", command: "blackbox --help" },
  ],
  credentialEnv: CRED_ENV,
  models: [{ id: "", label: "Configured in blackbox configure" }],

  async detect() {
    const checkedAt = new Date().toISOString();
    const bin = which(["blackbox"], "BLACKBOX_BIN");
    if (!bin) return { agentId: "blackbox", installed: false, auth: "unknown", checkedAt };
    const version = await versionOf(bin);
    return {
      agentId: "blackbox",
      installed: true,
      version,
      auth: process.env.BLACKBOX_API_KEY ? "authenticated" : "unknown",
      authDetail: process.env.BLACKBOX_API_KEY ? "BLACKBOX_API_KEY is set" : "No documented status command",
      checkedAt,
    };
  },

  async testConnection() {
    const s = await this.detect();
    if (!s.installed) return { ok: false, detail: "blackbox is not on PATH.", billable: false };
    return { ok: true, detail: `${s.version ?? "Version unknown"}. Installed; authentication cannot be checked without a run.`, billable: false };
  },

  async run(ctx) {
    const bin = which(["blackbox"], "BLACKBOX_BIN");
    if (!bin) return { ok: false, error: "blackbox is not installed.", retries: 0, awaitingManualImport: true };
    // The brief lives in .arena/, which is excluded from the captured diff.
    const briefFile = path.join(ctx.workspaceDir, ".arena", "brief.md");
    fs.mkdirSync(path.dirname(briefFile), { recursive: true });
    fs.writeFileSync(briefFile, ctx.brief);
    const lines: string[] = [];
    ctx.emit({ type: "status", message: "Running blackbox run .arena/brief.md" });
    const res = await runCli(ctx, {
      bin,
      args: ["run", briefFile],
      env: agentEnv(CRED_ENV),
      transcriptFile: path.join(artifactDir(ctx.experimentId, ctx.runId), "transcript.txt"),
      onText: (line, stream) => {
        if (stream === "stdout") lines.push(line);
        ctx.emit({ type: "log", stream, text: line });
      },
    });
    const ok = res.exitCode === 0 && !res.timedOut && !res.cancelled;
    return {
      ok,
      exitCode: res.exitCode,
      summary: lines.slice(-20).join("\n") || undefined,
      retries: 0,
      awaitingManualImport: !ok && !res.cancelled,
      error: ok ? undefined : failureText(res, "blackbox exited with an error."),
    };
  },
};
