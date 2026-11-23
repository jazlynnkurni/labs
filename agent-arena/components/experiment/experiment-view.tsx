"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CircleAlert, Loader2, Square, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/client/api";
import { agentColor, duration, relative, runLabel } from "@/lib/client/format";
import { useExperiment } from "@/lib/client/use-experiment";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AgentMark, StatusPill } from "@/components/status";
import { SwapChevron } from "@/components/chevron";
import { AgentPanel } from "./agent-panel";
import { directionLine } from "@/lib/directions/brief";
import { EvalDashboard } from "./eval-dashboard";
import { DirectionsBar, useDirections } from "./directions-bar";

export function ExperimentView() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { detail, error, feeds, evalSteps, connected, reload } = useExperiment(id);
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("agents");
  const now = useNow(Boolean(detail?.active));
  const isDirections = Boolean(detail?.experiment.config.continuation);
  const { info: directions, setInfo: setDirections } = useDirections(id, isDirections, detail?.experiment.status);

  const visibleRuns = useMemo(() => detail?.runs.filter((r) => !hidden.has(r.id)) ?? [], [detail, hidden]);

  if (error && !detail) {
    return <div className="mx-auto max-w-3xl px-4 py-24 text-center text-sm text-muted-foreground md:px-8">{error}</div>;
  }
  if (!detail) {
    return (
      <div className="grid min-h-[60dvh] place-items-center text-faint">
        <Loader2 className="size-5 animate-spin" />
      </div>
    );
  }

  const { experiment: exp, runs } = detail;
  const runner = exp.config.evaluation.runner === "docker" ? "docker" : "host-sandbox";
  const totalMs = exp.startedAt ? (exp.finishedAt ? Date.parse(exp.finishedAt) : now) - Date.parse(exp.startedAt) : undefined;

  async function cancelAll() {
    setBusy(true);
    try {
      await api(`/api/experiments/${id}/cancel`, { method: "POST" });
      toast("Cancelling every agent");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await api(`/api/experiments/${id}`, { method: "DELETE" });
      toast.success("Moved to the arena's trash folder");
      router.push("/experiments");
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1800px] px-4 pt-10 pb-24 md:px-8">
      <header className="mb-8">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-faint">
          <span className="font-mono">{exp.id}</span>
          <span>{relative(exp.createdAt)}</span>
          {totalMs !== undefined && <span className="tnum">{duration(totalMs)} total</span>}
          <span className={cn("flex items-center gap-1", connected ? "text-success" : "text-faint")}>
            <span className={cn("size-1.5 rounded-full", connected ? "bg-success" : "bg-faint")} />
            {connected ? "Live" : "Offline"}
          </span>
        </div>
        <div className="flex flex-wrap items-start gap-4">
          <h1 className="min-w-0 flex-1 text-2xl font-semibold tracking-tight">{exp.title}</h1>
          <div className="flex shrink-0 items-center gap-2">
            <StatusPill status={exp.status} />
            {detail.active ? (
              <Button size="sm" variant="secondary" onClick={cancelAll} disabled={busy}>
                <Square className="size-3" /> Cancel all
              </Button>
            ) : (
              <Button size="icon-sm" variant="ghost" className="press text-muted-foreground" aria-label="Remove experiment" onClick={() => setConfirmDelete(true)}>
                <Trash2 className="size-4" strokeWidth={1.75} />
              </Button>
            )}
          </div>
        </div>
        <p className="mt-3 line-clamp-3 max-w-3xl text-sm whitespace-pre-wrap text-muted-foreground">{exp.prompt}</p>
        {exp.differences.length > 0 && (
          <details className="mt-4 max-w-3xl rounded-lg bg-warning/5 px-3 py-2 text-[13px]">
            <summary className="flex h-6 cursor-pointer items-center gap-2 text-warning">
              <CircleAlert className="size-3.5 shrink-0" strokeWidth={1.75} />
              <span className="min-w-0 truncate">
                {exp.differences.length} {exp.differences.length === 1 ? "condition differs" : "conditions differ"} between agents
              </span>
              <SwapChevron className="[&>svg]:size-3" />
            </summary>
            <ul className="mt-2 flex list-disc flex-col gap-1 pb-1 pl-[1.375rem] text-muted-foreground marker:text-faint">
              {exp.differences.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          </details>
        )}
      </header>

      {isDirections && <DirectionsBar detail={detail} info={directions} setInfo={setDirections} />}

      <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
        <TabsList>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
          <TabsTrigger value="brief">Brief</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="pt-6">
          {runs.length > 2 && (
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs text-faint">Show</span>
              {runs.map((r) => {
                const on = !hidden.has(r.id);
                return (
                  <button
                    key={r.id}
                    aria-pressed={on}
                    onClick={() => {
                      const next = new Set(hidden);
                      if (on) next.add(r.id);
                      else next.delete(r.id);
                      if (runs.length - next.size >= 1) setHidden(next);
                    }}
                    className={cn("flex h-7 items-center gap-1.5 rounded-full px-3 text-xs transition-colors", on ? "bg-surface-2 text-foreground" : "text-faint")}
                  >
                    <AgentMark color={agentColor(r.agentId)} className={cn(!on && "opacity-40")} />
                    {runLabel(r)}
                  </button>
                );
              })}
            </div>
          )}
          <div className={cn("grid gap-4", visibleRuns.length === 1 ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2", visibleRuns.length >= 3 && "2xl:grid-cols-3")}>
            {visibleRuns.map((r) => (
              <AgentPanel
                key={r.id}
                run={r}
                feed={feeds[r.id] ?? []}
                steps={evalSteps[r.id] ?? []}
                runner={runner}
                onChange={reload}
                name={directions?.names[r.id]}
                picked={directions?.jev?.payload.runId === r.id}
                canContinue={!detail.active}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="evaluation" className="pt-6">
          <EvalDashboard runs={runs} onChange={reload} />
        </TabsContent>

        <TabsContent value="brief" className="pt-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <section>
              <h3 className="mb-2 text-sm font-medium">Frozen brief</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                {exp.config.continuation
                  ? `Every direction received these bytes plus one line naming its number, shown below. Config hash ${exp.configHash}.`
                  : `Every agent received exactly these bytes. Config hash ${exp.configHash}.`}
              </p>
              <pre className="scrollbar-thin max-h-[40rem] overflow-auto rounded-xl bg-surface p-4 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap shadow-raised">{exp.brief}</pre>
              {exp.config.continuation && (
                <pre className="mt-3 rounded-xl bg-surface-2 p-4 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-muted-foreground">{directionLine(1, exp.config.continuation.count).replace("Direction 1 of", "Direction N of")}</pre>
              )}
            </section>
            <aside className="flex flex-col gap-6 text-[13px]">
              <Meta title="Starting point">
                {exp.source.kind === "empty" ? (
                  <p>Empty project</p>
                ) : (
                  <>
                    <p className="font-mono text-xs break-all">{exp.source.path}</p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{exp.source.commit.slice(0, 12)}</p>
                  </>
                )}
              </Meta>
              <Meta title="Design context">
                {exp.config.context?.hash ? (
                  <>
                    <p>
                      {exp.config.context.ids.length} {exp.config.context.ids.length === 1 ? "source" : "sources"}, {Math.round((exp.config.context.bytes ?? 0) / 1024)} KB, same file for every agent
                    </p>
                    <p className="text-xs text-muted-foreground">{exp.config.context.ids.map((id) => id.replace(/^skill:/, "")).join(", ")}</p>
                    <p className="font-mono text-xs text-faint">hash {exp.config.context.hash}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">None. Agents worked from the brief alone.</p>
                )}
              </Meta>
              <Meta title="Limits">
                <p>{exp.config.limits.timeoutMinutes} min per agent</p>
                <p className="text-muted-foreground">{exp.config.limits.maxBudgetUsd ? `$${exp.config.limits.maxBudgetUsd} cap where supported` : "No dollar cap"}</p>
                {exp.config.limits.maxTurns && <p className="text-muted-foreground">{exp.config.limits.maxTurns} turns (Claude Code)</p>}
                <p className="text-muted-foreground">{exp.config.parallel ? "Parallel" : "One after another"}</p>
              </Meta>
              <Meta title="Agents">
                {runs.map((r) => (
                  <p key={r.id} className="flex min-w-0 items-center gap-2">
                    <AgentMark color={agentColor(r.agentId)} />
                    <span className="truncate">{r.agentName}</span>
                    <span className="ml-auto shrink-0 truncate font-mono text-xs text-faint">{r.agentVersion ?? ""}</span>
                  </p>
                ))}
              </Meta>
              {detail.attachments.length > 0 && (
                <Meta title="Attachments">
                  {detail.attachments.map((a) => (
                    <p key={a.id} className="truncate font-mono text-xs">
                      {a.name}
                    </p>
                  ))}
                </Meta>
              )}
            </aside>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove this experiment?</DialogTitle>
            <DialogDescription>It disappears from history. Its files move to the trash folder inside the arena&apos;s data directory, so you can still recover them.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Keep
            </Button>
            <Button variant="destructive" onClick={remove} disabled={busy}>
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Meta({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="mb-1.5 text-xs font-medium text-faint">{title}</h4>
      <div className="flex flex-col gap-1">{children}</div>
    </section>
  );
}

/** A clock that only ticks while something is running. */
function useNow(running: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);
  return now;
}
