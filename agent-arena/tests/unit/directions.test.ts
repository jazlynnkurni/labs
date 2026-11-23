import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { continueDirections, startExperiment } from "@/lib/orchestration/runner";
import { experiments, grill, runs } from "@/lib/storage/repo";
import { DEFAULT_CONSTRAINTS } from "@/lib/orchestration/brief";
import { briefForDirection, continuationPrompt, directionLine, directionName } from "@/lib/directions/brief";
import { letJevHandle } from "@/lib/directions/jev-pick";
import { grillTurn } from "@/lib/directions/grill";

async function waitFor(id: string, ms = 30_000) {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    const e = await experiments.get(id);
    if (e && ["done", "failed", "cancelled"].includes(e.status)) return e;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("timed out waiting for experiment");
}

const base = {
  agents: [{ agentId: "dev-fixture" as const, model: "variant-a" }],
  parallel: true,
  limits: { timeoutMinutes: 1 },
  evaluation: { enabled: false, runner: "off" as const },
  constraints: DEFAULT_CONSTRAINTS,
};

describe("direction texts", () => {
  it("adds exactly one numbered line to the shared brief", () => {
    expect(briefForDirection("BRIEF", undefined, 5)).toBe("BRIEF");
    expect(briefForDirection("BRIEF", 3, 5)).toBe(`BRIEF\n\n${directionLine(3, 5)}`);
    expect(directionLine(3, 5)).toMatch(/^Direction 3 of 5\./);
    expect(directionLine(3, 5)).not.toContain("—");
  });

  it("keeps the original task and the optional note in the continuation prompt", () => {
    const p = continuationPrompt("Build a tip calculator", "Claude Code", "Make it feel calmer");
    expect(p).toContain("Original task:\nBuild a tip calculator");
    expect(p).toContain("What to push on next:\nMake it feel calmer");
    expect(continuationPrompt("x", "y")).not.toContain("What to push on next");
  });

  it("names a direction from the first line of its final message", () => {
    expect(directionName("**Quiet paper**\n\nI built...")).toBe("Quiet paper");
    expect(directionName("**Direction: the check itself.** The calculator is now a paper receipt")).toBe("The check itself");
    expect(directionName("**Direction 4: the receipt.** The result is a printed receipt")).toBe("The receipt");
    expect(directionName("Direction 2: a printed till receipt, with an exact-cent split")).toBe("A printed till receipt, with an exact-cent split");
    expect(directionName("")).toBeUndefined();
  });
});

describe("continue directions with the development fixture", () => {
  it("continues one run as five directions from its result, then Jev and the Grill answer as labelled fixtures", async () => {
    const parentId = await startExperiment({ prompt: "Build a hello page", config: base, source: { kind: "empty" }, files: [{ name: "ref.txt", mime: "text/plain", data: Buffer.from("hello") }] });
    expect((await waitFor(parentId)).status).toBe("done");
    const [kept] = await runs.forExperiment(parentId);

    const id = await continueDirections(kept.id, { note: "Push the type" });
    const exp = await waitFor(id);
    expect(exp.status).toBe("done");
    expect(exp.title).toBe("Directions from Build a hello page");
    expect(exp.config.continuation).toMatchObject({ fromExperimentId: parentId, fromRunId: kept.id, count: 5, task: "Build a hello page", note: "Push the type" });
    expect(exp.source.commit).toBe(kept.resultCommit);
    expect(exp.differences[0]).toMatch(/same brief plus one line/);

    const list = await runs.forExperiment(id);
    expect(list.map((r) => r.direction)).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(list.map((r) => r.workspaceDir)).size).toBe(5);
    for (const r of list) {
      expect(r.status).toBe("succeeded");
      expect(r.baseCommit).toBe(kept.resultCommit);
      // The kept run's files are the starting point, and the attachment came along.
      expect(fs.existsSync(`${r.workspaceDir}/index.html`)).toBe(true);
      expect(fs.readFileSync(`${r.workspaceDir}/.arena/attachments/ref.txt`, "utf8")).toBe("hello");
    }

    const pick = await letJevHandle(id);
    expect(pick.fixture).toBe(true);
    expect(pick.requests).toBe(0);
    expect(Object.keys(pick.labels)).toEqual(["d1", "d2", "d3", "d4", "d5"]);

    const opening = await grillTurn(id);
    expect(opening).toHaveLength(1);
    expect(opening[0]).toMatchObject({ role: "grill", meta: { fixture: true } });
    const reply = await grillTurn(id, "Why not direction 2?");
    expect(reply.map((m) => m.role)).toEqual(["you", "grill"]);
    expect((await grill.forExperiment(id)).map((m) => m.role)).toEqual(["grill", "you", "grill"]);
    await expect(grillTurn(id)).rejects.toThrow(/reply first/);
  });

  it("refuses a run without a captured result", async () => {
    await expect(continueDirections("run_missing")).rejects.toThrow(/not found/);
  });
});
