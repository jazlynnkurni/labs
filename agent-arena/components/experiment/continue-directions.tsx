"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client/api";
import { agentColor, runLabel } from "@/lib/client/format";
import type { RunView } from "@/lib/client/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AgentMark } from "@/components/status";

const COUNT = 5;

/** Continue one finished run as five prototype directions by the same agent. */
export function ContinueDirections({ run, size = "sm", className }: { run: RunView; size?: "sm" | "default"; className?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const free = run.agentId === "dev-fixture";
  const ready = run.status === "succeeded" && Boolean(run.resultCommit);
  if (!ready) return null;

  async function start() {
    setSubmitting(true);
    try {
      const { id } = await api<{ id: string }>(`/api/runs/${run.id}/continue`, { method: "POST", json: { note: note.trim() || undefined, confirmedPaid: true } });
      router.push(`/experiments/${id}`);
    } catch (e) {
      toast.error((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button size={size} variant="secondary" className={className} onClick={() => setOpen(true)}>
        Continue directions
      </Button>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          setOpen(v);
          if (!v) setAcknowledged(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Continue as {COUNT} directions?</DialogTitle>
            <DialogDescription>
              {run.agentName} starts from {run.direction ? `direction ${run.direction}` : "this result"} {COUNT} times in parallel, each in its own workspace, with the same brief and design context. Each one is told to take a direction of its own.
            </DialogDescription>
          </DialogHeader>
          <div className="flex min-w-0 items-center gap-2.5 text-sm">
            <AgentMark color={agentColor(run.agentId)} />
            <span className="truncate">{runLabel({ ...run, direction: undefined })}</span>
            <span className="ml-auto shrink-0 text-xs text-muted-foreground">{free ? "Free" : `${COUNT} paid runs`}</span>
          </div>
          <label className="flex flex-col gap-1.5 text-xs text-muted-foreground">
            What to push on next (optional)
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Leave empty to let each direction choose" className="text-sm" />
          </label>
          {!free && (
            <label className="flex items-start gap-2.5 rounded-lg bg-surface-2 p-3 text-xs text-muted-foreground">
              <Checkbox checked={acknowledged} onCheckedChange={(v) => setAcknowledged(Boolean(v))} className="mt-0.5" />
              I understand this starts {COUNT} runs with my credentials and may cost money.
            </label>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={(!free && !acknowledged) || submitting} onClick={start}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Start {COUNT} directions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
