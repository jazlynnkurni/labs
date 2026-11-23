import { letJevHandle } from "@/lib/directions/jev-pick";
import { jevPickSchema } from "@/lib/server/schemas";
import { handler, json } from "@/lib/server/api";

/** Let Jev handle: one typed choice over the finished directions. */
export const POST = handler(async (req: Request, ctx: RouteContext<"/api/experiments/[id]/jev">) => {
  const { id } = await ctx.params;
  const parsed = jevPickSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  return json({ pick: await letJevHandle(id) });
});
