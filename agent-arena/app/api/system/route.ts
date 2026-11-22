import { devFixturesEnabled } from "@/lib/agents/registry";
import { runnerAvailability } from "@/lib/sandbox/exec";
import { dataDir } from "@/lib/storage/paths";
import { runs } from "@/lib/storage/repo";
import { handler, json } from "@/lib/server/api";

export const GET = handler(async () => {
  const runners = await runnerAvailability();
  // Real history only: average reported cost per agent from past runs that reported one.
  const history: Record<string, { runs: number; withCost: number; avgCostUsd?: number; avgDurationMs?: number }> = {};
  for (const r of await runs.all(500)) {
    if (r.agentId === "dev-fixture") continue;
    const h = (history[r.agentId] ??= { runs: 0, withCost: 0 });
    if (r.status !== "succeeded" && r.status !== "failed" && r.status !== "timed_out") continue;
    h.runs++;
    if (r.durationMs) h.avgDurationMs = ((h.avgDurationMs ?? 0) * (h.runs - 1) + r.durationMs) / h.runs;
    if (r.usage?.costUsd !== undefined) {
      h.withCost++;
      h.avgCostUsd = ((h.avgCostUsd ?? 0) * (h.withCost - 1) + r.usage.costUsd) / h.withCost;
    }
  }
  return json({ runners, devFixtures: devFixturesEnabled(), dataDir: dataDir(), platform: process.platform, history });
});
