import { z } from "zod";
import { handler, json } from "@/lib/server/api";
import { updateRun } from "@/lib/qa/store";

const schema = z.object({ criterionId: z.string(), status: z.enum(["open", "applied", "dismissed"]) });

/** Jaz marks a proposal as applied (by her) or dismissed, or reopens it. */
export const POST = handler(async (req: Request, ctx: RouteContext<"/api/qa/[id]/revision">) => {
  const { id } = await ctx.params;
  const body = schema.parse(await req.json());
  const run = updateRun(id, (r) => {
    const f = r.results.find((x) => x.id === body.criterionId);
    if (!f) throw new Error("Criterion not found.");
    if (f.revision.status === "proposing") throw new Error("Wait for the proposal to finish.");
    f.revision = { ...f.revision, status: body.status, at: new Date().toISOString() };
  });
  return json({ run });
});
