import { z } from "zod";
import { handler, json } from "@/lib/server/api";
import { updateRun } from "@/lib/qa/store";

const schema = z.object({ criterionId: z.string(), verdict: z.enum(["pass", "fail", "unsure"]).nullable(), note: z.string().max(1000).optional() });

/** Record Jaz's own verdict on a criterion, to compare with the automated one. */
export const POST = handler(async (req: Request, ctx: RouteContext<"/api/qa/[id]/manual">) => {
  const { id } = await ctx.params;
  const body = schema.parse(await req.json());
  const run = updateRun(id, (r) => {
    const f = r.results.find((x) => x.id === body.criterionId);
    if (!f) throw new Error("Criterion not found.");
    f.manual = body.verdict ? { verdict: body.verdict, note: body.note, at: new Date().toISOString() } : undefined;
  });
  return json({ run });
});
