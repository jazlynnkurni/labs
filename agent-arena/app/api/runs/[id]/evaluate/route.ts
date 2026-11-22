import { z } from "zod";
import { evaluateRun } from "@/lib/evaluation/evaluate";
import { runs } from "@/lib/storage/repo";
import { handler, json } from "@/lib/server/api";

const body = z.object({ runner: z.enum(["docker", "host-sandbox"]) });

export const POST = handler(async (req: Request, ctx: RouteContext<"/api/runs/[id]/evaluate">) => {
  const { id } = await ctx.params;
  const run = await runs.get(id);
  if (!run?.resultCommit) return json({ error: "Nothing captured to evaluate." }, { status: 400 });
  if (run.evalStatus === "running") return json({ error: "Already evaluating." }, { status: 409 });
  const { runner } = body.parse(await req.json());
  void evaluateRun(id, runner, new AbortController().signal);
  return json({ started: true });
});
