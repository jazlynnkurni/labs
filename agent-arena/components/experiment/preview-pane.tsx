"use client";

import { useEffect, useState } from "react";
import { ExternalLink, Loader2, Monitor, Play, Smartphone, Square } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/client/api";
import type { RunView } from "@/lib/client/types";
import { Button } from "@/components/ui/button";
import { Empty } from "./diff-view";
import { Checkbox } from "@/components/ui/checkbox";

type Live = { running: boolean; url?: string; kind?: string; runner?: string; logs?: string[] };

/**
 * Screenshots are captured at identical viewports for every agent. The live
 * preview runs the generated app in the sandbox runner and shows it in an
 * iframe with an opaque origin, so it cannot call the arena's API.
 */
export function PreviewPane({ run, runner }: { run: RunView; runner: "docker" | "host-sandbox" }) {
  const shots = run.artifacts.filter((a) => a.kind === "screenshot");
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [full, setFull] = useState(false);
  const [live, setLive] = useState<Live>({ running: false });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Live>(`/api/runs/${run.id}/preview`).then(setLive).catch(() => undefined);
  }, [run.id]);

  async function start() {
    setBusy(true);
    try {
      setLive(await api<Live>(`/api/runs/${run.id}/preview`, { method: "POST", json: { runner } }));
    } catch (e) {
      toast.error((e as Error).message.split("\n")[0]);
    } finally {
      setBusy(false);
    }
  }

  async function stop() {
    setBusy(true);
    await api(`/api/runs/${run.id}/preview`, { method: "DELETE" }).catch(() => undefined);
    setLive({ running: false });
    setBusy(false);
  }

  const shot = shots.find((s) => s.label === viewport);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg bg-surface-2 p-0.5" role="radiogroup" aria-label="Viewport">
          {(["desktop", "mobile"] as const).map((v) => (
            <button
              key={v}
              role="radio"
              aria-checked={viewport === v}
              onClick={() => setViewport(v)}
              className={cn("flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs text-muted-foreground", viewport === v && "bg-background text-foreground shadow-raised")}
            >
              {v === "desktop" ? <Monitor className="size-3.5" strokeWidth={1.75} /> : <Smartphone className="size-3.5" strokeWidth={1.75} />}
              {v === "desktop" ? "1440" : "390"}
            </button>
          ))}
        </div>
        {shot && (
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Checkbox checked={full} onCheckedChange={(v) => setFull(Boolean(v))} />
            Full page
          </label>
        )}
        <div className="ml-auto flex items-center gap-2">
          {live.running ? (
            <>
              <a href={live.url} target="_blank" rel="noreferrer noopener" className="inline-flex h-7 items-center gap-1 px-2 text-xs text-muted-foreground [@media(hover:hover)]:hover:text-foreground">
                Open <ExternalLink className="size-3" />
              </a>
              <Button size="sm" variant="secondary" onClick={stop} disabled={busy}>
                <Square className="size-3" /> Stop preview
              </Button>
            </>
          ) : (
            <Button size="sm" variant="secondary" onClick={start} disabled={busy || !run.resultCommit}>
              {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3" />}
              Live preview
            </Button>
          )}
        </div>
      </div>

      {live.running && live.url ? (
        <div className="overflow-hidden rounded-lg bg-preview outline outline-1 -outline-offset-1 outline-media-outline">
          <iframe
            title={`${run.agentName} live preview`}
            src={live.url}
            sandbox="allow-scripts allow-forms allow-popups"
            className={cn("block w-full border-0", viewport === "mobile" ? "mx-auto h-[44rem] max-w-[390px]" : "h-[36rem]")}
          />
        </div>
      ) : shot ? (
        <div className="scrollbar-thin max-h-[36rem] overflow-auto rounded-lg bg-surface-2/50 ring-1 ring-hairline">
          {/* eslint-disable-next-line @next/next/no-img-element -- local artifact served by the API */}
          <img
            src={`/api/artifacts/${shot.id}${full ? "?full=1" : ""}`}
            alt={`${run.agentName} at ${viewport === "desktop" ? "1440 by 900" : "390 by 844"}`}
            className={cn("block outline outline-1 -outline-offset-1 outline-media-outline", viewport === "mobile" ? "mx-auto w-[390px] max-w-full" : "w-full")}
          />
        </div>
      ) : (
        <Empty>{run.evalStatus === "running" ? "Capturing screenshots" : "No screenshots. Turn on evaluation, or start a live preview."}</Empty>
      )}
      {live.running && <p className="text-xs text-faint">Running {live.kind === "static" ? "as static files served by the arena" : `in the ${live.runner === "docker" ? "Docker" : "macOS"} sandbox`} at {live.url}. Stops after 30 minutes.</p>}
    </div>
  );
}
