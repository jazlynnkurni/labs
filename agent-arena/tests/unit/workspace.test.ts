import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { captureDiff, createAgentWorkspace, createSnapshot, git } from "@/lib/sandbox/workspace";

function tmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "arena-ws-"));
}

describe("workspace isolation", () => {
  it("gives each agent its own repository so writes never cross", async () => {
    const root = tmp();
    const snap = await createSnapshot(path.join(root, "source"), { kind: "empty" });
    const a = await createAgentWorkspace(path.join(root, "source"), path.join(root, "a"), snap.commit);
    const b = await createAgentWorkspace(path.join(root, "source"), path.join(root, "b"), snap.commit);

    fs.writeFileSync(path.join(a, "same.txt"), "from A");
    fs.writeFileSync(path.join(b, "same.txt"), "from B");
    await git(a, ["add", "-A"]);
    await git(a, ["commit", "-q", "-m", "agent a commit"]);

    expect(fs.readFileSync(path.join(a, "same.txt"), "utf8")).toBe("from A");
    expect(fs.readFileSync(path.join(b, "same.txt"), "utf8")).toBe("from B");
    // Separate .git directories: A's commit is unknown to B and to the snapshot.
    const aHead = await git(a, ["rev-parse", "HEAD"]);
    expect(await git(b, ["cat-file", "-t", aHead], { allowFail: true })).toBe("");
    expect(await git(path.join(root, "source"), ["cat-file", "-t", aHead], { allowFail: true })).toBe("");
    // No remotes: nothing can be pushed anywhere.
    expect(await git(a, ["remote"])).toBe("");
  });

  it("captures commits, edits and untracked files but not .arena/", async () => {
    const root = tmp();
    const snap = await createSnapshot(path.join(root, "source"), { kind: "empty" });
    const ws = await createAgentWorkspace(path.join(root, "source"), path.join(root, "w"), snap.commit);
    fs.mkdirSync(path.join(ws, ".arena", "attachments"), { recursive: true });
    fs.writeFileSync(path.join(ws, ".arena", "attachments", "x.txt"), "not part of the diff");
    fs.writeFileSync(path.join(ws, "committed.txt"), "1");
    await git(ws, ["add", "committed.txt"]);
    await git(ws, ["commit", "-q", "-m", "c"]);
    fs.writeFileSync(path.join(ws, "untracked.txt"), "2\n3\n");
    const d = await captureDiff(ws, snap.commit);
    const files = d.numstat.map((n) => n.file).sort();
    expect(files).toEqual(["committed.txt", "untracked.txt"]);
    expect(d.patch).not.toContain(".arena");
    expect(d.numstat.find((n) => n.file === "untracked.txt")?.added).toBe(2);
  });

  it("snapshots an existing repo at HEAD and records excluded uncommitted changes", async () => {
    const repo = tmp();
    await git(repo, ["init", "-q", "-b", "main"]);
    fs.writeFileSync(path.join(repo, "a.txt"), "committed");
    await git(repo, ["add", "-A"]);
    await git(repo, ["commit", "-q", "-m", "init"]);
    fs.writeFileSync(path.join(repo, "a.txt"), "dirty edit");
    const dest = path.join(tmp(), "source");
    const snap = await createSnapshot(dest, { kind: "local-repo", path: repo });
    expect(snap.kind === "local-repo" && snap.dirtyExcluded).toBe(true);
    expect(fs.readFileSync(path.join(dest, "a.txt"), "utf8")).toBe("committed");
    // The user's repository is untouched.
    expect(fs.readFileSync(path.join(repo, "a.txt"), "utf8")).toBe("dirty edit");
    expect(await git(dest, ["remote"])).toBe("");
  });
});
