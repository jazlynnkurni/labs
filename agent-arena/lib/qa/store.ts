import fs from "node:fs";
import path from "node:path";
import { dataDir } from "@/lib/storage/paths";
import type { QaRun } from "./types";

/** QA runs are plain JSON files under <data>/qa/runs, outside the repo and apart from the arena's database. */
export const qaDir = () => path.join(dataDir(), "qa");
const runsDir = () => path.join(qaDir(), "runs");
const SAFE_ID = /^[a-z0-9-]{6,64}$/;

export function runFile(id: string) {
  if (!SAFE_ID.test(id)) throw new Error("Invalid run id.");
  return path.join(runsDir(), `${id}.json`);
}

export function saveRun(run: QaRun) {
  fs.mkdirSync(runsDir(), { recursive: true });
  const file = runFile(run.id);
  fs.writeFileSync(`${file}.tmp`, JSON.stringify(run, null, 2));
  fs.renameSync(`${file}.tmp`, file);
}

export function getRun(id: string): QaRun | undefined {
  try {
    return JSON.parse(fs.readFileSync(runFile(id), "utf8"));
  } catch {
    return undefined;
  }
}

export function listRuns(): QaRun[] {
  let names: string[] = [];
  try {
    names = fs.readdirSync(runsDir()).filter((n) => n.endsWith(".json"));
  } catch {
    return [];
  }
  return names
    .map((n) => getRun(n.replace(/\.json$/, "")))
    .filter((r): r is QaRun => Boolean(r))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Read, change and write one run. */
export function updateRun(id: string, fn: (run: QaRun) => void): QaRun {
  const run = getRun(id);
  if (!run) throw new Error("QA run not found.");
  fn(run);
  saveRun(run);
  return run;
}
