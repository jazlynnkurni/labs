import { continueDirections } from "@/lib/orchestration/runner";
import { continueSchema } from "@/lib/server/schemas";
import { handler, json } from "@/lib/server/api";

/** Continue directions: one finished run becomes the start of several paid runs by the same agent. */
export const POST = handler(async (req: Request, ctx: RouteContext<"/api/runs/[id]/continue">) => {
  const { id } = await ctx.params;
  const parsed = continueSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  const experimentId = await continueDirections(id, { note: parsed.data.note });
  return json({ id: experimentId }, { status: 201 });
});
