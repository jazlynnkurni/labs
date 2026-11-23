import { grillTurn } from "@/lib/directions/grill";
import { grillSchema } from "@/lib/server/schemas";
import { handler, json } from "@/lib/server/api";

/** Grill me: post Jaz's message (none for the opening) and get the Grill's reply. */
export const POST = handler(async (req: Request, ctx: RouteContext<"/api/experiments/[id]/grill">) => {
  const { id } = await ctx.params;
  const parsed = grillSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  return json({ messages: await grillTurn(id, parsed.data.message) });
});
