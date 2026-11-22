import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { startPreview, stopPreview } from "@/lib/sandbox/preview";
import { sandboxExecAvailable } from "@/lib/sandbox/exec";

describe.runIf(sandboxExecAvailable())("preview", () => {
  it("serves index.html directly when the start script ignores PORT", async () => {
    const ws = fs.mkdtempSync(path.join(os.tmpdir(), "arena-preview-"));
    fs.writeFileSync(path.join(ws, "index.html"), "<!doctype html><title>Meadow</title><h1>Meadow</h1>");
    // Like a real agent's script: listens somewhere else (here: never answers at all).
    fs.writeFileSync(path.join(ws, "package.json"), JSON.stringify({ scripts: { start: "sleep 30" } }));
    const p = await startPreview("run_fallback_test", ws, "host-sandbox", { timeoutMs: 2000 });
    try {
      expect(p.kind).toBe("static");
      expect(p.note).toMatch(/start script did not answer/);
      const html = await fetch(p.url).then((r) => r.text());
      expect(html).toContain("<h1>Meadow</h1>");
    } finally {
      await stopPreview("run_fallback_test");
    }
  });

  it("still fails clearly when there is nothing static to fall back to", async () => {
    const ws = fs.mkdtempSync(path.join(os.tmpdir(), "arena-preview-"));
    fs.writeFileSync(path.join(ws, "package.json"), JSON.stringify({ scripts: { start: "sleep 30" } }));
    await expect(startPreview("run_nofallback_test", ws, "host-sandbox", { timeoutMs: 1500 })).rejects.toThrow(/did not answer/);
  });
});
