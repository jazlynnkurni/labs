import fs from "node:fs";
import path from "node:path";
import { METRIC_BY_KEY, formatMetric } from "@/lib/evaluation/catalog";
import { experiments, metrics, ratings, runs, type AgentRun, type Experiment } from "@/lib/storage/repo";
import { experimentDir } from "@/lib/storage/paths";
import { directionName } from "./brief";

export interface DirectionEvidence {
  key: string;
  direction: number;
  runId: string;
  name?: string;
  status: AgentRun["status"];
  hasResult: boolean;
  summary?: string;
  /** Automated measurements only, formatted for reading. */
  measured: Record<string, string>;
  /** Jaz's own 1 to 5 ratings, when she gave any. */
  yourRatings: Record<string, number>;
}

export interface DirectionsState {
  experiment: Experiment;
  runs: AgentRun[];
  task: string;
  agent: string;
  directions: DirectionEvidence[];
  designContext?: string;
}

const LIVE = new Set(["queued", "preparing", "running"]);
const clip = (s: string | undefined, n: number) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Everything known about one directions experiment, measured and rated, nothing inferred. */
export async function loadDirections(experimentId: string): Promise<DirectionsState> {
  const experiment = await experiments.get(experimentId);
  if (!experiment) throw new Error("Experiment not found.");
  const cont = experiment.config.continuation;
  if (!cont) throw new Error("This experiment is not a set of directions.");
  const list = (await runs.forExperiment(experimentId)).filter((r) => r.direction).sort((a, b) => a.direction! - b.direction!);
  const ids = list.map((r) => r.id);
  const [ms, rs] = await Promise.all([metrics.forRuns(ids), ratings.forRuns(ids)]);
  const ctxFile = path.join(experimentDir(experimentId), "context.md");
  return {
    experiment,
    runs: list,
    task: cont.task,
    agent: list[0] ? `${list[0].agentName}${list[0].model ? ` (${list[0].model})` : ""}` : "the agent",
    designContext: fs.existsSync(ctxFile) ? fs.readFileSync(ctxFile, "utf8") : undefined,
    directions: list.map((r) => {
      const measured: Record<string, string> = {};
      for (const m of ms.filter((x) => x.agentRunId === r.id && x.source === "measured" && x.valueNum !== undefined)) {
        const def = METRIC_BY_KEY[m.key];
        if (!def || def.dimension === "efficiency") continue;
        measured[def.label] = formatMetric(def, m.valueNum);
      }
      const yourRatings = Object.fromEntries(rs.filter((x) => x.agentRunId === r.id).map((x) => [x.dimension, x.score]));
      return {
        key: `d${r.direction}`,
        direction: r.direction!,
        runId: r.id,
        name: directionName(r.summary),
        status: r.status,
        hasResult: Boolean(r.resultCommit) && r.status === "succeeded",
        summary: clip(r.summary, 1200),
        measured,
        yourRatings,
      };
    }),
  };
}

export const allFinished = (s: DirectionsState) => s.runs.length > 0 && s.runs.every((r) => !LIVE.has(r.status)) && !["running", "evaluating", "preparing", "queued"].includes(s.experiment.status);
export const isFixture = (s: DirectionsState) => s.runs.length > 0 && s.runs.every((r) => r.agentId === "dev-fixture");
export { clip };
