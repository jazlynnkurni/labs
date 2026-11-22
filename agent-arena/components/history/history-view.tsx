"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { api } from "@/lib/client/api";
import { buttonVariants } from "@/components/ui/button";
import { agentColor, duration, relative, runLabel, usd } from "@/lib/client/format";
import type { Usage } from "@/lib/agents/types";
import { AgentMark, StatusDot, StatusPill, statusLabel } from "@/components/status";

interface HistoryRun {
  id: string;
  agentId: string;
  agentName: string;
  model?: string;
  status: string;
  durationMs?: number;
  usage?: Usage;
  metrics: Record<string, number | undefined>;
}
interface HistoryExperiment {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  runs: HistoryRun[];
}

function median(xs: number[]) {
  if (!xs.length) return undefined;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export function HistoryView() {
  const [list, setList] = useState<HistoryExperiment[]>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    api<{ experiments: HistoryExperiment[] }>("/api/experiments")
      .then((d) => setList(d.experiments))
      .catch((e) => setError(e.message));
  }, []);

  /** Per agent and model, computed from stored runs only. */
  const performance = useMemo(() => {
    const groups = new Map<string, { agentId: string; label: string; runs: (HistoryRun & { at: string })[] }>();
    for (const e of list ?? []) {
      for (const r of e.runs) {
        if (r.agentId === "dev-fixture") continue;
        const key = `${r.agentId}:${r.model ?? ""}`;
        const g = groups.get(key) ?? { agentId: r.agentId, label: runLabel(r), runs: [] };
        g.runs.push({ ...r, at: e.createdAt });
        groups.set(key, g);
      }
    }
    return [...groups.values()].map((g) => {
      const done = g.runs.filter((r) => ["succeeded", "failed", "timed_out"].includes(r.status));
      const builds = g.runs.map((r) => r.metrics.build_ok).filter((v): v is number => v !== undefined);
      const costs = g.runs.map((r) => r.usage?.costUsd).filter((v): v is number => v !== undefined);
      const times = done.map((r) => r.durationMs).filter((v): v is number => v !== undefined);
      return {
        ...g,
        total: g.runs.length,
        finished: done.filter((r) => r.status === "succeeded").length,
        attempted: done.length,
        buildRate: builds.length ? builds.filter(Boolean).length / builds.length : undefined,
        builds: builds.length,
        medianMs: median(times),
        avgCost: costs.length ? costs.reduce((a, b) => a + b, 0) / costs.length : undefined,
        costs: costs.length,
        last: g.runs[0]?.at,
        timeline: [...g.runs].reverse().slice(-20),
      };
    });
  }, [list]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-12 pb-24 md:px-8 md:pt-20">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Every comparison, kept locally</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">Prompts, snapshots, logs, diffs, screenshots and scores, stored in SQLite on this machine.</p>
      </header>

      {error && <p className="text-sm text-danger">{error}</p>}

      {performance.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-1 text-sm font-medium">Performance over time</h2>
          <p className="mb-3 text-xs text-muted-foreground">From stored runs only. Each square is one run, oldest on the left.</p>
          <div className="scrollbar-thin overflow-x-auto rounded-xl bg-surface shadow-raised">
            <table className="w-full min-w-max border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-hairline text-xs text-faint">
                  {["Agent and model", "Runs", "Finished", "Build passed", "Median time", "Avg reported cost", "Recent runs"].map((h, i) => (
                    <th key={h} scope="col" className={i === 0 ? "px-4 py-2.5 text-left font-medium" : "px-3 py-2.5 text-right font-medium"}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {performance.map((p) => (
                  <tr key={p.label} className="border-b border-hairline last:border-0">
                    <th scope="row" className="px-4 py-2.5 text-left font-normal">
                      <span className="flex items-center gap-2">
                        <AgentMark color={agentColor(p.agentId)} />
                        <span className="max-w-56 truncate">{p.label}</span>
                      </span>
                    </th>
                    <td className="px-3 py-2.5 text-right tnum">{p.total}</td>
                    <td className="px-3 py-2.5 text-right tnum">{p.attempted ? `${p.finished}/${p.attempted}` : "n/a"}</td>
                    <td className="px-3 py-2.5 text-right tnum">{p.buildRate !== undefined ? `${Math.round(p.buildRate * 100)}% of ${p.builds}` : <span className="text-faint">n/a</span>}</td>
                    <td className="px-3 py-2.5 text-right tnum">{p.medianMs !== undefined ? duration(p.medianMs) : <span className="text-faint">n/a</span>}</td>
                    <td className="px-3 py-2.5 text-right tnum">{p.avgCost !== undefined ? `${usd(p.avgCost)} (${p.costs})` : <span className="text-faint">Not reported</span>}</td>
                    <td className="px-3 py-2.5">
                      <span className="flex justify-end gap-0.5">
                        {p.timeline.map((r) => (
                          <span
                            key={r.id}
                            title={`${new Date(r.at).toLocaleString()}, ${statusLabel(r.status).toLowerCase()}${r.durationMs ? `, ${duration(r.durationMs)}` : ""}`}
                            className={
                              r.status === "succeeded" ? (r.metrics.build_ok === 0 ? "size-2.5 rounded-[2px] bg-warning" : "size-2.5 rounded-[2px] bg-success") : r.status === "failed" || r.status === "timed_out" ? "size-2.5 rounded-[2px] bg-danger" : "size-2.5 rounded-[2px] bg-surface-2"
                            }
                          />
                        ))}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-faint">Green finished and built, amber finished but the build failed, red failed or timed out.</p>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-medium">Experiments</h2>
        {!list ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-surface-2/60" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-xl bg-surface p-10 text-center shadow-raised">
            <p className="text-sm">No comparisons yet.</p>
            <Link href="/" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "mt-3")}>
              Start one
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-hairline overflow-hidden rounded-xl bg-surface shadow-raised">
            {list.map((e) => (
              <li key={e.id}>
                <Link href={`/experiments/${e.id}`} className="flex min-h-16 flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors duration-150 [@media(hover:hover)]:hover:bg-accent">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.title}</p>
                    <p className="mt-0.5 text-xs text-faint">{relative(e.createdAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {e.runs.map((r) => (
                      <span key={r.id} className="flex items-center gap-1.5 text-xs text-muted-foreground" title={`${r.agentName}: ${statusLabel(r.status)}`}>
                        <AgentMark color={agentColor(r.agentId)} />
                        <StatusDot status={r.status} />
                      </span>
                    ))}
                  </div>
                  <StatusPill status={e.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
