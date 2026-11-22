import { importSchema } from "@/lib/server/schemas";
import { importPatch } from "@/lib/orchestration/runner";
import { experiments, runs } from "@/lib/storage/repo";
import { handler, json } from "@/lib/server/api";

/** Manual fallback: apply a patch a person got from an agent the arena could not drive end to end. */
export const POST = handler(async (req: Request, ctx: RouteContext<"/api/runs/[id]/import">) => {
  const { id } = await ctx.params;
  const run = await runs.get(id);
  if (!run) return json({ error: "Not found" }, { status: 404 });
  const exp = await experiments.get(run.experimentId);
  const body = importSchema.parse(await req.json());
  await importPatch(id, body.patch, body.note, exp?.config.evaluation.enabled ? exp.config.evaluation.runner : "off");
  return json({ ok: true });
});
