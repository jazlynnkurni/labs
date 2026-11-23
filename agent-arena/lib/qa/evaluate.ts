import path from "node:path";
import { randomUUID } from "node:crypto";
import { BUTTON_CRITERIA, jevState, type JevCriterion } from "./criteria";
import { extractButtons } from "./extract";
import { askJev, jevKeyPresent, jevModel, JevError } from "./jev";
import { qaDir, saveRun } from "./store";
import type { CriterionResult, QaRun } from "./types";

export interface QaInput {
  fixtureUrl: string;
  brief: string;
  rules: string;
  notes: string;
  useJev: boolean;
}

/**
 * One QA pass on the Button fixture:
 *   1. extract evidence in a headless browser,
 *   2. run every deterministic check in code,
 *   3. ask Jev only the judgment questions, in one batched request, only with enough evidence,
 *   4. save the run. Nothing is changed in the code; fixes are proposed separately, on request.
 */
export async function runButtonQa(input: QaInput): Promise<QaRun> {
  const t0 = Date.now();
  const id = randomUUID().slice(0, 12);
  const evidence = await extractButtons(input.fixtureUrl, path.join(qaDir(), "artifacts", id));
  const model = jevModel();
  const run: QaRun = {
    id,
    component: "Button (components/ui/button.tsx)",
    createdAt: new Date().toISOString(),
    brief: input.brief,
    rules: input.rules,
    notes: input.notes,
    evidence,
    results: [],
    jev: { keyPresent: jevKeyPresent(), model, requests: 0, cachedRequests: 0, creditsUsed: 0 },
    durationMs: 0,
  };

  for (const c of BUTTON_CRITERIA) {
    if (c.method !== "deterministic") continue;
    const v = evidence.extractError && !evidence.buttons.length
      ? { status: "insufficient" as const, reason: `The page could not be measured: ${evidence.extractError}`, evidence: null }
      : c.check(evidence);
    run.results.push({ id: c.id, title: c.title, rule: c.rule, method: c.method, ...v, revision: { status: "open" } });
  }

  const jevCriteria = BUTTON_CRITERIA.filter((c): c is JevCriterion => c.method === "jev");
  const notAsked = (reason: string): CriterionResult[] =>
    jevCriteria.map((c) => ({ id: c.id, title: c.title, rule: c.rule, method: "jev", status: "insufficient", reason, evidence: null, jev: { question: c.question, cached: false, model }, revision: { status: "open" } }));

  if (!evidence.buttons.length) run.results.push(...notAsked("No measurements to judge, so Jev was not asked."));
  else if (!input.useJev) run.results.push(...notAsked("Jev was switched off for this run."));
  else if (!run.jev.keyPresent) run.results.push(...notAsked("No JEV_API_KEY in the server environment, so Jev was not asked."));
  else {
    const state = jevState(evidence, input.brief, input.rules);
    try {
      const res = await askJev(state, Object.fromEntries(jevCriteria.map((c) => [c.id, c.question])));
      run.jev.requests = res.requests;
      run.jev.cachedRequests = res.cachedRequests;
      run.jev.creditsUsed = res.creditsUsed;
      for (const c of jevCriteria) {
        const got = res.answers[c.id];
        const v = got ? c.judge(got.answer) : { status: "insufficient" as const, reason: "Jev returned no answer for this question.", evidence: null };
        run.results.push({ id: c.id, title: c.title, rule: c.rule, method: "jev", ...v, jev: { question: c.question, answer: got?.answer, cached: got?.cached ?? false, model }, revision: { status: "open" } });
      }
    } catch (e) {
      const msg = e instanceof JevError ? e.message : "The Jev request failed.";
      if (e instanceof JevError) run.jev.requests = e.requests;
      run.jev.error = msg;
      run.results.push(...notAsked(`Jev was not answered: ${msg}`));
    }
  }

  run.durationMs = Date.now() - t0;
  saveRun(run);
  return run;
}
