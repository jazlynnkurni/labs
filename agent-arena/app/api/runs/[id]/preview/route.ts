import { z } from "zod";
import { runs } from "@/lib/storage/repo";
import { getPreview, startPreview, stopPreview } from "@/lib/sandbox/preview";
import { handler, json } from "@/lib/server/api";

const body = z.object({ runner: z.enum(["docker", "host-sandbox"]) });

export const GET = handler(async (_req: Request, ctx: RouteContext<"/api/runs/[id]/preview">) => {
  const { id } = await ctx.params;
  const p = getPreview(id);
  return json(p ? { running: true, url: p.url, kind: p.kind, runner: p.runner, logs: p.logs.slice(-40) } : { running: false });
});

export const POST = handler(async (req: Request, ctx: RouteContext<"/api/runs/[id]/preview">) => {
  const { id } = await ctx.params;
  const run = await runs.get(id);
  if (!run?.workspaceDir || !run.resultCommit) return json({ error: "No captured result to preview." }, { status: 400 });
  const { runner } = body.parse(await req.json());
  const p = await startPreview(id, run.workspaceDir, runner);
  return json({ running: true, url: p.url, kind: p.kind, runner: p.runner });
});

export const DELETE = handler(async (_req: Request, ctx: RouteContext<"/api/runs/[id]/preview">) => {
  const { id } = await ctx.params;
  await stopPreview(id);
  return json({ running: false });
});
