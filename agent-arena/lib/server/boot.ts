import { jobs } from "@/lib/storage/repo";

const g = globalThis as unknown as { __arenaBooted?: Promise<void> };

/** Runs once per server process: anything left "running" by a previous process is marked interrupted. */
export function boot() {
  g.__arenaBooted ??= jobs.recoverInterrupted().catch(() => undefined);
  return g.__arenaBooted;
}
