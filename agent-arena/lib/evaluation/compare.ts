import { METRIC_BY_KEY, RATING_DIMENSIONS, formatMetric, sameValue, type MetricDef } from "./catalog";

/**
 * Pure comparison logic. Given recorded values, it says who leads on each
 * criterion and where results trade off. It never invents a composite score:
 * the ranking for a set of criteria is the average position across those
 * criteria, and runs missing a measurement are reported, not penalised.
 */
export interface CompareRun {
  id: string;
  label: string;
  values: Record<string, number | undefined>;
  ratings: Record<string, number | undefined>;
}

export interface Leader {
  key: string;
  label: string;
  leaders: string[];
  value: string;
  measuredFor: number;
  source: "measured" | "reported" | "manual";
}

export interface Ranked {
  id: string;
  label: string;
  averagePosition?: number;
  criteriaMeasured: number;
  wins: string[];
}

export interface Comparison {
  leaders: Leader[];
  ranking: Ranked[];
  tradeoffs: string[];
  summary: string[];
  missing: string[];
}

type Crit = { key: string; label: string; direction: "higher" | "lower"; kind: "metric" | "rating"; def?: MetricDef };

function criteriaFor(keys: string[]): Crit[] {
  const out: Crit[] = [];
  for (const key of keys) {
    if (key.startsWith("rating:")) {
      const dim = key.slice(7);
      const d = RATING_DIMENSIONS.find((r) => r.key === dim);
      if (d) out.push({ key, label: `${d.label} (your rating)`, direction: "higher", kind: "rating" });
      continue;
    }
    const def = METRIC_BY_KEY[key];
    if (def && def.direction !== "neutral") out.push({ key, label: def.label, direction: def.direction, kind: "metric", def });
  }
  return out;
}

function valueOf(run: CompareRun, c: Crit) {
  return c.kind === "rating" ? run.ratings[c.key.slice(7)] : run.values[c.key];
}

/** Positions with ties (within display precision) sharing the better position (1, 1, 3). */
function positions(runs: CompareRun[], c: Crit) {
  const measured = runs.filter((r) => valueOf(r, c) !== undefined);
  const sorted = [...measured].sort((a, b) => {
    const va = valueOf(a, c)!;
    const vb = valueOf(b, c)!;
    return c.direction === "higher" ? vb - va : va - vb;
  });
  const pos = new Map<string, number>();
  sorted.forEach((r, i) => {
    const prev = sorted[i - 1];
    const tied = prev && (c.kind === "rating" ? valueOf(prev, c) === valueOf(r, c) : sameValue(c.def, valueOf(prev, c)!, valueOf(r, c)!));
    pos.set(r.id, tied ? pos.get(prev.id)! : i + 1);
  });
  return pos;
}

export function compare(runs: CompareRun[], criteriaKeys: string[]): Comparison {
  const crits = criteriaFor(criteriaKeys);
  const leaders: Leader[] = [];
  const missing: string[] = [];
  const posByCrit = new Map<string, Map<string, number>>();

  for (const c of crits) {
    const pos = positions(runs, c);
    posByCrit.set(c.key, pos);
    const measuredFor = pos.size;
    const notMeasured = runs.filter((r) => !pos.has(r.id)).map((r) => r.label);
    if (notMeasured.length && measuredFor) missing.push(`${c.label}: not measured for ${notMeasured.join(", ")}`);
    if (measuredFor < 2) continue;
    const top = runs.filter((r) => pos.get(r.id) === 1);
    if (top.length === measuredFor) continue; // everyone tied: nothing to say
    const v = valueOf(top[0], c)!;
    leaders.push({
      key: c.key,
      label: c.label,
      leaders: top.map((r) => r.label),
      value: c.kind === "rating" ? `${v}/5` : formatMetric(c.def, v),
      measuredFor,
      source: c.kind === "rating" ? "manual" : (c.def?.source ?? "measured"),
    });
  }

  const ranking: Ranked[] = runs.map((r) => {
    const ps: number[] = [];
    const wins: string[] = [];
    for (const c of crits) {
      const pos = posByCrit.get(c.key)!;
      if (pos.size < 2) continue;
      const p = pos.get(r.id);
      if (p === undefined) continue;
      ps.push(p);
      if (p === 1 && leaders.some((l) => l.key === c.key)) wins.push(c.label);
    }
    return {
      id: r.id,
      label: r.label,
      criteriaMeasured: ps.length,
      averagePosition: ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : undefined,
      wins,
    };
  });
  ranking.sort((a, b) => (a.averagePosition ?? Infinity) - (b.averagePosition ?? Infinity));

  // Pairwise trade-offs: A beats B on something and B beats A on something else.
  const tradeoffs: string[] = [];
  for (let i = 0; i < runs.length; i++) {
    for (let j = i + 1; j < runs.length; j++) {
      const a = runs[i];
      const b = runs[j];
      const aBetter: string[] = [];
      const bBetter: string[] = [];
      for (const c of crits) {
        const pos = posByCrit.get(c.key)!;
        const pa = pos.get(a.id);
        const pb = pos.get(b.id);
        if (pa === undefined || pb === undefined || pa === pb) continue;
        (pa < pb ? aBetter : bBetter).push(c.label.toLowerCase());
      }
      if (aBetter.length && bBetter.length) {
        tradeoffs.push(`${a.label} is ahead on ${list(aBetter)}; ${b.label} is ahead on ${list(bBetter)}.`);
      }
    }
  }

  const summary: string[] = [];
  const ranked = ranking.filter((r) => r.averagePosition !== undefined);
  if (!crits.length) summary.push("Pick at least one criterion to compare on.");
  else if (ranked.length < 2) summary.push("Not enough measured results to compare on these criteria yet.");
  else {
    const best = ranked[0];
    const tied = ranked.filter((r) => r.averagePosition === best.averagePosition);
    const usable = crits.filter((c) => (posByCrit.get(c.key)?.size ?? 0) >= 2).length;
    if (tied.length > 1) {
      summary.push(`${list(tied.map((t) => t.label))} are level on the ${usable} criteria that were measured for more than one agent.`);
    } else {
      summary.push(
        `On the ${usable} selected criteria measured for more than one agent, ${best.label} has the best average position (${best.averagePosition!.toFixed(1)})` +
          (best.wins.length ? `, leading on ${list(best.wins.map((w) => w.toLowerCase()))}.` : "."),
      );
    }
    if (tradeoffs.length) summary.push("This is not a clear overall win; see the trade-offs below.");
    if (missing.length) summary.push("Some results are missing measurements, which can change the picture.");
  }

  return { leaders, ranking, tradeoffs, summary, missing };
}

function list(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
