import { handler, json } from "@/lib/server/api";
import { getRun } from "@/lib/qa/store";

export const GET = handler(async (_req: Request, ctx: RouteContext<"/api/qa/[id]">) => {
  const { id } = await ctx.params;
  const run = getRun(id);
  return run ? json({ run }) : json({ error: "Not found" }, { status: 404 });
});
