import { z } from "zod";
import { handler, json } from "@/lib/server/api";
import { proposeFix } from "@/lib/qa/propose";

const schema = z.object({ criterionId: z.string() });

/** Ask Claude Code, read-only, for a proposed fix to one finding. Nothing is applied. */
export const POST = handler(async (req: Request, ctx: RouteContext<"/api/qa/[id]/propose">) => {
  const { id } = await ctx.params;
  const { criterionId } = schema.parse(await req.json());
  const run = await proposeFix(id, criterionId, process.cwd());
  return json({ run });
});
