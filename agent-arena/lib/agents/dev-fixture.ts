import fs from "node:fs";
import path from "node:path";
import type { AgentAdapter } from "./types";

/**
 * DEVELOPMENT FIXTURE. Not an AI agent.
 *
 * Writes a fixed, tiny static page so the orchestration, diff capture,
 * evaluation and comparison screens can be exercised end to end without a
 * paid call. Hidden unless ARENA_DEV_FIXTURES=1, and every run it produces is
 * labelled as a fixture in the interface. Its results mean nothing.
 */
export const devFixture: AgentAdapter = {
  id: "dev-fixture",
  name: "Scripted fixture",
  vendor: "Development only",
  kind: "local-cli",
  automation: "full",
  docsUrl: "",
  devOnly: true,
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
  limitations: ["Not an AI agent. Writes a canned page to test the pipeline. Never compare its results."],
  setup: [{ label: "Set ARENA_DEV_FIXTURES=1 in .env.local to show it in the composer." }],
  credentialEnv: [],
  models: [
    { id: "variant-a", label: "Variant A (plain)" },
    { id: "variant-b", label: "Variant B (styled, with a test)" },
  ],
  async detect() {
    return { agentId: "dev-fixture", installed: true, version: "fixture", auth: "authenticated", authDetail: "No credentials needed", checkedAt: new Date().toISOString() };
  },
  async testConnection() {
    return { ok: true, detail: "Fixture is built in.", billable: false };
  },
  async run(ctx) {
    const steps = ["Reading the brief", "Writing index.html", "Writing package.json", "Done"];
    const variant = ctx.model === "variant-b" ? "b" : "a";
    for (const step of steps) {
      if (ctx.signal.aborted) return { ok: false, error: "Cancelled", retries: 0 };
      ctx.emit({ type: "status", message: step });
      ctx.emit({ type: "log", stream: "stdout", text: `[fixture] ${step}` });
      await new Promise((r) => setTimeout(r, 400));
    }
    const title = ctx.brief.split("\n")[0].slice(0, 60).replace(/[<>]/g, "");
    const style =
      variant === "b"
        ? "body{font-family:system-ui;margin:0;display:grid;place-items:center;min-height:100vh;background:#0b0b0c;color:#eee}main{max-width:40rem;padding:2rem}h1{font-size:2rem;letter-spacing:-0.02em}"
        : "body{font-family:serif;padding:8px}";
    const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Fixture</title><style>${style}</style></head><body><main><h1>${title}</h1><p>Fixture output, variant ${variant}.</p>${variant === "a" ? '<img src="x.png">' : ""}</main></body></html>`;
    fs.writeFileSync(path.join(ctx.workspaceDir, "index.html"), html);
    const pkg: Record<string, unknown> = {
      name: "fixture",
      private: true,
      scripts: { build: "node -e \"require('fs').mkdirSync('dist',{recursive:true});require('fs').copyFileSync('index.html','dist/index.html')\"" },
    };
    if (variant === "b") {
      (pkg.scripts as Record<string, string>).test = "node --test";
      fs.writeFileSync(
        path.join(ctx.workspaceDir, "page.test.mjs"),
        "import test from 'node:test';import assert from 'node:assert';import fs from 'node:fs';\ntest('has a heading',()=>{assert.match(fs.readFileSync('index.html','utf8'),/<h1>/)});\ntest('has lang',()=>{assert.match(fs.readFileSync('index.html','utf8'),/lang=\"en\"/)});\n",
      );
    }
    fs.writeFileSync(path.join(ctx.workspaceDir, "package.json"), JSON.stringify(pkg, null, 2));
    const summary = `Fixture variant ${variant}: wrote index.html and package.json${variant === "b" ? " and a node:test file" : ""}.`;
    ctx.emit({ type: "message", text: summary });
    return { ok: true, exitCode: 0, summary, retries: 0 };
  },
};
