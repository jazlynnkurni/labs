import { askJev, jevKeyPresent, jevModel, JEV_MAX_BYTES, type JevQuestion } from "@/lib/qa/jev";
import { decisions } from "@/lib/storage/repo";
import { allFinished, clip, isFixture, loadDirections, type DirectionsState } from "./evidence";

export interface JevPick {
  /** True for development fixtures: canned, not from Jev. */
  fixture: boolean;
  model: string;
  choice?: string;
  runId?: string;
  confidence?: number;
  probabilities: Record<string, number>;
  labels: Record<string, string>;
  candidates: number;
  requests: number;
  cached: boolean;
  creditsUsed: number;
}

export const JEV_PICK = "jev-pick";

function question(s: DirectionsState): { q: JevQuestion; labels: Record<string, string> } {
  const labels: Record<string, string> = {};
  for (const d of s.directions.filter((x) => x.hasResult)) labels[d.key] = `Direction ${d.direction}${d.name ? `: ${clip(d.name, 120)}` : ""}`;
  return {
    labels,
    q: {
      type: "choice",
      instructions:
        `These are prototype directions that ${s.agent} built in parallel from the same starting point for the task in state.task. ` +
        "Which one should the designer continue with? Judge fit with the task and with state.designRules first, then the measured evidence " +
        "(build, tests, accessibility, runtime errors, mobile overflow). The designer's own ratings, when present, outrank your reading. Speed and cost do not matter.",
      criteria: labels,
    },
  };
}

/** The state Jev sees, trimmed to stay under the request limit. */
function stateFor(s: DirectionsState, rulesBudget: number) {
  return {
    task: clip(s.task, 4000),
    designRules: s.designContext ? clip(s.designContext, rulesBudget) : "None given.",
    directions: s.directions
      .filter((d) => d.hasResult)
      .map((d) => ({ id: d.key, name: d.name, agentSummary: clip(d.summary, 900), measured: d.measured, designerRatings: d.yourRatings })),
  };
}

export async function letJevHandle(experimentId: string): Promise<JevPick> {
  const s = await loadDirections(experimentId);
  if (!allFinished(s)) throw new Error("Wait until every direction has finished and been evaluated.");
  const { q, labels } = question(s);
  const keys = Object.keys(labels);
  if (keys.length < 2) throw new Error("Jev needs at least two directions with a result to choose between.");
  const runFor = (k?: string) => s.directions.find((d) => d.key === k)?.runId;

  if (isFixture(s)) {
    const even = Object.fromEntries(keys.map((k) => [k, 1 / keys.length]));
    const pick: JevPick = { fixture: true, model: "fixture", choice: keys[0], runId: runFor(keys[0]), probabilities: even, labels, candidates: keys.length, requests: 0, cached: false, creditsUsed: 0 };
    await decisions.add(experimentId, JEV_PICK, pick);
    return pick;
  }
  if (!jevKeyPresent()) throw new Error("Add JEV_API_KEY to .env.local, then restart the arena.");

  let budget = 12_000;
  let state = stateFor(s, budget);
  while (Buffer.byteLength(JSON.stringify({ model: jevModel(), state, questions: { pick: q } })) > JEV_MAX_BYTES - 512 && budget > 1000) {
    budget = Math.floor(budget * 0.6);
    state = stateFor(s, budget);
  }
  const res = await askJev(state, { pick: q });
  const a = res.answers.pick?.answer;
  if (!a) throw new Error("Jev returned no answer for the pick.");
  const pick: JevPick = {
    fixture: false,
    model: jevModel(),
    choice: a.choice,
    runId: runFor(a.choice),
    confidence: a.confidence,
    probabilities: a.probabilities ?? {},
    labels,
    candidates: keys.length,
    requests: res.requests,
    cached: res.answers.pick.cached,
    creditsUsed: res.creditsUsed,
  };
  await decisions.add(experimentId, JEV_PICK, pick);
  return pick;
}
