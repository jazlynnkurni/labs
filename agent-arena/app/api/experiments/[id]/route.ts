import fs from "node:fs";
import path from "node:path";
import { artifacts, attachmentsRepo, experiments, metrics, ratings, runs } from "@/lib/storage/repo";
import { dataDir, experimentDir } from "@/lib/storage/paths";
import { isActive } from "@/lib/orchestration/runner";
import { getAdapter } from "@/lib/agents/registry";
import { describe } from "@/lib/agents/types";
import { handler, json } from "@/lib/server/api";

export const GET = handler(async (_req: Request, ctx: RouteContext<"/api/experiments/[id]">) => {
  const { id } = await ctx.params;
  const exp = await experiments.get(id);
  if (!exp) return json({ error: "Not found" }, { status: 404 });
  const list = await runs.forExperiment(id);
  const ids = list.map((r) => r.id);
  const [ms, rs] = await Promise.all([metrics.forRuns(ids), ratings.forRuns(ids)]);
  const arts = await Promise.all(list.map((r) => artifacts.forRun(r.id)));
  return json({
    experiment: exp,
    active: isActive(id),
    attachments: (await attachmentsRepo.forExperiment(id)).map((a) => ({ id: a.id, name: a.name, mime: a.mime, size: a.size })),
    runs: list.map((r, i) => {
      const adapter = getAdapter(r.agentId);
      return {
        ...r,
        workspaceDir: undefined,
        agent: adapter ? describe(adapter) : undefined,
        artifacts: arts[i].map((a) => ({ ...a, path: undefined, meta: a.kind === "diff" ? { numstat: a.meta.numstat, fileCount: a.meta.fileCount } : a.meta })),
        metrics: ms.filter((m) => m.agentRunId === r.id),
        ratings: rs.filter((x) => x.agentRunId === r.id),
      };
    }),
  });
});

/**
 * Removing an experiment is reversible: its folder moves to <data>/trash and
 * only the database rows are deleted.
 */
export const DELETE = handler(async (_req: Request, ctx: RouteContext<"/api/experiments/[id]">) => {
  const { id } = await ctx.params;
  if (isActive(id)) return json({ error: "Cancel the run before removing it." }, { status: 409 });
  const exp = await experiments.get(id);
  if (!exp) return json({ error: "Not found" }, { status: 404 });
  const src = experimentDir(id);
  if (fs.existsSync(src)) {
    const trash = path.join(dataDir(), "trash");
    fs.mkdirSync(trash, { recursive: true });
    fs.renameSync(src, path.join(trash, `${id}-${Date.now()}`));
  }
  await experiments.remove(id);
  return json({ ok: true });
});
