import { getAdapter } from "@/lib/agents/registry";
import { handler, json } from "@/lib/server/api";

/** Connection tests are free checks only (status commands, read-only API calls). */
export const POST = handler(async (_req: Request, ctx: RouteContext<"/api/agents/[id]/test">) => {
  const { id } = await ctx.params;
  const adapter = getAdapter(id);
  if (!adapter) return json({ error: "Unknown agent" }, { status: 404 });
  return json(await adapter.testConnection());
});
