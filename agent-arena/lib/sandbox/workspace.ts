import fs from "node:fs";
import path from "node:path";
import { runProcess } from "./process";
import { buildChildEnv } from "./env";
import type { SourceInfo } from "@/lib/storage/repo";

const gitEnv = () =>
  buildChildEnv({
    extra: {
      GIT_TERMINAL_PROMPT: "0",
      GIT_AUTHOR_NAME: "Agent Arena",
      GIT_AUTHOR_EMAIL: "arena@localhost",
      GIT_COMMITTER_NAME: "Agent Arena",
      GIT_COMMITTER_EMAIL: "arena@localhost",
      // Ignore the user's global hooks and config so snapshots are reproducible.
      GIT_CONFIG_GLOBAL: "/dev/null",
      GIT_CONFIG_NOSYSTEM: "1",
    },
  });

export async function git(cwd: string, args: string[], opts: { allowFail?: boolean; timeoutMs?: number } = {}) {
  const res = await runProcess({ cmd: "git", args, cwd, env: gitEnv(), timeoutMs: opts.timeoutMs ?? 120_000 });
  if (res.exitCode !== 0 && !opts.allowFail) {
    throw new Error(`git ${args[0]} failed: ${res.stderr.trim() || res.stdout.trim()}`);
  }
  return res.stdout.trim();
}

/** Inspect a local repository the user picked. Read only. */
export async function inspectRepo(repoPath: string) {
  const abs = path.resolve(repoPath);
  if (!fs.existsSync(abs)) throw new Error("That folder does not exist.");
  const top = await git(abs, ["rev-parse", "--show-toplevel"], { allowFail: true });
  if (!top) throw new Error("That folder is not inside a git repository.");
  const commit = await git(top, ["rev-parse", "HEAD"], { allowFail: true });
  if (!commit) throw new Error("The repository has no commits yet.");
  const branch = (await git(top, ["rev-parse", "--abbrev-ref", "HEAD"], { allowFail: true })) || undefined;
  const status = await git(top, ["status", "--porcelain"], { allowFail: true });
  const remote = (await git(top, ["remote", "get-url", "origin"], { allowFail: true })) || undefined;
  const subject = await git(top, ["log", "-1", "--format=%s"], { allowFail: true });
  return { path: top, commit, branch, dirty: status.length > 0, remote, subject };
}

/**
 * Freeze the starting point. For an existing repo this clones HEAD into the
 * experiment's own `source` repo (uncommitted changes are excluded and the
 * exclusion is recorded). For an empty project it makes a one-commit repo.
 * The user's repository is only ever read.
 */
export async function createSnapshot(dest: string, source: { kind: "empty" } | { kind: "local-repo"; path: string }) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (source.kind === "empty") {
    fs.mkdirSync(dest, { recursive: true });
    await git(dest, ["init", "-q", "-b", "main"]);
    fs.writeFileSync(path.join(dest, ".gitignore"), "node_modules/\n.next/\ndist/\nbuild/\n.env*\n");
    await git(dest, ["add", "-A"]);
    await git(dest, ["commit", "-q", "-m", "Arena: empty starting point"]);
    const commit = await git(dest, ["rev-parse", "HEAD"]);
    return { kind: "empty", commit } satisfies SourceInfo;
  }
  const info = await inspectRepo(source.path);
  await git(path.dirname(dest), ["clone", "-q", "--no-hardlinks", info.path, dest], { timeoutMs: 600_000 });
  await git(dest, ["checkout", "-q", "--detach", info.commit]);
  // No path back to the original repository or any remote.
  await git(dest, ["remote", "remove", "origin"], { allowFail: true });
  return {
    kind: "local-repo",
    path: info.path,
    commit: info.commit,
    branch: info.branch,
    dirty: info.dirty,
    dirtyExcluded: info.dirty,
  } satisfies SourceInfo;
}

/**
 * Give one agent its own full repository cloned from the snapshot. A separate
 * `.git` per agent means no shared refs, index or worktree list, so one agent
 * cannot overwrite or even see another's work.
 */
export async function createAgentWorkspace(snapshotDir: string, dest: string, commit: string) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  await git(path.dirname(dest), ["clone", "-q", "--no-hardlinks", snapshotDir, dest], { timeoutMs: 600_000 });
  await git(dest, ["checkout", "-q", "-B", "arena", commit]);
  await git(dest, ["remote", "remove", "origin"], { allowFail: true });
  // Arena-owned files (attachments) live in .arena/ and never show in the diff.
  fs.appendFileSync(path.join(dest, ".git", "info", "exclude"), "\n.arena/\n");
  return dest;
}

export interface DiffCapture {
  patch: string;
  numstat: { file: string; added: number; removed: number; binary: boolean }[];
  files: string[];
  resultCommit: string;
}

/**
 * Capture everything the agent changed relative to the base commit, including
 * its own commits and untracked files, then freeze it as one arena commit in
 * the agent's private repo so the result cannot drift afterwards.
 */
export async function captureDiff(workspace: string, baseCommit: string): Promise<DiffCapture> {
  await git(workspace, ["add", "-A"]);
  const hasStaged = (await git(workspace, ["diff", "--cached", "--name-only"])).length > 0;
  if (hasStaged) await git(workspace, ["commit", "-q", "--no-verify", "-m", "Arena: captured agent result"]);
  const resultCommit = await git(workspace, ["rev-parse", "HEAD"]);
  const patch = await git(workspace, ["diff", "--binary", baseCommit, resultCommit], { timeoutMs: 120_000 });
  const ns = await git(workspace, ["diff", "--numstat", baseCommit, resultCommit]);
  const numstat = ns
    .split("\n")
    .filter(Boolean)
    .map((line) => {
      const [a, r, ...rest] = line.split("\t");
      const binary = a === "-";
      return { file: rest.join("\t"), added: binary ? 0 : Number(a), removed: binary ? 0 : Number(r), binary };
    });
  const files = (await git(workspace, ["ls-files"])).split("\n").filter(Boolean);
  return { patch, numstat, files, resultCommit };
}

/** Apply a patch a person imported (manual or partially automated agents). */
export async function applyPatch(workspace: string, patchFile: string) {
  const res = await runProcess({
    cmd: "git",
    args: ["apply", "--whitespace=nowarn", "--reject", patchFile],
    cwd: workspace,
    env: gitEnv(),
    timeoutMs: 60_000,
  });
  if (res.exitCode !== 0) throw new Error(`The patch did not apply cleanly: ${res.stderr.trim().slice(0, 800)}`);
}
