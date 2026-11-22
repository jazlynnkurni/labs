import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { execIn, sandboxExecAvailable } from "@/lib/sandbox/exec";

/**
 * Reproduces the real layout: workspaces live inside the home folder
 * (~/.agent-arena/...), which the sandbox otherwise refuses to read.
 */
describe.runIf(sandboxExecAvailable())("macOS sandbox runner", () => {
  const fakeHome = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "arena-home-")));
  const ws = path.join(fakeHome, ".agent-arena", "experiments", "exp_x", "workspaces", "run_x");
  fs.mkdirSync(ws, { recursive: true });
  fs.writeFileSync(path.join(fakeHome, "secret.txt"), "do not read");
  fs.mkdirSync(path.join(fakeHome, ".agent-arena", "experiments", "exp_other"), { recursive: true });
  fs.writeFileSync(path.join(fakeHome, ".agent-arena", "experiments", "exp_other", "x.txt"), "other agent");
  process.env.ARENA_SANDBOX_HOME = fakeHome;
  afterAll(() => {
    delete process.env.ARENA_SANDBOX_HOME;
  });

  it("runs node:test inside a workspace under the home folder", async () => {
    fs.writeFileSync(path.join(ws, "a.test.mjs"), "import test from 'node:test';import assert from 'node:assert';test('ok',()=>assert.ok(true));\n");
    const r = await execIn("host-sandbox", { workspace: ws, command: "node --test", timeoutMs: 60_000 });
    expect(r.stdout + r.stderr).toMatch(/pass 1/);
    expect(r.exitCode).toBe(0);
  });

  it("cannot read files elsewhere in home, including other experiments", async () => {
    const r = await execIn("host-sandbox", {
      workspace: ws,
      command: `cat ${fakeHome}/secret.txt; cat ${fakeHome}/.agent-arena/experiments/exp_other/x.txt; echo done`,
      timeoutMs: 20_000,
    });
    expect(r.stdout).not.toContain("do not read");
    expect(r.stdout).not.toContain("other agent");
    expect(r.stdout).toContain("done");
  });

  it("cannot write outside the workspace", async () => {
    const target = path.join(fakeHome, "written.txt");
    await execIn("host-sandbox", { workspace: ws, command: `echo x > ${target}`, timeoutMs: 20_000 });
    expect(fs.existsSync(target)).toBe(false);
  });

  it("gets an empty environment apart from PATH and its own HOME", async () => {
    process.env.ARENA_TEST_SECRET_TOKEN = "leak-check-123456";
    const r = await execIn("host-sandbox", { workspace: ws, command: "env", timeoutMs: 20_000 });
    expect(r.stdout).not.toContain("leak-check-123456");
    expect(r.stdout).toContain(`HOME=${path.join(ws, ".arena", "home")}`);
  });
});
