import { EventEmitter } from "node:events";
import { events, type StoredEvent } from "@/lib/storage/repo";

/**
 * Every event is written to SQLite first and then fanned out in memory. A
 * browser that reconnects replays from the database by id, so nothing is lost
 * between the write and the subscription.
 */
const g = globalThis as unknown as { __arenaBus?: EventEmitter };
const bus = (g.__arenaBus ??= (() => {
  const e = new EventEmitter();
  e.setMaxListeners(200);
  return e;
})());

export async function publish(
  experimentId: string,
  agentRunId: string | undefined,
  type: string,
  payload: Record<string, unknown>,
) {
  const stored = await events.append(experimentId, agentRunId, type, payload);
  bus.emit(experimentId, stored);
  return stored;
}

export function subscribe(experimentId: string, fn: (e: StoredEvent) => void) {
  bus.on(experimentId, fn);
  return () => bus.off(experimentId, fn);
}
