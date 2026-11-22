import { describe, expect, it } from "vitest";
import { startExperiment } from "@/lib/orchestration/runner";
import { experiments, runs, metrics, artifacts } from "@/lib/storage/repo";
import { sandboxExecAvailable } from "@/lib/sandbox/exec";

describe.runIf(sandboxExecAvailable())("evaluation in the macOS sandbox", () => {
  it("installs, builds, tests, serves and screenshots each result", async () => {
    const id = await startExperiment({
      prompt: "Build a hello page",
      config: {
        agents: [
          { agentId: "dev-fixture", model: "variant-a" },
          { agentId: "dev-fixture", model: "variant-b" },
        ],
        parallel: true,
        limits: { timeoutMinutes: 2 },
        evaluation: { enabled: true, runner: "host-sandbox" },
        constraints: "",
      },
      source: { kind: "empty" },
      files: [],
    });
    const end = Date.now() + 170_000;
    let status = "";
    while (Date.now() < end) {
      status = (await experiments.get(id))!.status;
      if (["done", "failed", "cancelled"].includes(status)) break;
      await new Promise((r) => setTimeout(r, 500));
    }
    expect(status).toBe("done");
    const list = await runs.forExperiment(id);
    const ms = await metrics.forRuns(list.map((r) => r.id));
    const get = (runId: string, key: string) => ms.find((m) => m.agentRunId === runId && m.key === key)?.valueNum;
    const [a, b] = list;
    expect(get(a.id, "build_ok")).toBe(1);
    expect(get(b.id, "build_ok")).toBe(1);
    expect(get(b.id, "tests_passed")).toBe(2);
    expect(get(b.id, "tests_failed")).toBe(0);
    expect(get(a.id, "tests_passed")).toBeUndefined(); // no test script: not measured, not zero
    expect(get(a.id, "preview_ok")).toBe(1);
    // Variant A has an <img> with no alt and a missing image: both measurable.
    expect(get(a.id, "a11y_violations")).toBeGreaterThan(0);
    expect(get(a.id, "failed_requests")).toBeGreaterThan(0);
    const shots = (await artifacts.forRun(a.id)).filter((x) => x.kind === "screenshot");
    expect(shots.map((s) => s.label).sort()).toEqual(["desktop", "mobile"]);
  }, 200_000);
});
