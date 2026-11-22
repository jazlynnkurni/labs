"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/client/api";
import { bytes } from "@/lib/client/format";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { SwapChevron } from "@/components/chevron";

interface Source {
  id: string;
  kind: "defaults" | "skill";
  label: string;
  description: string;
  bytes: number;
  defaultOn: boolean;
  removedLines: number;
}

export interface DesignContextValue {
  enabled: boolean;
  ids: string[];
}

/**
 * Picks which of Jaz's design rules every agent receives as one identical file.
 * The preview shows exactly the bytes that will be sent, after company lines are removed.
 */
export function DesignContextPicker({ value, onChange }: { value: DesignContextValue; onChange: (v: DesignContextValue) => void }) {
  const [sources, setSources] = useState<Source[]>();
  const [error, setError] = useState<string>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [preview, setPreview] = useState<{ text: string; bytes: number; removedLines: number }>();

  useEffect(() => {
    api<{ sources: Source[] }>("/api/context")
      .then((d) => {
        setSources(d.sources);
        // First load: start from the default selection.
        if (!value.ids.length) onChange({ ...value, ids: d.sources.filter((s) => s.defaultOn).map((s) => s.id) });
      })
      .catch((e) => setError((e as Error).message));
    // Only on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const key = value.ids.join(",");
  useEffect(() => {
    if (!previewOpen || !value.enabled || !value.ids.length) return;
    let alive = true;
    api<{ text: string; bytes: number; removedLines: number }>("/api/context/preview", { method: "POST", json: { ids: value.ids } })
      .then((p) => alive && setPreview(p))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
    // `key` stands in for the ids array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewOpen, value.enabled, key]);

  const chosen = useMemo(() => (sources ?? []).filter((s) => value.ids.includes(s.id)), [sources, value.ids]);
  const total = chosen.reduce((n, s) => n + s.bytes, 0);
  const removed = chosen.reduce((n, s) => n + s.removedLines, 0);
  const toggle = (id: string, on: boolean) => onChange({ ...value, ids: on ? [...value.ids, id] : value.ids.filter((x) => x !== id) });

  return (
    <div className="overflow-hidden rounded-xl bg-surface shadow-raised">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm">Give every agent my design context</p>
          <p className="text-xs text-faint">One identical file with your design rules. Off means agents work from the brief alone.</p>
        </div>
        <Switch checked={value.enabled} onCheckedChange={(v) => onChange({ ...value, enabled: v })} aria-label="Give every agent my design context" />
      </div>

      {value.enabled && (
        <>
          {error ? (
            <p className="border-t border-hairline px-4 py-3 text-xs text-danger">{error}</p>
          ) : !sources ? (
            <div className="h-24 animate-pulse border-t border-hairline bg-surface-2/40" />
          ) : (
            <ul className="divide-y divide-hairline border-t border-hairline">
              {sources.map((s) => {
                const on = value.ids.includes(s.id);
                return (
                  <li key={s.id}>
                    <label className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2">
                      <Checkbox checked={on} onCheckedChange={(v) => toggle(s.id, Boolean(v))} aria-label={`Include ${s.label}`} />
                      <span className="flex min-w-0 flex-1 items-baseline gap-2.5">
                        <span className={cn("shrink-0 text-sm", s.kind === "skill" && "font-mono text-[13px]")}>{s.label}</span>
                        <span className="min-w-0 truncate text-xs text-faint">{s.description}</span>
                      </span>
                      {s.removedLines > 0 && (
                        <span className="shrink-0 text-xs whitespace-nowrap text-faint" title="Lines that name company work are removed before sending">
                          {s.removedLines} company {s.removedLines === 1 ? "line" : "lines"} removed
                        </span>
                      )}
                      <span className="w-14 shrink-0 text-right text-xs text-muted-foreground tnum">{bytes(s.bytes)}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="border-t border-hairline px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setPreviewOpen(!previewOpen)}
                aria-expanded={previewOpen}
                className="flex h-8 items-center gap-1.5 text-xs text-muted-foreground [@media(hover:hover)]:hover:text-foreground"
              >
                <SwapChevron open={previewOpen} />
                Preview what agents receive
              </button>
              <span className="text-xs text-faint tnum">
                {chosen.length} {chosen.length === 1 ? "source" : "sources"}, {bytes(total)}
                {removed > 0 ? `, ${removed} company ${removed === 1 ? "line" : "lines"} removed` : ""}
              </span>
            </div>
            {previewOpen && (
              <pre className="scrollbar-thin mt-2 max-h-80 overflow-auto rounded-lg bg-surface-2/60 p-3 font-mono text-[12px] leading-5 whitespace-pre-wrap">
                {!value.ids.length ? "Nothing selected." : preview ? preview.text : "Loading…"}
              </pre>
            )}
          </div>
        </>
      )}
    </div>
  );
}
