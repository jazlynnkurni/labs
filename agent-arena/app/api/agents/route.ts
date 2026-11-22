import { listAdapters } from "@/lib/agents/registry";
import { describe, type AgentAdapter, type ModelOption } from "@/lib/agents/types";
import { handler, json } from "@/lib/server/api";

/** Live model lists from each CLI, cached briefly so the composer stays fast. */
const MODEL_TTL_MS = 10 * 60_000;
const g = globalThis as unknown as { __arenaModels?: Map<string, { at: number; models: ModelOption[] }> };
const modelCache = (g.__arenaModels ??= new Map());

async function modelsFor(a: AgentAdapter, installed: boolean): Promise<ModelOption[]> {
  if (!a.listModels || !installed) return a.models;
  const hit = modelCache.get(a.id);
  if (hit && Date.now() - hit.at < MODEL_TTL_MS) return hit.models;
  const live = await a.listModels().catch(() => []);
  const models = live.length ? live : a.models;
  if (live.length) modelCache.set(a.id, { at: Date.now(), models });
  return models;
}

/** Every agent with its live, credential-free status. Missing tools never fail the request. */
export const GET = handler(async () => {
  const adapters = listAdapters();
  const statuses = await Promise.all(
    adapters.map((a) =>
      a.detect().catch((e) => ({ agentId: a.id, installed: false, auth: "unknown" as const, checkedAt: new Date().toISOString(), error: String(e).slice(0, 200) })),
    ),
  );
  const models = await Promise.all(adapters.map((a, i) => modelsFor(a, statuses[i].installed && statuses[i].auth !== "missing")));
  return json({ agents: adapters.map((a, i) => ({ ...describe(a), models: models[i], status: statuses[i] })) });
});
