"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Terminal, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FeedItem } from "@/lib/client/types";
import { Empty } from "./diff-view";
import { Checkbox } from "@/components/ui/checkbox";

/** Live activity: the agent's messages, tool calls and logs, newest at the bottom. */
export function ActivityFeed({ items, live }: { items: FeedItem[]; live: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [stick, setStick] = useState(true);
  const [showLogs, setShowLogs] = useState(false);

  useEffect(() => {
    if (stick && ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [items, stick, showLogs]);

  const visible = showLogs ? items : items.filter((i) => i.event.type !== "log" || i.event.stream === "stderr");
  const hiddenLogs = items.length - visible.length;

  return (
    <div>
      <div className="mb-2 flex h-8 items-center gap-3 text-xs text-muted-foreground">
        <label className="flex items-center gap-2">
          <Checkbox checked={showLogs} onCheckedChange={(v) => setShowLogs(Boolean(v))} />
          Show raw output{hiddenLogs > 0 && !showLogs ? ` (${hiddenLogs} lines)` : ""}
        </label>
        {live && !stick && (
          <button className="ml-auto flex h-8 items-center [@media(hover:hover)]:hover:text-foreground" onClick={() => setStick(true)}>
            Follow
          </button>
        )}
      </div>
      <div
        ref={ref}
        onScroll={(e) => {
          const el = e.currentTarget;
          setStick(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
        }}
        className="scrollbar-thin h-[28rem] overflow-y-auto rounded-lg bg-surface-2/50 p-3 ring-1 ring-hairline"
        role="log"
        aria-live="polite"
      >
        {!visible.length ? (
          <Empty>{live ? "Waiting for the agent" : "No activity recorded."}</Empty>
        ) : (
          <ol className="flex flex-col gap-1.5">
            {visible.map((item) => (
              <Row key={item.id} item={item} />
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

function Row({ item }: { item: FeedItem }) {
  const e = item.event;
  const time = new Date(item.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  switch (e.type) {
    case "message":
      return (
        <li className="rounded-md bg-background/60 px-3 py-2 text-[13px] leading-relaxed whitespace-pre-wrap">
          {e.text}
        </li>
      );
    case "tool":
      return (
        <li className="flex min-w-0 items-center gap-2 px-1 font-mono text-[12px] text-muted-foreground">
          <Wrench className="size-3 shrink-0" strokeWidth={1.75} />
          <span className="shrink-0 text-foreground">{e.name}</span>
          {e.detail && <span className="min-w-0 truncate">{e.detail}</span>}
        </li>
      );
    case "status":
      return (
        <li className="flex items-center gap-2 px-1 text-xs text-info">
          <span className="tnum text-faint">{time}</span>
          {e.message}
        </li>
      );
    case "link":
      return (
        <li className="px-1 text-xs">
          <a href={e.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-info [@media(hover:hover)]:hover:text-foreground">
            {e.label}
            <ExternalLink className="size-3" />
          </a>
        </li>
      );
    case "usage":
      return null;
    case "log":
      return (
        <li className={cn("flex min-w-0 gap-2 px-1 font-mono text-[11.5px] leading-5", e.stream === "stderr" ? "text-danger" : "text-faint")}>
          <Terminal className="mt-1 size-3 shrink-0" strokeWidth={1.75} />
          <span className="min-w-0 break-all whitespace-pre-wrap">{e.text}</span>
        </li>
      );
    default:
      return null;
  }
}
