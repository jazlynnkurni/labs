import os from "node:os";
import path from "node:path";
import fs from "node:fs";

/**
 * All run data lives outside the app's own source tree so an agent can never
 * reach the orchestrator's code, and so `git status` here stays clean.
 */
export function dataDir() {
  const dir = process.env.ARENA_DATA_DIR?.trim() || path.join(os.homedir(), ".agent-arena");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function experimentDir(experimentId: string) {
  return path.join(dataDir(), "experiments", experimentId);
}

/** The pristine snapshot every agent clones from. Agents never touch it. */
export function sourceDir(experimentId: string) {
  return path.join(experimentDir(experimentId), "source");
}

export function workspaceDir(experimentId: string, runId: string) {
  return path.join(experimentDir(experimentId), "workspaces", runId);
}

export function artifactDir(experimentId: string, runId: string) {
  const dir = path.join(experimentDir(experimentId), "artifacts", runId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function attachmentDir(experimentId: string) {
  const dir = path.join(experimentDir(experimentId), "attachments");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** Resolve a stored artifact path and refuse anything that escapes the data dir. */
export function safeDataPath(relOrAbs: string) {
  const root = dataDir();
  const abs = path.resolve(root, relOrAbs);
  if (abs !== root && !abs.startsWith(root + path.sep)) throw new Error("Path escapes data directory");
  return abs;
}

export function toDataRel(abs: string) {
  return path.relative(dataDir(), abs);
}
