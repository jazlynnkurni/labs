import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { agentEnv, num, which } from "@/lib/agents/cli";
import { CLAUDE_CRED_ENV } from "@/lib/agents/claude-code";
import type { Usage } from "@/lib/agents/types";
import { runProcess } from "@/lib/sandbox/process";
import { experimentDir, workspaceDir } from "@/lib/storage/paths";
import { grill, type GrillMessage } from "@/lib/storage/repo";
import { allFinished, isFixture, loadDirections, type DirectionsState } from "./evidence";

/**
 * Grill me: a chat with Claude Code about the directions, built on Jaz's own
 * grill-me skill. It can read the five workspaces (Read, Glob, Grep only) and
 * nothing else. Every reply is a paid model call that she triggers.
 */

const SKILL_FILE = () => path.join(process.env.ARENA_AGENTS_HOME || path.join(os.homedir(), ".agents"), "skills", "grill-me", "SKILL.md");

/** Her grill-me skill body is one line pointing at a /grilling method that is not installed; the rest is from her jaz agent notes. */
function grillMethod() {
  let skill = "A relentless interview to sharpen a plan or design.";
  try {
    const raw = fs.readFileSync(SKILL_FILE(), "utf8");
    const desc = raw.match(/^description:\s*(.+)$/m)?.[1]?.trim();
    if (desc) skill = desc;
  } catch {
    // Fall back to the skill's known description.
  }
  return [
    `Her grill-me skill: "${skill}"`,
    'How she wants to be grilled, from her own notes: she wants a peer, not a yes. "Grill me" means argue a position honestly and pick one with a reason. She often takes a well-argued pick and sometimes overrides it, because her product intuition can beat the literature. A newer reference from her beats an older locked rule; do not re-argue it.',
  ].join("\n");
}

function systemPrompt(s: DirectionsState) {
  const where = s.directions.map((d) => `Direction ${d.direction}: ${path.basename(workspaceDir(s.experiment.id, d.runId))}/`).join(", ");
  return [
    `You are the Grill inside Agent Arena, talking with Jaz, a product designer and design engineer. ${s.agent} built ${s.directions.length} prototype directions in parallel from the same starting point. Each direction's files are in its own folder of your working directory (${where}). You may read them; you cannot change anything.`,
    grillMethod(),
    "How to run this chat:",
    "- In your first message, say which direction you would continue with and why, grounded in what is actually in the files and in the evidence you are given. Then ask her one pointed question that tests her thinking.",
    "- After that, one question at a time. Concede when her answer is good, push back when it is not, and say plainly when you change your mind.",
    "- The measured evidence is all that was measured. Never invent numbers, user research or results. Say when you are inferring from the code.",
    "- Short messages in plain prose, no headings, no tables, no em dashes.",
  ].join("\n\n");
}

function userPrompt(s: DirectionsState, thread: GrillMessage[]) {
  const evidence = s.directions.map((d) => ({
    direction: d.direction,
    name: d.name,
    status: d.status,
    agentSummary: d.summary,
    measured: d.measured,
    jazRatings: d.yourRatings,
  }));
  const parts = [
    `The task:\n${s.task}`,
    `Measured evidence per direction (automated checks run by the arena, plus Jaz's own ratings where she gave any):\n${JSON.stringify(evidence, null, 2)}`,
  ];
  if (s.designContext) parts.push(`Her design rules, the same file every direction received:\n${s.designContext}`);
  if (thread.length) {
    parts.push(`The conversation so far:\n${thread.map((m) => `${m.role === "grill" ? "Grill" : "Jaz"}: ${m.content}`).join("\n\n")}`);
    parts.push("Reply to Jaz's last message as the Grill.");
  } else {
    parts.push("Open the conversation.");
  }
  return parts.join("\n\n");
}

const g = globalThis as unknown as { __arenaGrillBusy?: Set<string> };
const busy = (g.__arenaGrillBusy ??= new Set());
export const grillBusy = (experimentId: string) => busy.has(experimentId);

const FIXTURE_REPLY =
  "Development fixture, not a model reply. A real Grill would name the direction it would continue with, give its reason from the files and evidence, then ask you one pointed question.";

/** Add Jaz's message (if any) and the Grill's reply. Returns the new messages. */
export async function grillTurn(experimentId: string, message?: string) {
  if (busy.has(experimentId)) throw new Error("The Grill is still answering.");
  busy.add(experimentId);
  try {
    const s = await loadDirections(experimentId);
    if (!allFinished(s)) throw new Error("Wait until every direction has finished.");
    const thread = await grill.forExperiment(experimentId);
    const added: GrillMessage[] = [];
    const text = message?.trim();
    if (text) added.push(await grill.add({ experimentId, role: "you", content: text }));
    else if (thread.length) throw new Error("Write a reply first.");

    if (isFixture(s)) {
      added.push(await grill.add({ experimentId, role: "grill", content: FIXTURE_REPLY, meta: { fixture: true } }));
      return added;
    }

    const bin = which(["claude"], "CLAUDE_BIN");
    if (!bin) throw new Error("Claude Code is not installed, and the Grill runs on it.");
    const cwd = path.join(experimentDir(experimentId), "workspaces");
    const res = await runProcess({
      cmd: bin,
      args: [
        "-p",
        "--output-format",
        "json",
        "--tools",
        "Read,Glob,Grep",
        "--permission-mode",
        "default",
        "--setting-sources",
        "project",
        "--strict-mcp-config",
        "--no-session-persistence",
        "--max-turns",
        "16",
        "--append-system-prompt",
        systemPrompt(s),
      ],
      cwd,
      env: agentEnv(CLAUDE_CRED_ENV),
      stdin: userPrompt(s, [...thread, ...added]),
      timeoutMs: 5 * 60_000,
    });
    let out: Record<string, unknown> = {};
    try {
      out = JSON.parse(res.stdout.trim().split("\n").filter(Boolean).at(-1) ?? "{}");
    } catch {
      // Reported below as a failed reply.
    }
    const result = typeof out.result === "string" ? out.result.trim() : "";
    if (res.exitCode !== 0 || out.is_error || !result) {
      const why = res.timedOut ? "it took longer than 5 minutes" : String(out.subtype ?? res.stderr.trim().split("\n").at(-1) ?? "unknown error").slice(0, 200);
      added.push(await grill.add({ experimentId, role: "grill", content: `The Grill could not answer (${why}). Send again to retry.`, meta: { error: true } }));
      return added;
    }
    const u = (out.usage ?? {}) as Record<string, unknown>;
    const parts = [num(u.input_tokens), num(u.cache_read_input_tokens), num(u.cache_creation_input_tokens)];
    const cost = num(out.total_cost_usd);
    const usage: Usage = {
      inputTokens: parts.some((x) => x !== undefined) ? parts.reduce<number>((a, b) => a + (b ?? 0), 0) : undefined,
      outputTokens: num(u.output_tokens),
      costUsd: cost,
      costSource: cost !== undefined ? "reported" : undefined,
    };
    const model = Object.keys((out.modelUsage ?? {}) as Record<string, unknown>)[0];
    added.push(await grill.add({ experimentId, role: "grill", content: result, meta: { model, usage } }));
    return added;
  } finally {
    busy.delete(experimentId);
  }
}
