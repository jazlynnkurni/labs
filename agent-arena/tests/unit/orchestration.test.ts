import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { startExperiment, cancel } from "@/lib/orchestration/runner";
import { experiments, runs, events, artifacts, metrics } from "@/lib/storage/repo";
import { DEFAULT_CONSTRAINTS } from "@/lib/orchestration/brief";

async function waitFor(id: string, done: string[], ms = 30_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const e = await experiments.get(id);
    if (e && done.includes(e.status)) return e;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("timed out waiting for experiment");
}

const config = (parallel: boolean) => ({
  agents: [
    { agentId: "dev-fixture" as const, model: "variant-a" },
    { agentId: "dev-fixture" as const, model: "variant-b" },
  ],
  parallel,
  limits: { timeoutMinutes: 1 },
  evaluation: { enabled: false, runner: "off" as const },
  constraints: DEFAULT_CONSTRAINTS,
});

describe("orchestration with the development fixture", () => {
  it("runs agents concurrently in separate workspaces and captures separate diffs", async () => {
    const id = await startExperiment({ prompt: "Build a hello page", config: config(true), source: { kind: "empty" }, files: [{ name: "ref.txt", mime: "text/plain", data: Buffer.from("hello") }] });
    const exp = await waitFor(id, ["done", "failed"]);
    expect(exp.status).toBe("done");
    const list = await runs.forExperiment(id);
    expect(list).toHaveLength(2);
    expect(new Set(list.map((r) => r.workspaceDir)).size).toBe(2);
    for (const r of list) {
      expect(r.status).toBe("succeeded");
      expect(r.resultCommit).toBeTruthy();
      // Same frozen brief, same attachment, in each workspace.
      expect(fs.readFileSync(`${r.workspaceDir}/.arena/attachments/ref.txt`, "utf8")).toBe("hello");
    }
    // Overlapping runs prove concurrency.
    const [a, b] = list;
    expect(Date.parse(a.startedAt!) < Date.parse(b.finishedAt!) && Date.parse(b.startedAt!) < Date.parse(a.finishedAt!)).toBe(true);
    // Variant B wrote a test file; A did not. Diffs are independent.
    const diffs = await Promise.all(list.map((r) => artifacts.forRun(r.id)));
    const files = diffs.map((d) => ((d.find((x) => x.kind === "diff")?.meta.numstat as { file: string }[]) ?? []).map((n) => n.file).sort());
    expect(files[0]).toEqual(["index.html", "package.json"]);
    expect(files[1]).toEqual(["index.html", "package.json", "page.test.mjs"]);
    const ms = await metrics.forRuns(list.map((r) => r.id));
    expect(ms.find((m) => m.agentRunId === a.id && m.key === "files_changed")?.valueNum).toBe(2);
    // Events were persisted for replay.
    expect((await events.since(id)).length).toBeGreaterThan(5);
    expect(exp.brief).toContain("Build a hello page");
    expect(exp.brief).toContain(".arena/attachments/ref.txt");
  });

  it("cancels a running experiment and cleans up", async () => {
    const id = await startExperiment({ prompt: "Slow task", config: config(false), source: { kind: "empty" }, files: [] });
    await new Promise((r) => setTimeout(r, 900));
    expect(cancel(id)).toBe(true);
    const exp = await waitFor(id, ["cancelled", "done", "failed"]);
    expect(exp.status).toBe("cancelled");
    const list = await runs.forExperiment(id);
    expect(list.some((r) => r.status === "cancelled")).toBe(true);
  });

  it("refuses the same agent and model twice", async () => {
    await expect(
      startExperiment({
        prompt: "x",
        config: { ...config(true), agents: [{ agentId: "dev-fixture", model: "variant-a" }, { agentId: "dev-fixture", model: "variant-a" }] },
        source: { kind: "empty" },
        files: [],
      }),
    ).rejects.toThrow(/twice/);
  });
});
