"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/client/api";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { SwapChevron } from "@/components/chevron";
import type { CriterionResult, ManualVerdict, QaRun, QaStatus } from "@/lib/qa/types";

interface Overview {
  runs: QaRun[];
  jev: { keyPresent: boolean; model: string };
  defaults: { brief: string; rules: string };
}

const STATUS_LABEL: Record<QaStatus, string> = { pass: "Passed", review: "Needs review", insufficient: "Not enough evidence" };
const STATUS_TONE: Record<QaStatus, string> = { pass: "bg-success", review: "bg-warning", insufficient: "bg-surface-2 ring-1 ring-hairline" };

export function QaView() {
  const [data, setData] = useState<Overview>();
  const [selected, setSelected] = useState<string>();
  const [brief, setBrief] = useState("");
  const [rules, setRules] = useState("");
  const [notes, setNotes] = useState("");
  const [useJev, setUseJev] = useState(true);
  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState<string>();

  useEffect(() => {
    api<Overview>("/api/qa")
      .then((d) => {
        setData(d);
        setBrief(d.defaults.brief);
        setRules(d.defaults.rules);
        setSelected(d.runs[0]?.id);
      })
      .catch((e) => toast.error((e as Error).message));
  }, []);

  const run = data?.runs.find((r) => r.id === selected);
  const proposingId = run?.results.some((x) => x.revision.status === "proposing") ? run.id : undefined;

  useEffect(() => {
    if (!proposingId) return;
    const t = setInterval(() => {
      api<{ run: QaRun }>(`/api/qa/${proposingId}`)
        .then(({ run: fresh }) => {
          if (fresh.results.some((x) => x.revision.status === "proposing")) return;
          setData((d) => (d ? { ...d, runs: d.runs.map((x) => (x.id === fresh.id ? fresh : x)) } : d));
        })
        .catch(() => undefined);
    }, 3000);
    return () => clearInterval(t);
  }, [proposingId]);

  const replaceRun = (r: QaRun) => setData((d) => (d ? { ...d, runs: d.runs.map((x) => (x.id === r.id ? r : x)) } : d));

  async function startRun() {
    setRunning(true);
    try {
      const { run } = await api<{ run: QaRun }>("/api/qa", { method: "POST", json: { brief, rules, notes, useJev } });
      setData((d) => (d ? { ...d, runs: [run, ...d.runs] } : d));
      setSelected(run.id);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRunning(false);
    }
  }

  async function post(path: string, body: unknown, key: string) {
    if (!run) return;
    setBusy(key);
    const criterionId = (body as { criterionId?: string }).criterionId;
    if (path === "propose" && criterionId) {
      // Answer the press at once: the row switches to proposing before the server replies.
      replaceRun({ ...run, results: run.results.map((x) => (x.id === criterionId ? { ...x, revision: { status: "proposing", at: new Date().toISOString() } } : x)) });
    }
    try {
      const res = await api<{ run: QaRun }>(`/api/qa/${run.id}/${path}`, { method: "POST", json: body });
      replaceRun(res.run);
      if (path === "propose") {
        const f = res.run.results.find((x) => x.id === criterionId);
        if (f?.revision.status === "proposed") toast.success(`Proposal ready: ${f.title}`);
        else if (f?.revision.error) toast.error(f.revision.error);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(undefined);
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-10 md:px-16">
      <h1 className="text-xl font-semibold tracking-tight text-balance">Design QA</h1>
      <p className="mt-1 max-w-2xl text-sm text-pretty text-muted-foreground">
        Checks the Button against a brief and your rules. Measurable rules run in code; judgments go to Jev. Fixes are proposed by Claude Code, read-only, and never applied for you.
      </p>

      <section className="mt-8 grid gap-6 rounded-xl border border-hairline p-6 shadow-raised md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Design brief
          <Textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={6} />
        </label>
        <div className="flex flex-col gap-2">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Implementation notes
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} placeholder="What changed, the commit, anything a reviewer should know" />
          </label>
        </div>
        <details className="group md:col-span-2">
          <summary className="flex h-8 cursor-default list-none items-center gap-1.5 text-sm font-medium">
            Design-system rules
            <span className="text-xs font-normal text-muted-foreground tnum">{rules.length.toLocaleString()} characters, the first 6,000 go to Jev</span>
            <SwapChevron />
          </summary>
          <Textarea className="mt-2 font-mono text-xs" value={rules} onChange={(e) => setRules(e.target.value)} rows={10} />
        </details>
        <div className="flex flex-wrap items-center justify-between gap-4 md:col-span-2">
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={useJev && Boolean(data?.jev.keyPresent)} onCheckedChange={setUseJev} disabled={!data?.jev.keyPresent} />
            Ask Jev the judgment questions
            <span className="text-xs text-muted-foreground">
              {data ? (data.jev.keyPresent ? `${data.jev.model}, one request per run, cached` : "No JEV_API_KEY in .env.local yet") : ""}
            </span>
          </label>
          <Button onClick={startRun} disabled={running || !brief.trim()}>
            {running && <Loader2 className="animate-spin" />}
            {running ? "Running QA" : "Run QA on Button"}
          </Button>
        </div>
      </section>

      {data && data.runs.length > 0 && (
        <section className="mt-12">
          <div className="flex flex-wrap items-center gap-2">
            {data.runs.slice(0, 8).map((r) => (
              <button
                key={r.id}
                onClick={() => setSelected(r.id)}
                className={cn(
                  "flex h-8 items-center gap-2 rounded-full px-3 text-xs whitespace-nowrap text-muted-foreground transition-colors [@media(hover:hover)]:hover:text-foreground",
                  r.id === selected && "bg-surface-2 text-foreground",
                )}
              >
                <span className="tnum">{new Date(r.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                <Counts results={r.results} />
              </button>
            ))}
          </div>
          {run && <RunDetail run={run} busy={busy} post={post} />}
        </section>
      )}
    </div>
  );
}

function Counts({ results }: { results: CriterionResult[] }) {
  const n = (s: QaStatus) => results.filter((r) => r.status === s).length;
  return (
    <span className="flex items-center gap-1.5 tnum">
      {(["pass", "review", "insufficient"] as QaStatus[]).map((s) => (
        <span key={s} className="flex items-center gap-1">
          <span className={cn("size-2 rounded-full", STATUS_TONE[s])} />
          {n(s)}
        </span>
      ))}
    </span>
  );
}

/** Manual against automated: agreement counts only where both gave a verdict. */
function agreement(results: CriterionResult[], method: "deterministic" | "jev") {
  const judged = results.filter((r) => r.method === method && r.manual && r.manual.verdict !== "unsure" && r.status !== "insufficient");
  const agree = judged.filter((r) => (r.status === "pass") === (r.manual!.verdict === "pass")).length;
  return { agree, total: judged.length };
}

function RunDetail({ run, busy, post }: { run: QaRun; busy?: string; post: (path: string, body: unknown, key: string) => Promise<void> }) {
  const det = useMemo(() => agreement(run.results, "deterministic"), [run.results]);
  const jev = useMemo(() => agreement(run.results, "jev"), [run.results]);
  return (
    <div className="mt-6">
      <dl className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm md:grid-cols-4">
        <Stat label="Passed" value={run.results.filter((r) => r.status === "pass").length} />
        <Stat label="Needs review" value={run.results.filter((r) => r.status === "review").length} />
        <Stat label="Not enough evidence" value={run.results.filter((r) => r.status === "insufficient").length} />
        <Stat label="Jev requests" value={run.jev.requests} sub={`${run.jev.cachedRequests} cached, ${run.jev.creditsUsed} credits`} />
        <Stat label="Code vs you" value={det.total ? `${det.agree} of ${det.total}` : "n/a"} />
        <Stat label="Jev vs you" value={jev.total ? `${jev.agree} of ${jev.total}` : "n/a"} />
        <Stat label="Buttons measured" value={run.evidence.buttons.length} />
        <Stat label="Run took" value={`${(run.durationMs / 1000).toFixed(1)}s`} />
      </dl>
      {run.jev.error && <p className="mt-4 text-sm text-warning">{run.jev.error}</p>}
      {run.evidence.extractError && <p className="mt-4 text-sm text-warning">{run.evidence.extractError}</p>}

      {run.evidence.screenshot && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/qa/${run.id}/screenshot`} alt="The Button fixture as measured" className="mt-8 w-full rounded-xl outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10" />
      )}

      <ul className="mt-8 divide-y divide-hairline border-y border-hairline">
        {run.results.map((r) => (
          <Row key={r.id} r={r} busy={busy} post={post} />
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div>
      <dt className="truncate text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-base font-medium tnum">{value}</dd>
      {sub && <dd className="text-xs text-muted-foreground tnum">{sub}</dd>}
    </div>
  );
}

function Row({ r, busy, post }: { r: CriterionResult; busy?: string; post: (path: string, body: unknown, key: string) => Promise<void> }) {
  const verdict = (v: ManualVerdict) => post("manual", { criterionId: r.id, verdict: r.manual?.verdict === v ? null : v }, `${r.id}:manual`);
  const proposing = r.revision.status === "proposing" || busy === `${r.id}:propose`;
  return (
    <li className="grid gap-3 py-4 md:grid-cols-[220px_1fr_auto] md:items-start">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 shrink-0 rounded-full", STATUS_TONE[r.status])} />
          <span className="truncate text-sm font-medium">{r.title}</span>
        </div>
        <p className="mt-1 pl-4 text-xs text-muted-foreground">
          {STATUS_LABEL[r.status]}, {r.method === "jev" ? `Jev${r.jev?.cached ? ", cached" : ""}` : "code"}
        </p>
      </div>
      <div className="min-w-0 text-sm">
        <p className="text-pretty">{r.reason}</p>
        <p className="mt-1 text-xs text-muted-foreground">{r.rule}</p>
        <details className="mt-2">
          <summary className="flex h-6 w-fit cursor-default list-none items-center gap-1 text-xs text-muted-foreground">
            Evidence
            <SwapChevron />
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-surface-2/60 p-3 font-mono text-xs">{JSON.stringify(r.jev ? { answer: r.jev.answer, question: r.jev.question } : r.evidence, null, 2)}</pre>
        </details>
        {r.revision.proposal && (
          <details className="mt-2" open={r.revision.status === "proposed"}>
            <summary className="flex h-6 w-fit cursor-default list-none items-center gap-1 text-xs text-muted-foreground">
              Proposed fix from Claude Code{r.revision.costUsd !== undefined ? `, $${r.revision.costUsd.toFixed(2)}` : ""}
              <SwapChevron />
            </summary>
            <pre className="mt-2 max-h-96 overflow-auto rounded-lg bg-surface-2/60 p-3 font-mono text-xs whitespace-pre-wrap">{r.revision.proposal}</pre>
          </details>
        )}
        {proposing && <ProposingNote since={r.revision.at} />}
        {r.revision.error && !proposing && <p className="mt-2 text-xs text-warning">{r.revision.error}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <div className="flex items-center gap-1" role="group" aria-label="Your verdict">
          {(["pass", "fail", "unsure"] as ManualVerdict[]).map((v) => (
            <Button key={v} size="sm" variant={r.manual?.verdict === v ? "secondary" : "ghost"} onClick={() => verdict(v)} disabled={busy === `${r.id}:manual`}>
              {v === "pass" ? "Pass" : v === "fail" ? "Fail" : "Unsure"}
            </Button>
          ))}
        </div>
        {r.status !== "pass" && r.revision.status !== "proposed" && r.revision.status !== "applied" && r.revision.status !== "dismissed" && (
          <Button size="sm" variant="outline" onClick={() => post("propose", { criterionId: r.id }, `${r.id}:propose`)} disabled={proposing}>
            {proposing && <Loader2 className="animate-spin" />}
            {proposing ? "Asking Claude Code" : "Propose a fix"}
          </Button>
        )}
        {r.revision.status === "proposed" && (
          <>
            <Button size="sm" variant="outline" onClick={() => post("revision", { criterionId: r.id, status: "applied" }, `${r.id}:rev`)}>
              I applied it
            </Button>
            <Button size="sm" variant="ghost" onClick={() => post("revision", { criterionId: r.id, status: "dismissed" }, `${r.id}:rev`)}>
              Dismiss
            </Button>
          </>
        )}
        {(r.revision.status === "applied" || r.revision.status === "dismissed") && (
          <span className="text-xs text-muted-foreground">{r.revision.status === "applied" ? "Applied by you, rerun to confirm" : "Dismissed"}</span>
        )}
      </div>
    </li>
  );
}

/** Shown in the row while Claude Code writes a proposal, so the press answers where she is looking. */
function ProposingNote({ since }: { since?: string }) {
  const start = since ? Date.parse(since) : undefined;
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const secs = start ? Math.max(0, Math.round((now - start) / 1000)) : 0;
  return (
    <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground" role="status">
      <Loader2 className="size-3.5 shrink-0 animate-spin" />
      <span className="min-w-0">
        Claude Code is reading <code className="font-mono">components/ui/button.tsx</code> and writing a proposal, read-only. Usually about a minute, capped at $0.50.{" "}
        <span className="tnum">{Math.floor(secs / 60)}:{String(secs % 60).padStart(2, "0")}</span>
      </span>
    </p>
  );
}
