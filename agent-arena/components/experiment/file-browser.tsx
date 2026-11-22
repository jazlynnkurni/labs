"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, FileText, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/client/api";
import { Empty } from "./diff-view";
import { Checkbox } from "@/components/ui/checkbox";

interface Node {
  name: string;
  path: string;
  dir: boolean;
  children: Node[];
}

function buildTree(paths: string[]): Node[] {
  const root: Node = { name: "", path: "", dir: true, children: [] };
  for (const p of paths) {
    let cur = root;
    const parts = p.split("/");
    parts.forEach((part, i) => {
      const isDir = i < parts.length - 1;
      let next = cur.children.find((c) => c.name === part && c.dir === isDir);
      if (!next) {
        next = { name: part, path: parts.slice(0, i + 1).join("/"), dir: isDir, children: [] };
        cur.children.push(next);
      }
      cur = next;
    });
  }
  const sort = (n: Node) => {
    n.children.sort((a, b) => (a.dir === b.dir ? a.name.localeCompare(b.name) : a.dir ? -1 : 1));
    n.children.forEach(sort);
  };
  sort(root);
  return root.children;
}

/** The generated file tree at the agent's frozen result commit. Changed files are marked. */
export function FileBrowser({ runId, changed, version }: { runId: string; changed: Set<string>; version: string }) {
  const [files, setFiles] = useState<string[]>();
  const [error, setError] = useState<string>();
  const [selected, setSelected] = useState<string>();
  const [content, setContent] = useState<{ path: string; content: string; binary?: boolean; tooLarge?: boolean }>();
  const [onlyChanged, setOnlyChanged] = useState(true);

  useEffect(() => {
    api<{ files: string[] }>(`/api/runs/${runId}/file`)
      .then((d) => setFiles(d.files))
      .catch((e) => setError(e.message));
  }, [runId, version]);

  useEffect(() => {
    if (!selected) return;
    api<{ path: string; content: string; binary?: boolean; tooLarge?: boolean }>(`/api/runs/${runId}/file?path=${encodeURIComponent(selected)}`)
      .then(setContent)
      .catch((e) => setContent({ path: selected, content: e.message }));
  }, [runId, selected]);

  const shown = useMemo(() => (files ?? []).filter((f) => !onlyChanged || changed.has(f)), [files, onlyChanged, changed]);
  const tree = useMemo(() => buildTree(shown), [shown]);

  if (error) return <Empty>{error}</Empty>;
  if (!files) return <Empty>Loading files</Empty>;

  return (
    <div className="grid gap-2 lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)]">
      <div className="min-w-0">
        <label className="mb-2 flex h-8 items-center gap-2 text-xs text-muted-foreground">
          <Checkbox checked={onlyChanged} onCheckedChange={(v) => setOnlyChanged(Boolean(v))} />
          Changed only ({changed.size} of {files.length})
        </label>
        <div className="scrollbar-thin max-h-[28rem] overflow-auto rounded-lg bg-surface-2/50 py-1 ring-1 ring-hairline">
          {tree.length ? <TreeLevel nodes={tree} depth={0} selected={selected} onSelect={setSelected} changed={changed} /> : <p className="p-3 text-xs text-faint">No files.</p>}
        </div>
      </div>
      <div className="scrollbar-thin max-h-[32rem] min-w-0 overflow-auto rounded-lg bg-surface-2/50 ring-1 ring-hairline">
        {!content ? (
          <Empty>Pick a file.</Empty>
        ) : content.tooLarge ? (
          <Empty>File is larger than 1 MB.</Empty>
        ) : content.binary ? (
          <Empty>Binary file.</Empty>
        ) : (
          <pre className="p-3 font-mono text-[12px] leading-5">
            <code>{content.content}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

function TreeLevel({ nodes, depth, selected, onSelect, changed }: { nodes: Node[]; depth: number; selected?: string; onSelect: (p: string) => void; changed: Set<string> }) {
  return (
    <ul>
      {nodes.map((n) => (
        <li key={n.path}>
          {n.dir ? (
            <>
              <div className="flex h-7 min-w-0 items-center gap-1.5 pr-2 text-xs text-muted-foreground" style={{ paddingLeft: 8 + depth * 12 }}>
                <Folder className="size-3.5 shrink-0" strokeWidth={1.75} />
                <span className="truncate">{n.name}</span>
              </div>
              <TreeLevel nodes={n.children} depth={depth + 1} selected={selected} onSelect={onSelect} changed={changed} />
            </>
          ) : (
            <button
              onClick={() => onSelect(n.path)}
              className={cn(
                "flex h-7 w-full min-w-0 items-center gap-1.5 pr-2 text-left text-xs [@media(hover:hover)]:hover:bg-accent",
                changed.has(n.path) || selected === n.path ? "text-foreground" : "text-muted-foreground",
              )}
              style={{ paddingLeft: 8 + depth * 12 }}
              aria-current={selected === n.path ? "true" : undefined}
            >
              <FileText className="size-3.5 shrink-0" strokeWidth={1.75} />
              <span className="truncate font-mono">{n.name}</span>
              <span className="ml-auto flex shrink-0 items-center gap-1.5">
                {selected === n.path && <Check className="size-3.5" strokeWidth={1.75} aria-hidden />}
                {changed.has(n.path) && <span className="size-1.5 rounded-full bg-success" aria-label="changed" />}
              </span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
