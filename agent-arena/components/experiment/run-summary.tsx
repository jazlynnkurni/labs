"use client";

import { useState } from "react";
import { Check, ExternalLink, Loader2, Minus, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/client/api";
import type { EvalStep, RunView } from "@/lib/client/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Markdown } from "@/components/markdown";

export function RunSummary({ run, steps, runner, onChange }: { run: RunView; steps: EvalStep[]; runner: "docker" | "host-sandbox"; onChange: () => void }) {
  const [busy, setBusy] = useState(false);

  async function reEvaluate() {
    setBusy(true);
    try {
      await api(`/api/runs/${run.id}/evaluate`, { method: "POST", json: { runner } });
      toast.success("Evaluation started");
      onChange();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 text-sm">
      {run.error && (
        <div className="rounded-lg bg-danger/10 px-3 py-2.5 text-[13px] text-danger">
          <p className="font-medium">Error</p>
          <p className="mt-1 font-mono text-xs whitespace-pre-wrap">{run.error}</p>
        </div>
      )}

      <section>
        <h4 className="mb-2 text-xs font-medium text-faint">Agent&apos;s own summary</h4>
        {run.summary ? (
          <Markdown text={run.summary} className="flex flex-col gap-2 text-[13px] leading-relaxed" />
        ) : (
          <p className="text-[13px] text-faint">The agent did not return a summary.</p>
        )}
        {run.externalUrl && (
          <a href={run.externalUrl} target="_blank" rel="noreferrer noopener" className="mt-2 inline-flex items-center gap-1 text-xs text-info [@media(hover:hover)]:hover:text-foreground">
            Open session <ExternalLink className="size-3" />
          </a>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-xs font-medium text-faint">Evaluation steps</h4>
          <Button size="xs" variant="ghost" className="text-muted-foreground" onClick={reEvaluate} disabled={busy || !run.resultCommit || run.evalStatus === "running"}>
            {busy && <Loader2 className="size-3 animate-spin" />}
            Re-run evaluation
          </Button>
        </div>
        {steps.length ? (
          <ol className="flex flex-col gap-1">
            {steps.map((s) => (
              <li key={s.step} className="flex min-w-0 items-start gap-2 text-[13px]">
                <StepIcon status={s.status} />
                <span className="w-20 shrink-0 capitalize">{s.step}</span>
                <span className="min-w-0 truncate font-mono text-xs text-muted-foreground" title={s.detail}>
                  {s.detail}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-[13px] text-faint">{run.evalStatus === "skipped" ? "Evaluation was skipped." : run.evalStatus === "pending" ? "Not evaluated yet." : "No steps recorded in this session."}</p>
        )}
      </section>

      {(run.envNotes.length > 0 || run.agent?.limitations.length) && (
        <section>
          <h4 className="mb-2 text-xs font-medium text-faint">Conditions for this agent</h4>
          <ul className="flex list-disc flex-col gap-1.5 pl-4 text-[13px] text-muted-foreground marker:text-faint">
            {[...run.envNotes, ...(run.agent?.limitations ?? [])].map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      {(run.status === "awaiting_import" || run.agent?.automation !== "full") && <ImportPatch runId={run.id} onDone={onChange} prominent={run.status === "awaiting_import"} />}
    </div>
  );
}

function StepIcon({ status }: { status: EvalStep["status"] }) {
  if (status === "running") return <Loader2 className="mt-0.5 size-3.5 shrink-0 animate-spin text-info" />;
  if (status === "pass") return <Check className="mt-0.5 size-3.5 shrink-0 text-success" />;
  if (status === "fail") return <X className="mt-0.5 size-3.5 shrink-0 text-danger" />;
  return <Minus className="mt-0.5 size-3.5 shrink-0 text-faint" />;
}

/** Manual fallback for agents the arena cannot drive end to end. Labelled as manual in the run's notes. */
function ImportPatch({ runId, onDone, prominent }: { runId: string; onDone: () => void; prominent: boolean }) {
  const [patch, setPatch] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(prominent);

  async function submit() {
    setBusy(true);
    try {
      await api(`/api/runs/${runId}/import`, { method: "POST", json: { patch, note } });
      toast.success("Patch applied to this agent's workspace");
      setPatch("");
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex h-8 items-center self-start text-xs text-muted-foreground [@media(hover:hover)]:hover:text-foreground">
        Import a result by hand
      </button>
    );
  }
  return (
    <section className={cn("rounded-lg p-3", prominent ? "bg-warning/10" : "bg-surface-2/60")}>
      <h4 className="text-[13px] font-medium">Import a result by hand</h4>
      <p className="mt-1 text-xs text-muted-foreground">
        Paste the agent&apos;s unified diff (git diff format). It is applied to this agent&apos;s own workspace and marked as a manual import.
      </p>
      <Textarea value={patch} onChange={(e) => setPatch(e.target.value)} placeholder="diff --git a/index.html b/index.html" className="mt-2 min-h-32 font-mono text-xs" aria-label="Patch" />
      <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Where it came from (optional)" className="mt-2 h-8 text-xs" aria-label="Note" />
      <Button size="sm" className="mt-2" disabled={!patch.trim() || busy} onClick={submit}>
        {busy && <Loader2 className="size-3.5 animate-spin" />}
        Apply patch
      </Button>
    </section>
  );
}
