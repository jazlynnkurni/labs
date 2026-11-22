import { ratingSchema } from "@/lib/server/schemas";
import { ratings, runs } from "@/lib/storage/repo";
import { handler, json } from "@/lib/server/api";

export const POST = handler(async (req: Request, ctx: RouteContext<"/api/runs/[id]/rating">) => {
  const { id } = await ctx.params;
  if (!(await runs.get(id))) return json({ error: "Not found" }, { status: 404 });
  const body = ratingSchema.parse(await req.json());
  if (body.score === null) await ratings.remove(id, body.dimension);
  else await ratings.set({ agentRunId: id, dimension: body.dimension, score: body.score, note: body.note });
  return json({ ok: true });
});
