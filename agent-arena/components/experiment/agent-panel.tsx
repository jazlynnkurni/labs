"use client";

import { useEffect, useMemo, useState } from "react";
import { Square } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client/api";
import { agentColor, duration, tokens, usd } from "@/lib/client/format";
import type { EvalStep, FeedItem, RunView } from "@/lib/client/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { AgentMark, StatusPill } from "@/components/status";
import { ActivityFeed } from "./activity-feed";
import { DiffView } from "./diff-view";
import { FileBrowser } from "./file-browser";
import { PreviewPane } from "./preview-pane";
import { RunSummary } from "./run-summary";

const LIVE = new Set(["queued", "preparing", "running"]);

function useElapsed(run: RunView) {
  const [now, setNow] = useState(() => Date.now());
  const live = run.status === "running";
  useEffect(() => {
    if (!live) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [live]);
  if (run.durationMs !== undefined && !live) return run.durationMs;
  if (run.startedAt) return now - Date.parse(run.startedAt);
  return undefined;
}

export function AgentPanel({
  run,
  feed,
  steps,
  runner,
  onChange,
}: {
  run: RunView;
  feed: FeedItem[];
  steps: EvalStep[];
  runner: "docker" | "host-sandbox";
  onChange: () => void;
}) {
  const elapsed = useElapsed(run);
  const live = LIVE.has(run.status);
  const diff = run.artifacts.find((a) => a.kind === "diff");
  const numstat = useMemo(() => (diff?.meta.numstat as { file: string; added: number; removed: number }[] | undefined) ?? [], [diff]);
  const changed = useMemo(() => new Set(numstat.map((n) => n.file)), [numstat]);
  const added = numstat.reduce((s, n) => s + n.added, 0);
  const removed = numstat.reduce((s, n) => s + n.removed, 0);
  const version = `${run.resultCommit ?? ""}:${diff?.id ?? ""}`;
  const errors = feed.filter((f) => f.event.type === "log" && f.event.stream === "stderr").length;
  const [tab, setTab] = useState<string>(live ? "activity" : "summary");

  async function cancel() {
    try {
      await api(`/api/runs/${run.id}/cancel`, { method: "POST" });
      toast("Cancelling " + run.agentName);
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <article className="flex min-w-0 flex-col rounded-2xl bg-surface shadow-raised" aria-label={run.agentName}>
      <header className="flex flex-col gap-3 border-b border-hairline p-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <AgentMark color={agentColor(run.agentId)} />
          <h3 className="min-w-0 truncate text-[15px] font-semibold tracking-tight">{run.agentName}</h3>
          <span className="min-w-0 truncate font-mono text-xs text-faint" title={run.model ? "Model you picked" : run.reportedModel ? "Default model, as reported by the agent" : "Default model; the agent did not report which"}>
            {run.model ?? (run.reportedModel ? `${run.reportedModel} (default)` : "default model")}
          </span>
          <StatusPill status={run.status} className="ml-auto" />
          {run.status === "running" && (
            <Button size="icon-xs" variant="ghost" aria-label={`Cancel ${run.agentName}`} onClick={cancel} className="press text-muted-foreground">
              <Square className="size-3" />
            </Button>
          )}
        </div>
        {run.agentId === "dev-fixture" && <p className="rounded-md bg-warning/10 px-2 py-1 text-xs text-warning">Development fixture. Not an AI agent; its output is canned.</p>}
        <dl className="grid grid-cols-4 gap-2 text-xs">
          <Stat label="Time" value={elapsed !== undefined ? duration(elapsed) : "n/a"} />
          <Stat label="Tokens" value={run.usage?.inputTokens !== undefined || run.usage?.outputTokens !== undefined ? `${tokens(run.usage?.inputTokens) ?? "?"} / ${tokens(run.usage?.outputTokens) ?? "?"}` : "Not reported"} muted={run.usage?.inputTokens === undefined} />
          <Stat
            label={run.usage?.other?.acus !== undefined ? "ACUs" : "Cost"}
            value={run.usage?.other?.acus !== undefined ? String(run.usage.other.acus) : (usd(run.usage?.costUsd) ?? "Not reported")}
            muted={run.usage?.costUsd === undefined && run.usage?.other?.acus === undefined}
          />
          <Stat label="Diff" value={diff ? `+${added} -${removed}` : "n/a"} muted={!diff} />
        </dl>
      </header>
      <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="min-w-0 p-4">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="activity">
            Activity{errors > 0 && <span className="ml-1 text-danger tnum">{errors}</span>}
          </TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="diff">
            Diff <span className="ml-1 text-faint tnum">{changed.size || ""}</span>
          </TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="pt-3">
          <ActivityFeed items={feed} live={live} />
        </TabsContent>
        <TabsContent value="summary" className="pt-3">
          <RunSummary run={run} steps={steps} runner={runner} onChange={onChange} />
        </TabsContent>
        <TabsContent value="diff" className="pt-3">
          {diff ? <DiffView runId={run.id} version={version} /> : <p className="py-8 text-center text-sm text-faint">{live ? "The diff is captured when the agent finishes." : "No diff captured."}</p>}
        </TabsContent>
        <TabsContent value="files" className="pt-3">
          {run.resultCommit ? <FileBrowser runId={run.id} changed={changed} version={version} /> : <p className="py-8 text-center text-sm text-faint">Files appear when the agent finishes.</p>}
        </TabsContent>
        <TabsContent value="preview" className="pt-3">
          <PreviewPane run={run} runner={runner} />
        </TabsContent>
      </Tabs>
    </article>
  );
}

function Stat({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-faint">{label}</dt>
      <dd className={muted ? "truncate text-faint" : "truncate font-medium tnum"}>{value}</dd>
    </div>
  );
}
