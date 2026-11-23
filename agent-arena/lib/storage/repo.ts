import { randomUUID } from "node:crypto";
import { db } from "./db";
import type { AgentId, Usage } from "@/lib/agents/types";

export type ExperimentStatus = "queued" | "preparing" | "running" | "evaluating" | "done" | "failed" | "cancelled" | "interrupted";
export type RunStatus =
  | "queued"
  | "preparing"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "timed_out"
  | "awaiting_import"
  | "interrupted"
  | "skipped";
export type EvalStatus = "pending" | "running" | "done" | "skipped" | "failed";

export interface AgentSelection {
  agentId: AgentId;
  model?: string;
}

export interface ExperimentConfig {
  agents: AgentSelection[];
  parallel: boolean;
  limits: { timeoutMinutes: number; maxBudgetUsd?: number; maxTurns?: number };
  evaluation: { enabled: boolean; runner: "docker" | "host-sandbox" | "off" };
  /** The shared constraints appended to every agent's brief. */
  constraints: string;
  remote?: { repo?: string; branch?: string };
  /** Design context given to every agent. hash, bytes and removedLines are filled in when the run starts. */
  context?: { ids: string[]; hash?: string; bytes?: number; removedLines?: number };
  /** Set when this experiment continues one run of an earlier experiment as several directions. */
  continuation?: { fromExperimentId: string; fromRunId: string; fromLabel: string; count: number; task: string; note?: string };
}

export type SourceInfo =
  | { kind: "empty"; commit: string }
  | { kind: "local-repo"; path: string; commit: string; branch?: string; dirty: boolean; dirtyExcluded: boolean };

export interface Experiment {
  id: string;
  title: string;
  prompt: string;
  brief: string;
  config: ExperimentConfig;
  configHash: string;
  source: SourceInfo;
  status: ExperimentStatus;
  differences: string[];
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface AgentRun {
  id: string;
  experimentId: string;
  agentId: AgentId;
  agentName: string;
  model?: string;
  /** What the agent said it ran on; kept apart from what was asked for. */
  reportedModel?: string;
  agentVersion?: string;
  status: RunStatus;
  workspaceDir?: string;
  baseCommit?: string;
  resultCommit?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  exitCode?: number;
  error?: string;
  summary?: string;
  usage?: Usage;
  sessionId?: string;
  externalUrl?: string;
  retries: number;
  envNotes: string[];
  evalStatus: EvalStatus;
  /** 1-based direction number when the experiment continues a run as several directions. */
  direction?: number;
}

export interface Artifact {
  id: string;
  agentRunId: string;
  kind: "diff" | "screenshot" | "log" | "report" | "file";
  label: string;
  path: string;
  meta: Record<string, unknown>;
  createdAt: string;
}

export interface Metric {
  agentRunId: string;
  key: string;
  valueNum?: number;
  valueText?: string;
  /** "measured" is automated and objective; "reported" came from the agent; "llm" and "manual" are opinions. */
  source: "measured" | "reported" | "llm" | "manual";
  detail?: string;
}

export interface Rating {
  agentRunId: string;
  dimension: string;
  score: number;
  note?: string;
  updatedAt: string;
}

export interface StoredEvent {
  id: number;
  experimentId: string;
  agentRunId?: string;
  ts: string;
  type: string;
  payload: Record<string, unknown>;
}

const now = () => new Date().toISOString();
const parse = <T>(s: unknown, fallback: T): T => {
  if (typeof s !== "string" || !s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    return fallback;
  }
};
const opt = <T>(v: T | null | undefined) => (v === null ? undefined : v);

type Row = Record<string, unknown>;

function toExperiment(r: Row): Experiment {
  return {
    id: r.id as string,
    title: r.title as string,
    prompt: r.prompt as string,
    brief: r.brief as string,
    config: parse(r.config_json, {} as ExperimentConfig),
    configHash: r.config_hash as string,
    source: parse(r.source_json, { kind: "empty", commit: "" } as SourceInfo),
    status: r.status as ExperimentStatus,
    differences: parse(r.differences_json, [] as string[]),
    createdAt: r.created_at as string,
    startedAt: opt(r.started_at as string | null),
    finishedAt: opt(r.finished_at as string | null),
  };
}

function toRun(r: Row): AgentRun {
  return {
    id: r.id as string,
    experimentId: r.experiment_id as string,
    agentId: r.agent_id as AgentId,
    agentName: r.agent_name as string,
    model: opt(r.model as string | null),
    reportedModel: opt(r.reported_model as string | null),
    agentVersion: opt(r.agent_version as string | null),
    status: r.status as RunStatus,
    workspaceDir: opt(r.workspace_dir as string | null),
    baseCommit: opt(r.base_commit as string | null),
    resultCommit: opt(r.result_commit as string | null),
    startedAt: opt(r.started_at as string | null),
    finishedAt: opt(r.finished_at as string | null),
    durationMs: opt(r.duration_ms as number | null),
    exitCode: opt(r.exit_code as number | null),
    error: opt(r.error as string | null),
    summary: opt(r.summary as string | null),
    usage: parse(r.usage_json, undefined as Usage | undefined),
    sessionId: opt(r.session_id as string | null),
    externalUrl: opt(r.external_url as string | null),
    retries: (r.retries as number) ?? 0,
    envNotes: parse(r.env_notes_json, [] as string[]),
    evalStatus: (r.eval_status as EvalStatus) ?? "pending",
    direction: opt(r.direction as number | null),
  };
}

export const experiments = {
  async create(e: Omit<Experiment, "createdAt" | "status"> & { status?: ExperimentStatus }) {
    const createdAt = now();
    await db().run(
      `INSERT INTO experiments (id, title, prompt, brief, config_json, config_hash, source_json, status, differences_json, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [e.id, e.title, e.prompt, e.brief, e.config, e.configHash, e.source, e.status ?? "queued", e.differences, createdAt],
    );
    return { ...e, status: e.status ?? "queued", createdAt } as Experiment;
  },
  async get(id: string) {
    const r = await db().get<Row>("SELECT * FROM experiments WHERE id = ?", [id]);
    return r ? toExperiment(r) : undefined;
  },
  async list(limit = 100) {
    const rows = await db().all<Row>("SELECT * FROM experiments ORDER BY created_at DESC LIMIT ?", [limit]);
    return rows.map(toExperiment);
  },
  async update(id: string, patch: Partial<Pick<Experiment, "status" | "startedAt" | "finishedAt" | "differences" | "source">>) {
    const sets: string[] = [];
    const vals: unknown[] = [];
    if (patch.status) {
      sets.push("status = ?");
      vals.push(patch.status);
    }
    if (patch.startedAt) {
      sets.push("started_at = ?");
      vals.push(patch.startedAt);
    }
    if (patch.finishedAt) {
      sets.push("finished_at = ?");
      vals.push(patch.finishedAt);
    }
    if (patch.differences) {
      sets.push("differences_json = ?");
      vals.push(patch.differences);
    }
    if (patch.source) {
      sets.push("source_json = ?");
      vals.push(patch.source);
    }
    if (!sets.length) return;
    await db().run(`UPDATE experiments SET ${sets.join(", ")} WHERE id = ?`, [...vals, id]);
  },
  async remove(id: string) {
    await db().run("DELETE FROM run_events WHERE experiment_id = ?", [id]);
    await db().run("DELETE FROM experiments WHERE id = ?", [id]);
  },
};

const RUN_COLUMNS: Record<string, string> = {
  model: "model",
  reportedModel: "reported_model",
  agentVersion: "agent_version",
  status: "status",
  workspaceDir: "workspace_dir",
  baseCommit: "base_commit",
  resultCommit: "result_commit",
  startedAt: "started_at",
  finishedAt: "finished_at",
  durationMs: "duration_ms",
  exitCode: "exit_code",
  error: "error",
  summary: "summary",
  usage: "usage_json",
  sessionId: "session_id",
  externalUrl: "external_url",
  retries: "retries",
  envNotes: "env_notes_json",
  evalStatus: "eval_status",
};

export const runs = {
  async create(r: Pick<AgentRun, "experimentId" | "agentId" | "agentName" | "model" | "direction">) {
    const id = `run_${randomUUID().slice(0, 12)}`;
    await db().run(
      `INSERT INTO agent_runs (id, experiment_id, agent_id, agent_name, model, status, direction) VALUES (?, ?, ?, ?, ?, 'queued', ?)`,
      [id, r.experimentId, r.agentId, r.agentName, r.model ?? null, r.direction ?? null],
    );
    return id;
  },
  async get(id: string) {
    const r = await db().get<Row>("SELECT * FROM agent_runs WHERE id = ?", [id]);
    return r ? toRun(r) : undefined;
  },
  async forExperiment(experimentId: string) {
    const rows = await db().all<Row>("SELECT * FROM agent_runs WHERE experiment_id = ? ORDER BY rowid", [experimentId]);
    return rows.map(toRun);
  },
  async all(limit = 2000) {
    const rows = await db().all<Row>(
      "SELECT r.* FROM agent_runs r JOIN experiments e ON e.id = r.experiment_id ORDER BY e.created_at DESC LIMIT ?",
      [limit],
    );
    return rows.map(toRun);
  },
  async update(id: string, patch: Partial<AgentRun>) {
    const sets: string[] = [];
    const vals: unknown[] = [];
    for (const [k, v] of Object.entries(patch)) {
      const col = RUN_COLUMNS[k];
      if (!col || v === undefined) continue;
      sets.push(`${col} = ?`);
      vals.push(v);
    }
    if (!sets.length) return;
    await db().run(`UPDATE agent_runs SET ${sets.join(", ")} WHERE id = ?`, [...vals, id]);
  },
};

export const events = {
  async append(experimentId: string, agentRunId: string | undefined, type: string, payload: Record<string, unknown>) {
    const ts = now();
    const r = await db().run(
      "INSERT INTO run_events (experiment_id, agent_run_id, ts, type, payload_json) VALUES (?, ?, ?, ?, ?)",
      [experimentId, agentRunId ?? null, ts, type, payload],
    );
    return { id: r.lastId!, experimentId, agentRunId, ts, type, payload } as StoredEvent;
  },
  async since(experimentId: string, afterId = 0, limit = 5000) {
    const rows = await db().all<Row>(
      "SELECT * FROM run_events WHERE experiment_id = ? AND id > ? ORDER BY id LIMIT ?",
      [experimentId, afterId, limit],
    );
    return rows.map(
      (r): StoredEvent => ({
        id: r.id as number,
        experimentId: r.experiment_id as string,
        agentRunId: opt(r.agent_run_id as string | null),
        ts: r.ts as string,
        type: r.type as string,
        payload: parse(r.payload_json, {}),
      }),
    );
  },
};

export const artifacts = {
  async add(a: Omit<Artifact, "id" | "createdAt">) {
    const id = `art_${randomUUID().slice(0, 12)}`;
    await db().run(
      "INSERT INTO artifacts (id, agent_run_id, kind, label, path, meta_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, a.agentRunId, a.kind, a.label, a.path, a.meta, now()],
    );
    return id;
  },
  async forRun(agentRunId: string) {
    const rows = await db().all<Row>("SELECT * FROM artifacts WHERE agent_run_id = ? ORDER BY created_at", [agentRunId]);
    return rows.map(
      (r): Artifact => ({
        id: r.id as string,
        agentRunId: r.agent_run_id as string,
        kind: r.kind as Artifact["kind"],
        label: r.label as string,
        path: r.path as string,
        meta: parse(r.meta_json, {}),
        createdAt: r.created_at as string,
      }),
    );
  },
  async get(id: string) {
    const r = await db().get<Row>("SELECT * FROM artifacts WHERE id = ?", [id]);
    if (!r) return undefined;
    return {
      id: r.id as string,
      agentRunId: r.agent_run_id as string,
      kind: r.kind as Artifact["kind"],
      label: r.label as string,
      path: r.path as string,
      meta: parse(r.meta_json, {}),
      createdAt: r.created_at as string,
    } as Artifact;
  },
  async clearKind(agentRunId: string, kind: Artifact["kind"]) {
    await db().run("DELETE FROM artifacts WHERE agent_run_id = ? AND kind = ?", [agentRunId, kind]);
  },
};

export const metrics = {
  async set(m: Metric) {
    await db().run(
      `INSERT INTO metrics (agent_run_id, key, value_num, value_text, source, detail, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (agent_run_id, key) DO UPDATE SET value_num = excluded.value_num, value_text = excluded.value_text,
       source = excluded.source, detail = excluded.detail, created_at = excluded.created_at`,
      [m.agentRunId, m.key, m.valueNum ?? null, m.valueText ?? null, m.source, m.detail ?? null, now()],
    );
  },
  async forRuns(ids: string[]) {
    if (!ids.length) return [] as Metric[];
    const rows = await db().all<Row>(
      `SELECT * FROM metrics WHERE agent_run_id IN (${ids.map(() => "?").join(",")})`,
      ids,
    );
    return rows.map(
      (r): Metric => ({
        agentRunId: r.agent_run_id as string,
        key: r.key as string,
        valueNum: opt(r.value_num as number | null),
        valueText: opt(r.value_text as string | null),
        source: r.source as Metric["source"],
        detail: opt(r.detail as string | null),
      }),
    );
  },
  async clear(agentRunId: string, source: Metric["source"]) {
    await db().run("DELETE FROM metrics WHERE agent_run_id = ? AND source = ?", [agentRunId, source]);
  },
};

export const ratings = {
  async set(r: Omit<Rating, "updatedAt">) {
    await db().run(
      `INSERT INTO ratings (agent_run_id, dimension, score, note, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT (agent_run_id, dimension) DO UPDATE SET score = excluded.score, note = excluded.note, updated_at = excluded.updated_at`,
      [r.agentRunId, r.dimension, r.score, r.note ?? null, now()],
    );
  },
  async remove(agentRunId: string, dimension: string) {
    await db().run("DELETE FROM ratings WHERE agent_run_id = ? AND dimension = ?", [agentRunId, dimension]);
  },
  async forRuns(ids: string[]) {
    if (!ids.length) return [] as Rating[];
    const rows = await db().all<Row>(
      `SELECT * FROM ratings WHERE agent_run_id IN (${ids.map(() => "?").join(",")})`,
      ids,
    );
    return rows.map(
      (r): Rating => ({
        agentRunId: r.agent_run_id as string,
        dimension: r.dimension as string,
        score: r.score as number,
        note: opt(r.note as string | null),
        updatedAt: r.updated_at as string,
      }),
    );
  },
};

export const attachmentsRepo = {
  async add(a: { experimentId: string; name: string; mime: string; size: number; path: string }) {
    const id = `att_${randomUUID().slice(0, 12)}`;
    await db().run("INSERT INTO attachments (id, experiment_id, name, mime, size, path) VALUES (?, ?, ?, ?, ?, ?)", [
      id,
      a.experimentId,
      a.name,
      a.mime,
      a.size,
      a.path,
    ]);
    return id;
  },
  async forExperiment(experimentId: string) {
    return db().all<{ id: string; name: string; mime: string; size: number; path: string }>(
      "SELECT id, name, mime, size, path FROM attachments WHERE experiment_id = ?",
      [experimentId],
    );
  },
};

export const jobs = {
  async create(kind: string, refId: string) {
    const id = `job_${randomUUID().slice(0, 12)}`;
    await db().run("INSERT INTO jobs (id, kind, ref_id, status, created_at) VALUES (?, ?, ?, 'queued', ?)", [id, kind, refId, now()]);
    return id;
  },
  async mark(id: string, status: "running" | "done" | "failed" | "cancelled" | "interrupted", error?: string) {
    if (status === "running") await db().run("UPDATE jobs SET status = ?, started_at = ? WHERE id = ?", [status, now(), id]);
    else await db().run("UPDATE jobs SET status = ?, finished_at = ?, error = ? WHERE id = ?", [status, now(), error ?? null, id]);
  },
  /** On boot, anything still marked running belonged to a server that is gone. */
  async recoverInterrupted() {
    const stamp = now();
    await db().run("UPDATE jobs SET status = 'interrupted', finished_at = ? WHERE status IN ('queued', 'running')", [stamp]);
    await db().run(
      "UPDATE agent_runs SET status = 'interrupted', finished_at = ? WHERE status IN ('queued', 'preparing', 'running')",
      [stamp],
    );
    await db().run("UPDATE agent_runs SET eval_status = 'failed' WHERE eval_status = 'running'");
    await db().run(
      "UPDATE experiments SET status = 'interrupted', finished_at = ? WHERE status IN ('queued', 'preparing', 'running', 'evaluating')",
      [stamp],
    );
  },
};

export interface Decision<T = Record<string, unknown>> {
  id: string;
  experimentId: string;
  kind: string;
  payload: T;
  createdAt: string;
}

/** Judgments made about an experiment (Jev's pick among directions). Opinions, never metrics. */
export const decisions = {
  async add<T>(experimentId: string, kind: string, payload: T) {
    const id = `dec_${randomUUID().slice(0, 12)}`;
    const createdAt = now();
    await db().run("INSERT INTO decisions (id, experiment_id, kind, payload_json, created_at) VALUES (?, ?, ?, ?, ?)", [id, experimentId, kind, payload, createdAt]);
    return { id, experimentId, kind, payload, createdAt } as Decision<T>;
  },
  async latest<T>(experimentId: string, kind: string) {
    const r = await db().get<Row>("SELECT * FROM decisions WHERE experiment_id = ? AND kind = ? ORDER BY created_at DESC LIMIT 1", [experimentId, kind]);
    if (!r) return undefined;
    return { id: r.id as string, experimentId, kind, payload: parse(r.payload_json, {} as T), createdAt: r.created_at as string } as Decision<T>;
  },
};

export interface GrillMessage {
  id: string;
  experimentId: string;
  role: "grill" | "you";
  content: string;
  meta?: { model?: string; usage?: Usage; fixture?: boolean; error?: boolean };
  createdAt: string;
}

/** The Grill me thread for one experiment. */
export const grill = {
  async add(m: Omit<GrillMessage, "id" | "createdAt">) {
    const id = `grl_${randomUUID().slice(0, 12)}`;
    const createdAt = now();
    await db().run("INSERT INTO grill_messages (id, experiment_id, role, content, meta_json, created_at) VALUES (?, ?, ?, ?, ?, ?)", [
      id,
      m.experimentId,
      m.role,
      m.content,
      m.meta ?? null,
      createdAt,
    ]);
    return { ...m, id, createdAt } as GrillMessage;
  },
  async forExperiment(experimentId: string) {
    const rows = await db().all<Row>("SELECT * FROM grill_messages WHERE experiment_id = ? ORDER BY created_at, rowid", [experimentId]);
    return rows.map(
      (r): GrillMessage => ({
        id: r.id as string,
        experimentId,
        role: r.role as GrillMessage["role"],
        content: r.content as string,
        meta: parse(r.meta_json, undefined as GrillMessage["meta"]),
        createdAt: r.created_at as string,
      }),
    );
  },
};
