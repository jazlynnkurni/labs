import { jevKeyPresent } from "@/lib/qa/jev";
import { allFinished, isFixture, loadDirections } from "@/lib/directions/evidence";
import { grillBusy } from "@/lib/directions/grill";
import { JEV_PICK } from "@/lib/directions/jev-pick";
import { decisions, grill } from "@/lib/storage/repo";
import { handler, json } from "@/lib/server/api";

/** State of the directions layer: Jev's latest pick and the Grill me thread. */
export const GET = handler(async (_req: Request, ctx: RouteContext<"/api/experiments/[id]/directions">) => {
  const { id } = await ctx.params;
  const s = await loadDirections(id);
  return json({
    finished: allFinished(s),
    fixture: isFixture(s),
    jevReady: jevKeyPresent(),
    jev: (await decisions.latest(id, JEV_PICK)) ?? null,
    grill: await grill.forExperiment(id),
    grillBusy: grillBusy(id),
    names: Object.fromEntries(s.directions.map((d) => [d.runId, d.name ?? null])),
  });
});
