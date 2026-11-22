import { cancel } from "@/lib/orchestration/runner";
import { handler, json } from "@/lib/server/api";

export const POST = handler(async (_req: Request, ctx: RouteContext<"/api/experiments/[id]/cancel">) => {
  const { id } = await ctx.params;
  return json({ cancelled: cancel(id) });
});
