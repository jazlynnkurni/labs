import { startSchema } from "@/lib/server/schemas";
import { startExperiment } from "@/lib/orchestration/runner";
import { experiments, metrics, runs } from "@/lib/storage/repo";
import { handler, json } from "@/lib/server/api";

export const GET = handler(async () => {
  const list = await experiments.list(200);
  const all = await runs.all(5000);
  const byExp = new Map<string, typeof all>();
  for (const r of all) byExp.set(r.experimentId, [...(byExp.get(r.experimentId) ?? []), r]);
  const ms = await metrics.forRuns(all.map((r) => r.id));
  return json({
    experiments: list.map((e) => ({
      ...e,
      runs: (byExp.get(e.id) ?? []).map((r) => ({
        id: r.id,
        agentId: r.agentId,
        agentName: r.agentName,
        model: r.model,
        status: r.status,
        durationMs: r.durationMs,
        usage: r.usage,
        evalStatus: r.evalStatus,
        metrics: Object.fromEntries(ms.filter((m) => m.agentRunId === r.id).map((m) => [m.key, m.valueNum])),
      })),
    })),
  });
});

export const POST = handler(async (req: Request) => {
  const form = await req.formData();
  const raw = form.get("payload");
  if (typeof raw !== "string") return json({ error: "Missing payload" }, { status: 400 });
  const parsed = startSchema.safeParse(JSON.parse(raw));
  if (!parsed.success) return json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  const files = [];
  for (const f of form.getAll("files")) {
    if (typeof f === "string") continue;
    files.push({ name: f.name, mime: f.type, data: Buffer.from(await f.arrayBuffer()) });
  }
  // confirmedPaid is checked by the schema; the orchestrator does not need it.
  const { prompt, source, config } = parsed.data;
  const id = await startExperiment({ prompt, source, config, files });
  return json({ id }, { status: 201 });
});
