export interface DiffLine {
  kind: "add" | "del" | "ctx" | "hunk" | "meta";
  text: string;
  oldNo?: number;
  newNo?: number;
}

export interface DiffFile {
  path: string;
  oldPath?: string;
  status: "added" | "deleted" | "modified" | "renamed" | "binary";
  added: number;
  removed: number;
  lines: DiffLine[];
}

/** Parse `git diff` output into files and numbered lines. Pure and tolerant of truncation. */
export function parseDiff(patch: string): DiffFile[] {
  const files: DiffFile[] = [];
  let cur: DiffFile | undefined;
  let oldNo = 0;
  let newNo = 0;
  for (const raw of patch.split("\n")) {
    if (raw.startsWith("diff --git ")) {
      const m = raw.match(/^diff --git a\/(.+?) b\/(.+)$/);
      cur = { path: m?.[2] ?? raw.slice(11), oldPath: m?.[1], status: "modified", added: 0, removed: 0, lines: [] };
      files.push(cur);
      continue;
    }
    if (!cur) continue;
    if (raw.startsWith("new file mode")) cur.status = "added";
    else if (raw.startsWith("deleted file mode")) cur.status = "deleted";
    else if (raw.startsWith("rename from")) cur.status = "renamed";
    else if (raw.startsWith("Binary files") || raw.startsWith("GIT binary patch")) {
      cur.status = "binary";
      cur.lines.push({ kind: "meta", text: "Binary file" });
    } else if (raw.startsWith("@@")) {
      const m = raw.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@(.*)/);
      oldNo = Number(m?.[1] ?? 0);
      newNo = Number(m?.[2] ?? 0);
      cur.lines.push({ kind: "hunk", text: raw });
    } else if (cur.status === "binary") {
      continue;
    } else if (raw.startsWith("+") && !raw.startsWith("+++")) {
      cur.added++;
      cur.lines.push({ kind: "add", text: raw.slice(1), newNo: newNo++ });
    } else if (raw.startsWith("-") && !raw.startsWith("---")) {
      cur.removed++;
      cur.lines.push({ kind: "del", text: raw.slice(1), oldNo: oldNo++ });
    } else if (raw.startsWith(" ")) {
      cur.lines.push({ kind: "ctx", text: raw.slice(1), oldNo: oldNo++, newNo: newNo++ });
    }
  }
  return files;
}
