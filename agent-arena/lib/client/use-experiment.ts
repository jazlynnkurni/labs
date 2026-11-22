"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "./api";
import type { EvalStep, ExperimentDetail, FeedItem, StreamEvent } from "./types";
import type { AgentEvent } from "@/lib/agents/types";

const MAX_FEED = 3000;

/**
 * Loads one experiment and keeps it live: SSE events update the per-run
 * activity feed immediately (batched per animation frame), and structural
 * changes (status, evaluation) trigger a debounced refetch of the full detail.
 */
export function useExperiment(id: string) {
  const [detail, setDetail] = useState<ExperimentDetail>();
  const [error, setError] = useState<string>();
  const [feeds, setFeeds] = useState<Record<string, FeedItem[]>>({});
  const [evalSteps, setEvalSteps] = useState<Record<string, EvalStep[]>>({});
  const [connected, setConnected] = useState(false);
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      setDetail(await api<ExperimentDetail>(`/api/experiments/${id}`));
      setError(undefined);
    } catch (e) {
      setError((e as Error).message);
    }
  }, [id]);

  const scheduleRefetch = useCallback(() => {
    if (refetchTimer.current) clearTimeout(refetchTimer.current);
    refetchTimer.current = setTimeout(load, 350);
  }, [load]);

  useEffect(() => {
    api<ExperimentDetail>(`/api/experiments/${id}`)
      .then((d) => setDetail(d))
      .catch((e) => setError((e as Error).message));
    const es = new EventSource(`/api/experiments/${id}/events`);
    let pendingFeed: Record<string, FeedItem[]> = {};
    let pendingEval: Record<string, EvalStep[]> = {};
    let raf = 0;
    const flush = () => {
      raf = 0;
      const feedBatch = pendingFeed;
      const evalBatch = pendingEval;
      pendingFeed = {};
      pendingEval = {};
      if (Object.keys(feedBatch).length) {
        setFeeds((prev) => {
          const next = { ...prev };
          for (const [run, items] of Object.entries(feedBatch)) {
            const merged = [...(next[run] ?? []), ...items];
            next[run] = merged.length > MAX_FEED ? merged.slice(-MAX_FEED) : merged;
          }
          return next;
        });
      }
      if (Object.keys(evalBatch).length) {
        setEvalSteps((prev) => {
          const next = { ...prev };
          for (const [run, items] of Object.entries(evalBatch)) {
            const list = [...(next[run] ?? [])];
            for (const s of items) {
              const i = list.findIndex((x) => x.step === s.step);
              if (i >= 0) list[i] = s;
              else list.push(s);
            }
            next[run] = list;
          }
          return next;
        });
      }
    };
    const queue = () => {
      if (!raf) raf = requestAnimationFrame(flush);
    };
    es.addEventListener("ready", () => setConnected(true));
    es.onmessage = (msg) => {
      const e = JSON.parse(msg.data) as StreamEvent;
      if (e.type === "agent" && e.agentRunId) {
        (pendingFeed[e.agentRunId] ??= []).push({ id: e.id, ts: e.ts, event: e.payload as unknown as AgentEvent });
        queue();
        if ((e.payload as { type?: string }).type === "usage") scheduleRefetch();
      } else if (e.type === "eval" && e.agentRunId) {
        (pendingEval[e.agentRunId] ??= []).push({ ...(e.payload as Omit<EvalStep, "ts">), ts: e.ts });
        queue();
        if ((e.payload as { status?: string }).status !== "running") scheduleRefetch();
      } else {
        scheduleRefetch();
      }
    };
    es.onerror = () => setConnected(false);
    return () => {
      es.close();
      if (raf) cancelAnimationFrame(raf);
      if (refetchTimer.current) clearTimeout(refetchTimer.current);
    };
  }, [id, scheduleRefetch]);

  return { detail, error, feeds, evalSteps, connected, reload: load };
}
