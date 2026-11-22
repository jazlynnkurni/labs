"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, FileWarning } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/client/api";
import { agentColor, runLabel } from "@/lib/client/format";
import type { RunView } from "@/lib/client/types";
import { DIMENSION_LABEL, METRICS, METRIC_BY_KEY, RATING_DIMENSIONS, formatMetric, sameValue, type Dimension } from "@/lib/evaluation/catalog";
import { compare } from "@/lib/evaluation/compare";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AgentMark, SourceTag, StatusDot } from "@/components/status";
import { SwapChevron } from "@/components/chevron";

const DEFAULT_CRITERIA = ["build_ok", "test_pass_rate", "type_errors", "runtime_errors", "a11y_serious", "mobile_overflow", "duration_ms", "cost_usd"];

function valuesOf(run: RunView) {
  const v: Record<string, number | undefined> = {};
  for (const m of run.metrics) v[m.key] = m.valueNum;
  return v;
}

function ratingsOf(run: RunView) {
  const r: Record<string, number | undefined> = {};
  for (const x of run.ratings) r[x.dimension] = x.score;
  return r;
}

export function EvalDashboard({ runs, onChange }: { runs: RunView[]; onChange: () => void }) {
  const [criteria, setCriteria] = useState<string[]>(DEFAULT_CRITERIA);
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>();
  const [pair, setPair] = useState<[string, string]>(() => [runs[0]?.id ?? "", runs[1]?.id ?? ""]);
  const [testsFor, setTestsFor] = useState<RunView>();

  const compareRuns = useMemo(() => runs.map((r) => ({ id: r.id, label: runLabel(r), values: valuesOf(r), ratings: ratingsOf(r) })), [runs]);
  const result = useMemo(() => compare(compareRuns, criteria), [compareRuns, criteria]);

  const columns = criteria.filter((k) => METRIC_BY_KEY[k]);
  const sorted = useMemo(() => {
    if (!sort) return runs;
    return [...runs].sort((a, b) => {
      const va = valuesOf(a)[sort.key];
      const vb = valuesOf(b)[sort.key];
      if (va === undefined && vb === undefined) return 0;
      if (va === undefined) return 1;
      if (vb === undefined) return -1;
      return sort.dir === "asc" ? va - vb : vb - va;
    });
  }, [runs, sort]);

  const best = (key: string) => {
    const def = METRIC_BY_KEY[key];
    if (!def || def.direction === "neutral") return undefined;
    const vals = runs.map((r) => valuesOf(r)[key]).filter((v): v is number => v !== undefined);
    if (vals.length < 2) return undefined;
    const top = def.direction === "higher" ? Math.max(...vals) : Math.min(...vals);
    // If every value is within display precision of the best, nobody leads.
    if (vals.every((v) => sameValue(def, v, top))) return undefined;
    return top;
  };

  if (runs.length === 0) return <p className="text-sm text-faint">No runs.</p>;

  return (
    <div className="flex flex-col gap-10">
      {/* Criteria */}
      <section>
        <h3 className="mb-1 text-sm font-medium">Compare on</h3>
        <p className="mb-3 text-xs text-muted-foreground">The summary only uses what you pick here. Missing measurements are reported, never counted as losses.</p>
        <div className="flex flex-col gap-3">
          {(Object.keys(DIMENSION_LABEL) as Dimension[]).map((dim) => (
            <div key={dim} className="flex flex-wrap items-center gap-1.5">
              <span className="w-28 shrink-0 text-xs text-faint">{DIMENSION_LABEL[dim]}</span>
              {METRICS.filter((m) => m.dimension === dim && m.direction !== "neutral").map((m) => (
                <Chip key={m.key} on={criteria.includes(m.key)} onClick={() => setCriteria(toggle(criteria, m.key))} title={m.help}>
                  {m.label}
                </Chip>
              ))}
              {dim === "design" &&
                RATING_DIMENSIONS.slice(0, 6).map((d) => (
                  <Chip key={d.key} on={criteria.includes(`rating:${d.key}`)} onClick={() => setCriteria(toggle(criteria, `rating:${d.key}`))} title="Your rating">
                    {d.label} <OpinionDot />
                  </Chip>
                ))}
              {dim === "engineering" &&
                RATING_DIMENSIONS.slice(6, 8).map((d) => (
                  <Chip key={d.key} on={criteria.includes(`rating:${d.key}`)} onClick={() => setCriteria(toggle(criteria, `rating:${d.key}`))} title="Your rating">
                    {d.label} <OpinionDot />
                  </Chip>
                ))}
              {dim === "functionality" &&
                RATING_DIMENSIONS.slice(8).map((d) => (
                  <Chip key={d.key} on={criteria.includes(`rating:${d.key}`)} onClick={() => setCriteria(toggle(criteria, `rating:${d.key}`))} title="Your rating">
                    {d.label} <OpinionDot />
                  </Chip>
                ))}
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-faint">
          <OpinionDot /> marks your own ratings, which are opinions.
        </p>
      </section>

      {/* Summary */}
      <section className="rounded-xl bg-surface p-5 shadow-raised">
        <h3 className="text-sm font-medium">Summary for the selected criteria</h3>
        <div className="mt-3 flex flex-col gap-1.5 text-[13px] leading-relaxed">
          {result.summary.map((s) => (
            <p key={s}>{s}</p>
          ))}
        </div>
        {result.leaders.length > 0 && (
          <ul className="mt-4 grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">
            {result.leaders.map((l) => (
              <li key={l.key} className="flex min-w-0 items-baseline gap-2">
                <span className="w-32 shrink-0 truncate text-muted-foreground">{l.label}</span>
                <span className="min-w-0 truncate">{l.leaders.join(", ")}</span>
                <span className="ml-auto shrink-0 text-xs text-faint tnum">{l.value}</span>
              </li>
            ))}
          </ul>
        )}
        {result.tradeoffs.length > 0 && (
          <div className="mt-5">
            <h4 className="mb-1.5 text-xs font-medium text-faint">Trade-offs</h4>
            <ul className="flex flex-col gap-1 text-[13px] text-muted-foreground">
              {result.tradeoffs.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
        )}
        {result.missing.length > 0 && (
          <details className="mt-4 text-xs text-faint">
            <summary className="flex h-6 cursor-pointer items-center gap-1.5 [@media(hover:hover)]:hover:text-foreground">
              Missing measurements ({result.missing.length})
              <SwapChevron className="[&>svg]:size-3" />
            </summary>
            <ul className="mt-1.5 flex flex-col gap-0.5">
              {result.missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* Table */}
      <section>
        <h3 className="mb-3 text-sm font-medium">Results</h3>
        <div className="scrollbar-thin overflow-x-auto rounded-xl bg-surface shadow-raised">
          <table className="w-full min-w-max border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-hairline">
                <th scope="col" className="sticky left-0 z-10 bg-surface px-4 py-2.5 text-left text-xs font-medium text-faint">
                  Agent
                </th>
                {columns.map((key) => {
                  const def = METRIC_BY_KEY[key];
                  const active = sort?.key === key;
                  return (
                    <th key={key} scope="col" className="px-3 py-2 text-right align-bottom" aria-sort={active ? (sort!.dir === "asc" ? "ascending" : "descending") : "none"}>
                      <button
                        onClick={() => setSort(active && sort!.dir === "desc" ? { key, dir: "asc" } : { key, dir: "desc" })}
                        className="ml-auto flex flex-col items-end gap-0.5 whitespace-nowrap"
                        title={def.help}
                      >
                        <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          {def.label}
                          {active ? sort!.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ChevronsUpDown className="size-3 text-faint" />}
                        </span>
                        <SourceTag source={def.source} />
                      </button>
                    </th>
                  );
                })}
                <th scope="col" className="px-3 py-2.5 text-right text-xs font-medium text-faint">
                  Tests
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((r) => {
                const v = valuesOf(r);
                return (
                  <tr key={r.id} className="border-b border-hairline last:border-0">
                    <th scope="row" className="sticky left-0 z-10 bg-surface px-4 py-2.5 text-left font-normal">
                      <span className="flex min-w-0 items-center gap-2">
                        <AgentMark color={agentColor(r.agentId)} />
                        <span className="max-w-48 truncate">{runLabel(r)}</span>
                        <StatusDot status={r.status} />
                      </span>
                    </th>
                    {columns.map((key) => {
                      const b = best(key);
                      const val = v[key];
                      return (
                        <td key={key} className={cn("px-3 py-2.5 text-right whitespace-nowrap tnum", val === undefined && "text-faint", val !== undefined && b !== undefined && sameValue(METRIC_BY_KEY[key], val, b) && "font-semibold text-success")}>
                          {formatMetric(METRIC_BY_KEY[key], val)}
                        </td>
                      );
                    })}
                    <td className="px-3 py-2.5 text-right">
                      {r.artifacts.some((a) => a.kind === "report") ? (
                        <button onClick={() => setTestsFor(r)} className="inline-flex items-center gap-1 text-xs text-muted-foreground [@media(hover:hover)]:hover:text-foreground">
                          <FileWarning className="size-3.5" strokeWidth={1.75} />
                          Report
                        </button>
                      ) : (
                        <span className="text-xs text-faint">n/a</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-faint">Bold green marks the best measured value in a column. n/a means it was not measured, not that it failed.</p>
      </section>

      {/* Head to head */}
      {runs.length >= 2 && (
        <section>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="mr-2 text-sm font-medium">Head to head</h3>
            <RunSelect runs={runs} value={pair[0]} onChange={(v) => setPair([v, pair[1]])} />
            <span className="text-xs text-faint">vs</span>
            <RunSelect runs={runs} value={pair[1]} onChange={(v) => setPair([pair[0], v])} />
          </div>
          <HeadToHead a={runs.find((r) => r.id === pair[0])} b={runs.find((r) => r.id === pair[1])} />
        </section>
      )}

      {/* Ratings */}
      <section>
        <h3 className="text-sm font-medium">Your ratings</h3>
        <p className="mt-1 mb-3 text-xs text-muted-foreground">Subjective, 1 to 5. Stored with the experiment and labelled as your opinion everywhere they appear.</p>
        <div className="scrollbar-thin overflow-x-auto rounded-xl bg-surface shadow-raised">
          <table className="w-full min-w-max border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-hairline">
                <th scope="col" className="px-4 py-2.5 text-left text-xs font-medium text-faint">
                  Dimension
                </th>
                {runs.map((r) => (
                  <th key={r.id} scope="col" className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <AgentMark color={agentColor(r.agentId)} />
                      <span className="max-w-36 truncate">{runLabel(r)}</span>
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RATING_DIMENSIONS.map((d) => (
                <tr key={d.key} className="border-b border-hairline last:border-0">
                  <th scope="row" className="px-4 py-2 text-left font-normal text-muted-foreground">
                    {d.label}
                  </th>
                  {runs.map((r) => (
                    <td key={r.id} className="px-3 py-2">
                      <Rating run={r} dimension={d.key} label={d.label} onChange={onChange} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <TestReport run={testsFor} onClose={() => setTestsFor(undefined)} />
    </div>
  );
}

/** Marks a criterion that is your own rating, not a measurement. */
function OpinionDot() {
  return <span aria-hidden className="inline-block size-1.5 shrink-0 rounded-full bg-warning align-middle" />;
}

function toggle(list: string[], key: string) {
  return list.includes(key) ? list.filter((k) => k !== key) : [...list, key];
}

function Chip({ on, onClick, children, title }: { on: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-pressed={on}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-xs whitespace-nowrap transition-colors duration-150",
        on ? "bg-foreground text-background" : "bg-surface-2 text-muted-foreground [@media(hover:hover)]:hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function RunSelect({ runs, value, onChange }: { runs: RunView[]; value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(String(v))} items={runs.map((r) => ({ value: r.id, label: runLabel(r) }))}>
      <SelectTrigger size="sm" className="w-56 max-w-full" aria-label="Pick a run">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {runs.map((r) => (
          <SelectItem key={r.id} value={r.id}>
            {runLabel(r)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function HeadToHead({ a, b }: { a?: RunView; b?: RunView }) {
  if (!a || !b || a.id === b.id) return <p className="text-sm text-faint">Pick two different runs.</p>;
  const va = valuesOf(a);
  const vb = valuesOf(b);
  const keys = METRICS.filter((m) => va[m.key] !== undefined || vb[m.key] !== undefined);
  const shotA = a.artifacts.find((x) => x.kind === "screenshot" && x.label === "desktop");
  const shotB = b.artifacts.find((x) => x.kind === "screenshot" && x.label === "desktop");
  return (
    <div className="flex flex-col gap-4">
      {(shotA || shotB) && (
        <div className="grid gap-3 md:grid-cols-2">
          {[
            { r: a, s: shotA },
            { r: b, s: shotB },
          ].map(({ r, s }) => (
            <figure key={r.id} className="min-w-0">
              <div className="aspect-[1440/900] overflow-hidden rounded-lg bg-surface-2 outline outline-1 -outline-offset-1 outline-media-outline">
                {/* eslint-disable-next-line @next/next/no-img-element -- local artifact */}
                {s ? <img src={`/api/artifacts/${s.id}`} alt={`${r.agentName} desktop`} className="size-full object-cover object-top" /> : <span className="grid size-full place-items-center text-xs text-faint">No screenshot</span>}
              </div>
              <figcaption className="mt-1.5 truncate text-xs text-muted-foreground">{runLabel(r)}</figcaption>
            </figure>
          ))}
        </div>
      )}
      <div className="overflow-hidden rounded-xl bg-surface shadow-raised">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-hairline text-xs text-faint">
              <th scope="col" className="px-4 py-2 text-left font-medium">
                Metric
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                <span className="inline-block max-w-32 truncate align-bottom">{runLabel(a)}</span>
              </th>
              <th scope="col" className="px-3 py-2 text-right font-medium">
                <span className="inline-block max-w-32 truncate align-bottom">{runLabel(b)}</span>
              </th>
              <th scope="col" className="px-4 py-2 text-left font-medium">
                Ahead
              </th>
            </tr>
          </thead>
          <tbody>
            {keys.map((m) => {
              const x = va[m.key];
              const y = vb[m.key];
              let ahead = "";
              if (x !== undefined && y !== undefined && !sameValue(m, x, y) && m.direction !== "neutral") {
                const aWins = m.direction === "higher" ? x > y : x < y;
                ahead = runLabel(aWins ? a : b);
              }
              return (
                <tr key={m.key} className="border-b border-hairline last:border-0">
                  <th scope="row" className="px-4 py-2 text-left font-normal text-muted-foreground">
                    {m.label}
                  </th>
                  <td className={cn("px-3 py-2 text-right tnum", x === undefined && "text-faint")}>{formatMetric(m, x)}</td>
                  <td className={cn("px-3 py-2 text-right tnum", y === undefined && "text-faint")}>{formatMetric(m, y)}</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{ahead || <span className="text-faint">{m.direction === "neutral" ? "n/a" : x === undefined || y === undefined ? "Not measured for both" : "Level"}</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Rating({ run, dimension, label, onChange }: { run: RunView; dimension: string; label: string; onChange: () => void }) {
  const current = run.ratings.find((r) => r.dimension === dimension)?.score;
  const [hover, setHover] = useState<number>();
  async function set(score: number | null) {
    try {
      await api(`/api/runs/${run.id}/rating`, { method: "POST", json: { dimension, score } });
      onChange();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  const shown = hover ?? current ?? 0;
  return (
    <div className="flex items-center" role="radiogroup" aria-label={`${label} for ${run.agentName}`} onMouseLeave={() => setHover(undefined)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          role="radio"
          aria-checked={current === n}
          aria-label={`${n} of 5`}
          onMouseEnter={() => setHover(n)}
          onClick={() => set(current === n ? null : n)}
          className="grid size-7 place-items-center"
        >
          <span className={cn("size-2.5 rounded-full transition-colors duration-150", n <= shown ? "bg-warning" : "bg-surface-2 ring-1 ring-hairline")} />
        </button>
      ))}
    </div>
  );
}

function TestReport({ run, onClose }: { run?: RunView; onClose: () => void }) {
  const [report, setReport] = useState<{ steps?: { name: string; ok?: boolean; output?: string; skipped?: string; durationMs?: number }[]; browser?: { viewport: string; consoleErrors: string[]; pageErrors: string[]; failedRequests: string[]; a11y?: { rules: { id: string; impact: string; nodes: number; help: string }[] } }[] }>();
  const artId = run?.artifacts.find((a) => a.kind === "report")?.id;
  useEffect(() => {
    if (!artId) return;
    let alive = true;
    fetch(`/api/artifacts/${artId}`)
      .then((r) => r.json())
      .then((d) => alive && setReport(d))
      .catch(() => alive && setReport({}));
    return () => {
      alive = false;
      setReport(undefined);
    };
  }, [artId]);
  return (
    <Dialog open={Boolean(run)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{run ? runLabel(run) : ""} evaluation report</DialogTitle>
          <DialogDescription>Raw output from each step and every browser finding. Measured, not judged.</DialogDescription>
        </DialogHeader>
        {!report ? (
          <p className="text-sm text-faint">Loading</p>
        ) : (
          <div className="flex flex-col gap-4 text-[13px]">
            {report.steps?.map((s, i) => (
              <details key={i} open={s.ok === false} className="rounded-lg bg-surface-2/60 p-3">
                <summary className="flex h-6 cursor-pointer items-center gap-2">
                  <span className={cn("size-2 rounded-full", s.skipped ? "bg-faint" : s.ok ? "bg-success" : "bg-danger")} />
                  <span className="capitalize">{s.name}</span>
                  <span className="min-w-0 truncate text-xs text-faint">{s.skipped ?? (s.ok ? "passed" : "failed")}</span>
                  <SwapChevron className="ml-auto text-faint" />
                </summary>
                {s.output && <pre className="scrollbar-thin mt-2 max-h-72 overflow-auto font-mono text-[11.5px] leading-5 whitespace-pre-wrap text-muted-foreground">{s.output}</pre>}
              </details>
            ))}
            {report.browser?.map((b) => (
              <div key={b.viewport} className="rounded-lg bg-surface-2/60 p-3">
                <p className="font-medium capitalize">{b.viewport}</p>
                {[...b.pageErrors, ...b.consoleErrors].length > 0 && (
                  <ul className="mt-2 flex flex-col gap-0.5 font-mono text-[11.5px] text-danger">
                    {[...b.pageErrors, ...b.consoleErrors].map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                )}
                {b.failedRequests.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-0.5 font-mono text-[11.5px] text-warning">
                    {b.failedRequests.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                )}
                {b.a11y && b.a11y.rules.length > 0 && (
                  <ul className="mt-2 flex flex-col gap-0.5 text-xs text-muted-foreground">
                    {b.a11y.rules.map((r) => (
                      <li key={r.id}>
                        <span className="text-foreground capitalize">{r.impact}</span>: {r.help} ({r.nodes})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
