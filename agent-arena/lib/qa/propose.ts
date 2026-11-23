import { spawn } from "node:child_process";
import { which } from "@/lib/agents/cli";
import { getRun, updateRun } from "./store";

/**
 * Route one finding to Claude Code for a proposed fix. Claude Code gets read-only tools
 * (Read, Grep, Glob), no MCP servers, project settings only and a $0.50 cap, so it can read
 * the code but cannot change anything. The proposal is stored as text for Jaz to apply herself.
 */
const BUDGET_USD = 0.5;

export async function proposeFix(runId: string, criterionId: string, repoRoot: string) {
  const run = getRun(runId);
  if (!run) throw new Error("QA run not found.");
  const finding = run.results.find((r) => r.id === criterionId);
  if (!finding) throw new Error("Criterion not found.");
  if (finding.status === "pass") throw new Error("This criterion passed; there is nothing to fix.");
  if (finding.revision.status === "proposing") throw new Error("A proposal is already being written.");
  const bin = which(["claude"], "CLAUDE_BIN");
  if (!bin) throw new Error("claude is not installed.");

  updateRun(runId, (r) => {
    const f = r.results.find((x) => x.id === criterionId)!;
    f.revision = { status: "proposing", at: new Date().toISOString() };
  });

  const prompt = [
    "A design QA check on the Button component of this repository needs a fix. Do not edit any file.",
    "Read `components/ui/button.tsx` and anything it depends on, then propose the smallest change that makes the check pass without breaking the other rules below.",
    "",
    `Check: ${finding.title}`,
    `Rule: ${finding.rule}`,
    `Finding: ${finding.reason}`,
    `Evidence: ${JSON.stringify(finding.evidence).slice(0, 3000)}`,
    "",
    "Other rules that must keep passing: the label never moves on hover or press, no weight change on hover, no transition: all, transitions on cubic-bezier(0.2, 0.8, 0.1, 1) at 250ms, a visible press, 40px hit areas, one-line labels, visible keyboard focus, sentence-case labels, no em dashes.",
    "",
    "Reply with: a unified diff against the repository, then one or two sentences on why it works and anything it might affect. If the right fix is a design decision rather than code, say so and give the options instead of a diff.",
  ].join("\n");

  const args = ["-p", prompt, "--output-format", "json", "--tools", "Read,Grep,Glob", "--strict-mcp-config", "--setting-sources", "project", "--no-session-persistence", "--max-budget-usd", String(BUDGET_USD)];

  try {
    const { stdout, code } = await new Promise<{ stdout: string; code: number | null }>((resolve, reject) => {
      const child = spawn(bin, args, { cwd: repoRoot, stdio: ["ignore", "pipe", "pipe"] });
      let out = "";
      child.stdout.on("data", (d) => (out += d));
      const timer = setTimeout(() => child.kill("SIGTERM"), 5 * 60_000);
      child.on("error", reject);
      child.on("close", (c) => {
        clearTimeout(timer);
        resolve({ stdout: out, code: c });
      });
    });
    const parsed = JSON.parse(stdout) as { result?: string; total_cost_usd?: number; is_error?: boolean };
    if (code !== 0 || parsed.is_error || !parsed.result) throw new Error("Claude Code did not return a proposal.");
    return updateRun(runId, (r) => {
      const f = r.results.find((x) => x.id === criterionId)!;
      f.revision = { status: "proposed", proposal: parsed.result, costUsd: parsed.total_cost_usd, at: new Date().toISOString() };
    });
  } catch (e) {
    return updateRun(runId, (r) => {
      const f = r.results.find((x) => x.id === criterionId)!;
      f.revision = { status: "open", error: (e as Error).message.slice(0, 200), at: new Date().toISOString() };
    });
  }
}
