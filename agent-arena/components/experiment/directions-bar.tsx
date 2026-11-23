"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/client/api";
import { tokens, usd } from "@/lib/client/format";
import type { ExperimentDetail } from "@/lib/client/types";
import type { GrillMessage } from "@/lib/storage/repo";
import type { JevPick } from "@/lib/directions/jev-pick";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ContinueDirections } from "./continue-directions";

export interface DirectionsInfo {
  finished: boolean;
  fixture: boolean;
  jevReady: boolean;
  jev: { payload: JevPick; createdAt: string } | null;
  grill: GrillMessage[];
  grillBusy: boolean;
  names: Record<string, string | null>;
}

/** Loads the directions layer and reloads it whenever the experiment's status changes. */
export function useDirections(id: string, enabled: boolean, status?: string) {
  const [info, setInfo] = useState<DirectionsInfo>();
  const load = useCallback(async () => {
    if (!enabled) return;
    try {
      setInfo(await api<DirectionsInfo>(`/api/experiments/${id}/directions`));
    } catch {
      // The bar shows its own empty state; the experiment view reports load errors.
    }
  }, [id, enabled]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount and on status change
    void load();
  }, [load, status]);
  return { info, setInfo, reload: load };
}

/**
 * The layer on top of a directions experiment: where it came from, Let Jev
 * handle (a typed choice from Jev) and Grill me (a chat built on her grill-me skill).
 */
export function DirectionsBar({ detail, info, setInfo }: { detail: ExperimentDetail; info?: DirectionsInfo; setInfo: (i: DirectionsInfo) => void }) {
  const exp = detail.experiment;
  const cont = exp.config.continuation!;
  const [jevConfirm, setJevConfirm] = useState(false);
  const [jevBusy, setJevBusy] = useState(false);
  const [grillOpen, setGrillOpen] = useState(false);
  const finished = info?.finished ?? false;
  const fixture = info?.fixture ?? false;
  const pick = info?.jev?.payload;
  const pickedRun = pick?.runId ? detail.runs.find((r) => r.id === pick.runId) : undefined;

  async function askJev() {
    setJevBusy(true);
    try {
      const { pick: p } = await api<{ pick: JevPick }>(`/api/experiments/${exp.id}/jev`, { method: "POST", json: { confirmed: true } });
      if (info) setInfo({ ...info, jev: { payload: p, createdAt: new Date().toISOString() } });
      setJevConfirm(false);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setJevBusy(false);
    }
  }

  return (
    <section className="mb-6 flex flex-col gap-4" aria-label="Directions">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl bg-surface p-4 shadow-raised">
        <p className="min-w-0 flex-1 text-sm text-muted-foreground">
          {cont.count} directions from{" "}
          <Link href={`/experiments/${cont.fromExperimentId}`} className="text-foreground underline decoration-hairline underline-offset-4 hover:decoration-current">
            {cont.fromLabel}
          </Link>
          {cont.note ? <span className="block truncate text-xs text-faint" title={cont.note}>Pushing on: {cont.note}</span> : null}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="secondary" disabled={!finished || jevBusy} onClick={() => setJevConfirm(true)} title={finished ? undefined : "Available when every direction has finished"}>
            {jevBusy && <Loader2 className="size-4 animate-spin" />}
            Let Jev handle
          </Button>
          <Button variant="secondary" disabled={!finished} onClick={() => setGrillOpen(true)} aria-expanded={grillOpen} title={finished ? undefined : "Available when every direction has finished"}>
            Grill me
          </Button>
        </div>
      </div>

      {pick && (
        <div className="flex flex-col gap-4 rounded-2xl bg-surface p-4 shadow-raised" aria-label="Jev's pick">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="truncate text-[15px] font-semibold tracking-tight">
                {pick.choice && pick.labels[pick.choice] ? `Jev picks ${pick.labels[pick.choice]}` : "Jev gave no clear pick"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {pick.fixture
                  ? "Development fixture. Not from Jev; every direction gets the same share."
                  : `Jev's judgment from the task, your design rules and the measured checks. Not a measurement.${pick.confidence !== undefined ? ` Confidence ${pick.confidence.toFixed(2)}.` : ""}`}
              </p>
            </div>
            {pickedRun && <ContinueDirections run={pickedRun} size="default" />}
          </div>
          <ul className="flex flex-col gap-2">
            {Object.entries(pick.labels).map(([key, label]) => {
              const p = pick.probabilities[key] ?? 0;
              return (
                <li key={key} className="grid grid-cols-[minmax(0,1fr)_8rem_3rem] items-center gap-3 text-[13px]">
                  <span className={cn("truncate", key === pick.choice ? "font-medium text-foreground" : "text-muted-foreground")} title={label}>
                    {label}
                  </span>
                  <span className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <span className={cn("block h-full rounded-full", key === pick.choice ? "bg-primary" : "bg-faint")} style={{ width: `${Math.round(p * 100)}%` }} />
                  </span>
                  <span className="text-right tnum text-muted-foreground">{Math.round(p * 100)}%</span>
                </li>
              );
            })}
          </ul>
          {!pick.fixture && (
            <p className="text-xs text-faint">
              {pick.model}, {pick.cached ? "answered from the cache, no credits used" : `${pick.creditsUsed} ${pick.creditsUsed === 1 ? "credit" : "credits"} used`}
            </p>
          )}
        </div>
      )}

      <Dialog open={jevConfirm} onOpenChange={setJevConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Let Jev pick a direction?</DialogTitle>
            <DialogDescription>
              {fixture
                ? "These are development fixtures, so the answer is canned and nothing is sent to Jev."
                : "Jev gets the task, your design rules and each direction's summary and measured checks, then makes one choice between them. It does not see screenshots. The call uses Jev credits on your account."}
            </DialogDescription>
          </DialogHeader>
          {!fixture && !info?.jevReady && <p className="rounded-lg bg-warning/10 p-3 text-xs text-warning">JEV_API_KEY is not set in .env.local, so Jev cannot answer yet.</p>}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setJevConfirm(false)}>
              Cancel
            </Button>
            <Button disabled={jevBusy || (!fixture && !info?.jevReady)} onClick={askJev}>
              {jevBusy && <Loader2 className="size-4 animate-spin" />}
              Ask Jev
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {grillOpen && info && <GrillChat experimentId={exp.id} info={info} setInfo={setInfo} onClose={() => setGrillOpen(false)} />}
    </section>
  );
}

/** A docked chat that stays open while she browses the directions. */
function GrillChat({ experimentId, info, setInfo, onClose }: { experimentId: string; info: DirectionsInfo; setInfo: (i: DirectionsInfo) => void; onClose: () => void }) {
  const [messages, setMessages] = useState<GrillMessage[]>(info.grill);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(info.grillBusy);
  const [confirmed, setConfirmed] = useState(info.fixture || info.grill.length > 0);
  const [acknowledged, setAcknowledged] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const latest = useRef(messages);
  useEffect(() => {
    latest.current = messages;
  }, [messages]);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages.length, busy]);

  const send = useCallback(
    async (text?: string) => {
      const message = text?.trim();
      if (busy || (messages.length > 0 && !message)) return;
      setBusy(true);
      const optimistic: GrillMessage | undefined = message
        ? { id: `local-${Date.now()}`, experimentId, role: "you", content: message, createdAt: new Date().toISOString() }
        : undefined;
      if (optimistic) {
        latest.current = [...latest.current, optimistic];
        setMessages(latest.current);
      }
      setDraft("");
      try {
        const { messages: added } = await api<{ messages: GrillMessage[] }>(`/api/experiments/${experimentId}/grill`, {
          method: "POST",
          json: { message, confirmedPaid: true },
        });
        const next = [...latest.current.filter((x) => x.id !== optimistic?.id), ...added];
        latest.current = next;
        setMessages(next);
        setInfo({ ...info, grill: next });
      } catch (e) {
        toast.error((e as Error).message);
        if (optimistic) {
          setMessages((m) => m.filter((x) => x.id !== optimistic.id));
          setDraft(message ?? "");
        }
      } finally {
        setBusy(false);
        input.current?.focus();
      }
    },
    [busy, experimentId, info, messages.length, setInfo],
  );

  return (
    <aside
      className="fixed inset-x-4 bottom-4 z-40 flex max-h-[min(42rem,calc(100dvh-6rem))] flex-col rounded-2xl bg-surface shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_8px_32px_-8px_rgb(0_0_0/0.2)] sm:left-auto sm:w-[26rem]"
      aria-label="Grill me"
    >
      <header className="flex items-center gap-3 border-b border-hairline py-2 pr-2 pl-4">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold tracking-tight">Grill me</h3>
          <p className="truncate text-xs text-faint">{info.fixture ? "Development fixture, canned replies" : "Claude Code on your account, reads the directions"}</p>
        </div>
        <button onClick={onClose} aria-label="Close Grill me" className="grid size-10 shrink-0 place-items-center text-muted-foreground transition-colors hover:text-foreground">
          <X className="size-4" strokeWidth={1.75} />
        </button>
      </header>

      <div ref={scroller} className="scrollbar-thin flex min-h-48 flex-1 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
        {!confirmed ? (
          <div className="m-auto flex max-w-xs flex-col gap-3 text-center text-sm text-muted-foreground">
            <p>The Grill reads all {Object.keys(info.names).length} directions, says which one it would continue with and why, then questions your thinking one point at a time.</p>
            <label className="flex items-start gap-2.5 rounded-lg bg-surface-2 p-3 text-left text-xs">
              <Checkbox checked={acknowledged} onCheckedChange={(v) => setAcknowledged(Boolean(v))} className="mt-0.5" />
              Each reply is a Claude Code call on my account and may cost money.
            </label>
            <Button
              disabled={!acknowledged}
              onClick={() => {
                setConfirmed(true);
                void send();
              }}
            >
              Start
            </Button>
          </div>
        ) : messages.length === 0 && !busy ? (
          <div className="m-auto flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <p>No messages yet.</p>
            <Button variant="secondary" onClick={() => void send()}>
              Start the grill
            </Button>
          </div>
        ) : (
          messages.map((m) => <Bubble key={m.id} m={m} />)
        )}
        {busy && (
          <div className="flex items-center gap-2 self-start rounded-2xl rounded-bl-md bg-surface-2 px-3 py-2 text-[13px] text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Reading the directions
          </div>
        )}
      </div>

      {confirmed && (
        <form
          className="flex items-end gap-2 border-t border-hairline p-2 pl-4"
          onSubmit={(e) => {
            e.preventDefault();
            void send(draft);
          }}
        >
          <textarea
            ref={input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void send(draft);
              }
            }}
            rows={1}
            placeholder={messages.length ? "Answer the Grill" : "Waiting for the Grill"}
            aria-label="Your reply"
            disabled={!messages.length}
            className="field-sizing-content max-h-40 min-h-10 flex-1 resize-none bg-transparent py-2.5 text-sm outline-none placeholder:text-faint"
          />
          <Button type="submit" size="icon" aria-label="Send" disabled={busy || !draft.trim()} className="size-10 shrink-0 rounded-full">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" strokeWidth={2} />}
          </Button>
        </form>
      )}
    </aside>
  );
}

function Bubble({ m }: { m: GrillMessage }) {
  const mine = m.role === "you";
  const u = m.meta?.usage;
  return (
    <div className={cn("flex max-w-[85%] flex-col gap-1", mine ? "items-end self-end" : "items-start self-start")}>
      <p
        className={cn(
          "rounded-2xl px-3 py-2 text-[13.5px] leading-relaxed whitespace-pre-wrap text-pretty",
          mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-surface-2",
          m.meta?.error && "text-danger",
        )}
      >
        {m.content}
      </p>
      {!mine && (m.meta?.fixture || m.meta?.model || u) && (
        <span className="px-1 text-[11px] text-faint tnum">
          {m.meta?.fixture
            ? "Fixture"
            : [m.meta?.model, u?.costUsd !== undefined ? `${usd(u.costUsd)} reported` : undefined, u?.outputTokens !== undefined ? `${tokens(u.outputTokens)} out` : undefined]
                .filter(Boolean)
                .join(", ")}
        </span>
      )}
    </div>
  );
}

