import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { getAdapter } from "@/lib/agents/registry";
import type { AgentAdapter, AgentEvent, Attachment, Usage } from "@/lib/agents/types";
import {
  artifacts,
  attachmentsRepo,
  experiments,
  jobs,
  metrics,
  runs,
  type AgentRun,
  type ExperimentConfig,
  type RunStatus,
  type SourceInfo,
} from "@/lib/storage/repo";
import { artifactDir, attachmentDir, experimentDir, sourceDir, toDataRel, workspaceDir } from "@/lib/storage/paths";
import { captureDiff, applyPatch, createAgentWorkspace, createSnapshot } from "@/lib/sandbox/workspace";
import { publish } from "./bus";
import { composeBrief, hashConfig, titleFrom } from "./brief";
import { evaluateRun } from "@/lib/evaluation/evaluate";
import { CONTEXT_FILE_NAME, composeContext } from "@/lib/context/design-context";

export interface StartInput {
  prompt: string;
  config: ExperimentConfig;
  source: { kind: "empty" } | { kind: "local-repo"; path: string };
  files: { name: string; mime: string; data: Buffer }[];
}

const g = globalThis as unknown as { __arenaControllers?: Map<string, AbortController> };
const controllers = (g.__arenaControllers ??= new Map());

const MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024;

function safeName(name: string) {
  const base = path.basename(name).replace(/[^\w.\- ]+/g, "_").slice(0, 120);
  return base || "file";
}

/** Notes that make the comparison honest: everything that differs between agents. */
function differencesFor(adapters: { adapter: AgentAdapter; model?: string }[], config: ExperimentConfig, source: SourceInfo) {
  const notes: string[] = [];
  if (source.kind === "local-repo" && source.dirtyExcluded) {
    notes.push("The repository had uncommitted changes. Every agent started from the last commit; the uncommitted changes were not included.");
  }
  const cloud = adapters.filter((a) => a.adapter.kind === "cloud-api");
  for (const { adapter } of cloud) {
    notes.push(
      config.remote?.repo
        ? `${adapter.name} ran in its own cloud machine on ${config.remote.repo} as it exists remotely, not on the local snapshot.`
        : `${adapter.name} ran in its own cloud machine with no repository; it did not see the local starting files.`,
    );
  }
  const capped = adapters.filter((a) => a.adapter.capabilities.budgetCap).map((a) => a.adapter.name);
  if (config.limits.maxBudgetUsd && capped.length < adapters.length) {
    notes.push(`The $${config.limits.maxBudgetUsd} budget cap is only enforced by ${capped.join(", ") || "no agent"}. Others are limited by time only.`);
  }
  if (config.limits.maxTurns) {
    notes.push("The turn limit is only enforced by Claude Code.");
  }
  const noModel = adapters.filter((a) => !a.model).map((a) => a.adapter.name);
  if (noModel.length) notes.push(`Using each CLI's default model: ${noModel.join(", ")}. The exact model is recorded when the agent reports it.`);
  for (const { adapter } of adapters) {
    if (adapter.automation !== "full") notes.push(`${adapter.name} is partially automated; its result may need a manual patch import.`);
  }
  if (!config.parallel) notes.push("Agents ran one after another, so later agents ran at a different time of day than earlier ones.");
  if (config.context?.hash) {
    notes.push(
      `Every agent received the same design context (${config.context.ids.length} ${config.context.ids.length === 1 ? "source" : "sources"}, ${Math.round((config.context.bytes ?? 0) / 1024)} KB, hash ${config.context.hash}). Claude Code still ran without your personal Claude settings, so this file is its only source of your rules too.`,
    );
  } else {
    notes.push("No design context was given. Agents worked from the brief alone.");
  }
  return notes;
}

export async function startExperiment(input: StartInput) {
  const prompt = input.prompt.trim();
  if (!prompt) throw new Error("Write a task first.");
  if (!input.config.agents.length) throw new Error("Pick at least one agent.");
  const chosen = input.config.agents.map((sel) => {
    const adapter = getAdapter(sel.agentId);
    if (!adapter) throw new Error(`Unknown agent: ${sel.agentId}`);
    return { adapter, model: sel.model?.trim() || undefined };
  });
  const ids = new Set(input.config.agents.map((a) => `${a.agentId}:${a.model ?? ""}`));
  if (ids.size !== input.config.agents.length) throw new Error("The same agent and model is selected twice.");
  for (const f of input.files) if (f.data.length > MAX_ATTACHMENT_BYTES) throw new Error(`${f.name} is larger than 20 MB.`);

  const id = `exp_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}_${randomUUID().slice(0, 6)}`;
  fs.mkdirSync(experimentDir(id), { recursive: true });

  // 1. Freeze the starting files.
  const source = await createSnapshot(sourceDir(id), input.source);

  // 2. Store attachments once, outside every workspace.
  const attDir = attachmentDir(id);
  const stored: { name: string; mime: string; abs: string }[] = [];
  const usedNames = new Set<string>();
  for (const f of input.files) {
    let name = safeName(f.name);
    while (usedNames.has(name)) name = `1-${name}`;
    usedNames.add(name);
    const abs = path.join(attDir, name);
    fs.writeFileSync(abs, f.data);
    stored.push({ name, mime: f.mime || "application/octet-stream", abs });
  }

  // 3. Design context, assembled once and handed to every agent as the same file.
  let config = input.config;
  let contextRel: string | undefined;
  if (config.context?.ids.length) {
    const ctx = composeContext(config.context.ids);
    if (ctx) {
      const abs = path.join(attDir, CONTEXT_FILE_NAME);
      fs.writeFileSync(abs, ctx.text);
      fs.writeFileSync(path.join(experimentDir(id), "context.md"), ctx.text);
      stored.push({ name: CONTEXT_FILE_NAME, mime: "text/markdown", abs });
      contextRel = `.arena/attachments/${CONTEXT_FILE_NAME}`;
      config = { ...config, context: { ids: ctx.ids, hash: ctx.hash, bytes: ctx.bytes, removedLines: ctx.removedLines } };
    } else {
      config = { ...config, context: undefined };
    }
  }

  // 4. Freeze the brief. Every agent gets these exact bytes.
  const relPaths = stored.filter((s) => s.name !== CONTEXT_FILE_NAME).map((s) => `.arena/attachments/${s.name}`);
  const brief = composeBrief(prompt, config.constraints, relPaths, contextRel);
  const configHash = hashConfig(brief, config, source.commit);
  const differences = differencesFor(chosen, config, source);

  await experiments.create({
    id,
    title: titleFrom(prompt),
    prompt,
    brief,
    config,
    configHash,
    source,
    differences,
  });
  for (const s of stored) {
    await attachmentsRepo.add({ experimentId: id, name: s.name, mime: s.mime, size: fs.statSync(s.abs).size, path: toDataRel(s.abs) });
  }
  for (const c of chosen) {
    await runs.create({ experimentId: id, agentId: c.adapter.id, agentName: c.adapter.name, model: c.model });
  }
  fs.writeFileSync(path.join(experimentDir(id), "brief.md"), brief);
  fs.writeFileSync(path.join(experimentDir(id), "config.json"), JSON.stringify({ config, source, configHash }, null, 2));

  const jobId = await jobs.create("experiment", id);
  void executeExperiment(id, jobId);
  return id;
}

async function setRun(run: AgentRun, patch: Partial<AgentRun>) {
  await runs.update(run.id, patch);
  Object.assign(run, patch);
  await publish(run.experimentId, run.id, "run", { ...patch, agentId: run.agentId });
}

async function executeExperiment(id: string, jobId: string) {
  const controller = new AbortController();
  controllers.set(id, controller);
  await jobs.mark(jobId, "running");
  try {
    const exp = await experiments.get(id);
    if (!exp) throw new Error("Experiment vanished");
    await experiments.update(id, { status: "preparing", startedAt: new Date().toISOString() });
    await publish(id, undefined, "experiment", { status: "preparing" });

    const list = await runs.forExperiment(id);
    const atts = await attachmentsRepo.forExperiment(id);

    // Prepare every workspace before any agent starts, so they all start equal.
    for (const run of list) {
      await setRun(run, { status: "preparing" });
      try {
        const ws = await createAgentWorkspace(sourceDir(id), workspaceDir(id, run.id), exp.source.commit);
        if (atts.length) {
          const dir = path.join(ws, ".arena", "attachments");
          fs.mkdirSync(dir, { recursive: true });
          for (const a of atts) fs.copyFileSync(path.join(experimentDir(id), "attachments", a.name), path.join(dir, a.name));
        }
        const adapter = getAdapter(run.agentId)!;
        const status = await adapter.detect().catch(() => undefined);
        await setRun(run, { workspaceDir: ws, baseCommit: exp.source.commit, agentVersion: status?.version });
        if (status && !status.installed) {
          await setRun(run, { status: "skipped", error: `${adapter.name} is not installed. See Settings.` });
        } else if (status?.auth === "missing") {
          await setRun(run, { status: "skipped", error: `${adapter.name} is not signed in. See Settings.` });
        }
      } catch (e) {
        await setRun(run, { status: "failed", error: `Workspace setup failed: ${(e as Error).message}` });
      }
    }

    await experiments.update(id, { status: "running" });
    await publish(id, undefined, "experiment", { status: "running" });

    const runnable = list.filter((r) => r.status === "preparing");
    if (exp.config.parallel) {
      await Promise.all(runnable.map((r) => runAgent(exp.id, r, exp.brief, exp.config, controller.signal)));
    } else {
      for (const r of runnable) {
        if (controller.signal.aborted) {
          await setRun(r, { status: "cancelled" });
          continue;
        }
        await runAgent(exp.id, r, exp.brief, exp.config, controller.signal);
      }
    }

    if (exp.config.evaluation.enabled && exp.config.evaluation.runner !== "off" && !controller.signal.aborted) {
      await experiments.update(id, { status: "evaluating" });
      await publish(id, undefined, "experiment", { status: "evaluating" });
      for (const r of await runs.forExperiment(id)) {
        if (controller.signal.aborted) break;
        if (!["succeeded", "failed", "timed_out"].includes(r.status) || !r.resultCommit) {
          await runs.update(r.id, { evalStatus: "skipped" });
          continue;
        }
        await evaluateRun(r.id, exp.config.evaluation.runner, controller.signal);
      }
    }

    const final = controller.signal.aborted ? "cancelled" : "done";
    await experiments.update(id, { status: final, finishedAt: new Date().toISOString() });
    await publish(id, undefined, "experiment", { status: final });
    await jobs.mark(jobId, controller.signal.aborted ? "cancelled" : "done");
  } catch (e) {
    await experiments.update(id, { status: "failed", finishedAt: new Date().toISOString() });
    await publish(id, undefined, "experiment", { status: "failed", error: (e as Error).message });
    await jobs.mark(jobId, "failed", (e as Error).message);
  } finally {
    controllers.delete(id);
  }
}

async function runAgent(experimentId: string, run: AgentRun, brief: string, config: ExperimentConfig, parent: AbortSignal) {
  const adapter = getAdapter(run.agentId)!;
  const own = new AbortController();
  controllers.set(run.id, own);
  const onParentAbort = () => own.abort();
  parent.addEventListener("abort", onParentAbort, { once: true });
  const started = Date.now();
  await setRun(run, { status: "running", startedAt: new Date().toISOString() });

  const atts = await attachmentsRepo.forExperiment(experimentId);
  const attachments: Attachment[] = atts.map((a) => ({
    name: a.name,
    mime: a.mime,
    relPath: `.arena/attachments/${a.name}`,
    absPath: path.join(run.workspaceDir!, ".arena", "attachments", a.name),
  }));

  let latestUsage: Usage | undefined;
  // Agents can emit many events quickly; keep them ordered without blocking the agent.
  let chain = Promise.resolve();
  const emit = (event: AgentEvent) => {
    if (event.type === "usage") latestUsage = event.usage;
    chain = chain.then(() => publish(experimentId, run.id, "agent", event as unknown as Record<string, unknown>).then(() => undefined)).catch(() => undefined);
  };

  let status: RunStatus = "failed";
  try {
    const result = await adapter.run({
      runId: run.id,
      experimentId,
      workspaceDir: run.workspaceDir!,
      brief,
      model: run.model,
      attachments,
      limits: {
        timeoutMs: Math.max(1, config.limits.timeoutMinutes) * 60_000,
        maxBudgetUsd: config.limits.maxBudgetUsd,
        maxTurns: config.limits.maxTurns,
      },
      signal: own.signal,
      emit,
      remote: config.remote,
    });
    await chain;
    const durationMs = Date.now() - started;
    if (own.signal.aborted) status = "cancelled";
    else if (result.error === "Stopped at the time limit.") status = "timed_out";
    else if (result.ok) status = "succeeded";
    else if (result.awaitingManualImport) status = "awaiting_import";
    else status = "failed";

    await setRun(run, {
      status,
      finishedAt: new Date().toISOString(),
      durationMs,
      exitCode: result.exitCode ?? undefined,
      error: result.error,
      summary: result.summary,
      usage: result.usage ?? latestUsage,
      sessionId: result.sessionId,
      reportedModel: result.reportedModel,
      externalUrl: result.externalUrl,
      retries: result.retries,
    });
  } catch (e) {
    await chain;
    status = own.signal.aborted ? "cancelled" : "failed";
    await setRun(run, { status, finishedAt: new Date().toISOString(), durationMs: Date.now() - started, error: (e as Error).message });
  } finally {
    parent.removeEventListener("abort", onParentAbort);
    controllers.delete(run.id);
  }

  // Capture whatever the agent left behind, even after a failure or timeout.
  await collect(run);
}

/** Freeze an agent's output: one commit in its private repo, a patch file and diff stats. */
export async function collect(run: AgentRun) {
  if (!run.workspaceDir || !run.baseCommit || !fs.existsSync(run.workspaceDir)) return;
  try {
    const d = await captureDiff(run.workspaceDir, run.baseCommit);
    const dir = artifactDir(run.experimentId, run.id);
    const patchFile = path.join(dir, "changes.patch");
    fs.writeFileSync(patchFile, d.patch);
    await artifacts.clearKind(run.id, "diff");
    await artifacts.add({
      agentRunId: run.id,
      kind: "diff",
      label: "Changes",
      path: toDataRel(patchFile),
      meta: { numstat: d.numstat, fileCount: d.files.length, files: d.files.slice(0, 2000) },
    });
    const added = d.numstat.reduce((s, n) => s + n.added, 0);
    const removed = d.numstat.reduce((s, n) => s + n.removed, 0);
    await metrics.set({ agentRunId: run.id, key: "files_changed", valueNum: d.numstat.length, source: "measured" });
    await metrics.set({ agentRunId: run.id, key: "lines_added", valueNum: added, source: "measured" });
    await metrics.set({ agentRunId: run.id, key: "lines_removed", valueNum: removed, source: "measured" });
    await setRun(run, { resultCommit: d.resultCommit });
    for (const f of ["transcript.jsonl", "transcript.txt", "devin-messages.jsonl"]) {
      const p = path.join(dir, f);
      if (fs.existsSync(p)) {
        await artifacts.clearKind(run.id, "log");
        await artifacts.add({ agentRunId: run.id, kind: "log", label: "Raw transcript", path: toDataRel(p), meta: {} });
      }
    }
  } catch (e) {
    await publish(run.experimentId, run.id, "agent", { type: "log", stream: "system", text: `Could not capture changes: ${(e as Error).message}` });
  }
}

export function cancel(idOrRunId: string) {
  const c = controllers.get(idOrRunId);
  if (!c) return false;
  c.abort();
  return true;
}

export function isActive(id: string) {
  return controllers.has(id);
}

/** For partially automated agents: a person pastes or uploads the agent's patch. */
export async function importPatch(runId: string, patch: string, note: string, evalRunner: "docker" | "host-sandbox" | "off") {
  const run = await runs.get(runId);
  if (!run || !run.workspaceDir || !run.baseCommit) throw new Error("Run not found or has no workspace.");
  if (controllers.has(runId)) throw new Error("This agent is still running.");
  const file = path.join(artifactDir(run.experimentId, run.id), `imported-${Date.now()}.patch`);
  fs.writeFileSync(file, patch.endsWith("\n") ? patch : patch + "\n");
  await applyPatch(run.workspaceDir, file);
  await setRun(run, {
    status: "succeeded",
    error: undefined,
    summary: run.summary ?? note,
    envNotes: [...run.envNotes, `Result imported by hand: ${note || "no note"}`],
  });
  await runs.update(run.id, { error: "" });
  await collect(run);
  if (evalRunner !== "off") void evaluateRun(run.id, evalRunner, new AbortController().signal);
}
