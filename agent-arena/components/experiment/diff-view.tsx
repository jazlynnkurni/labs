"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { parseDiff, type DiffFile } from "@/lib/client/diff";
import { SwapChevron } from "@/components/chevron";

export function DiffView({ runId, version }: { runId: string; version: string }) {
  const [patch, setPatch] = useState<string>();
  const [truncated, setTruncated] = useState(false);
  const [error, setError] = useState<string>();
  const [open, setOpen] = useState<string>();

  useEffect(() => {
    let alive = true;
    fetch(`/api/runs/${runId}/diff`)
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? "No diff yet.");
        if (alive) setTruncated(r.headers.get("X-Truncated") === "1");
        return r.text();
      })
      .then((t) => alive && setPatch(t))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [runId, version]);

  const files = useMemo(() => (patch ? parseDiff(patch) : []), [patch]);

  if (error) return <Empty>{error}</Empty>;
  if (patch === undefined) return <Empty>Loading diff</Empty>;
  if (!files.length) return <Empty>No changes.</Empty>;

  return (
    <div className="flex flex-col gap-2">
      {truncated && <p className="text-xs text-warning">The diff is larger than 3 MB; only the beginning is shown.</p>}
      {files.map((f) => (
        <FileDiff key={f.path} file={f} open={open === undefined ? files.length <= 3 : open === f.path} onToggle={() => setOpen(open === f.path ? "" : f.path)} />
      ))}
    </div>
  );
}

function FileDiff({ file, open, onToggle }: { file: DiffFile; open: boolean; onToggle: () => void }) {
  const MAX = 1500;
  return (
    <div className="overflow-hidden rounded-lg bg-surface-2/50 ring-1 ring-hairline">
      <button onClick={onToggle} aria-expanded={open} className="flex h-9 w-full min-w-0 items-center gap-2 px-3 text-left text-xs">
        <span className={cn("shrink-0 rounded px-1 py-px text-[11px] font-medium", file.status === "added" ? "bg-success/15 text-success" : file.status === "deleted" ? "bg-danger/15 text-danger" : "bg-surface-2 text-muted-foreground")}>
          {file.status === "added" ? "New" : file.status === "deleted" ? "Del" : file.status === "binary" ? "Bin" : "Mod"}
        </span>
        <span className="min-w-0 flex-1 truncate font-mono">{file.path}</span>
        <span className="shrink-0 font-mono text-success tnum">+{file.added}</span>
        <span className="shrink-0 font-mono text-danger tnum">-{file.removed}</span>
        <SwapChevron open={open} className="text-faint" />
      </button>
      {open && (
        <div className="scrollbar-thin overflow-x-auto overscroll-x-none border-t border-hairline" tabIndex={0} role="region" aria-label={`Changes in ${file.path}`}>
          <table className="w-full border-collapse font-mono text-[12px] leading-5">
            <tbody>
              {file.lines.slice(0, MAX).map((l, i) =>
                l.kind === "hunk" || l.kind === "meta" ? (
                  <tr key={i} className="bg-info/5 text-info">
                    <td colSpan={3} className="px-3 py-0.5 whitespace-pre">
                      {l.text}
                    </td>
                  </tr>
                ) : (
                  <tr key={i} className={cn(l.kind === "add" && "bg-success/10", l.kind === "del" && "bg-danger/10")}>
                    <td className="w-10 px-2 text-right text-faint select-none tnum">{l.oldNo ?? ""}</td>
                    <td className="w-10 px-2 text-right text-faint select-none tnum">{l.newNo ?? ""}</td>
                    <td className="pr-4 whitespace-pre">
                      <span className={cn("mr-2 inline-block w-2 select-none", l.kind === "add" ? "text-success" : l.kind === "del" ? "text-danger" : "text-faint")}>
                        {l.kind === "add" ? "+" : l.kind === "del" ? "-" : " "}
                      </span>
                      {l.text}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
          {file.lines.length > MAX && <p className="px-3 py-2 text-xs text-faint">{file.lines.length - MAX} more lines not shown.</p>}
        </div>
      )}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-32 place-items-center rounded-lg text-center text-sm text-faint">{children}</div>;
}
