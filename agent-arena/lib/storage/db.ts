import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { dataDir } from "./paths";

/**
 * A deliberately small async database surface. The SQLite driver below is the
 * only implementation today; a PostgreSQL driver only has to provide these four
 * methods and translate `?` placeholders to `$n`. SQL elsewhere sticks to
 * syntax both engines accept (ON CONFLICT upserts, TEXT for JSON, ISO dates).
 */
export interface Db {
  all<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  get<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | undefined>;
  run(sql: string, params?: unknown[]): Promise<{ changes: number; lastId?: number }>;
  exec(sql: string): Promise<void>;
}

type SqlValue = string | number | null | bigint | Uint8Array;

function norm(params: unknown[] = []): SqlValue[] {
  return params.map((p) => {
    if (p === undefined || p === null) return null;
    if (typeof p === "boolean") return p ? 1 : 0;
    if (typeof p === "object" && !(p instanceof Uint8Array)) return JSON.stringify(p);
    return p as SqlValue;
  });
}

class SqliteDb implements Db {
  constructor(private db: DatabaseSync) {}
  async all<T>(sql: string, params?: unknown[]) {
    return this.db.prepare(sql).all(...norm(params)) as T[];
  }
  async get<T>(sql: string, params?: unknown[]) {
    return this.db.prepare(sql).get(...norm(params)) as T | undefined;
  }
  async run(sql: string, params?: unknown[]) {
    const r = this.db.prepare(sql).run(...norm(params));
    return { changes: Number(r.changes), lastId: Number(r.lastInsertRowid) };
  }
  async exec(sql: string) {
    this.db.exec(sql);
  }
}

const MIGRATIONS: string[] = [
  `
  CREATE TABLE IF NOT EXISTS experiments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    prompt TEXT NOT NULL,
    brief TEXT NOT NULL,
    config_json TEXT NOT NULL,
    config_hash TEXT NOT NULL,
    source_json TEXT NOT NULL,
    status TEXT NOT NULL,
    differences_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    started_at TEXT,
    finished_at TEXT
  );
  CREATE TABLE IF NOT EXISTS agent_runs (
    id TEXT PRIMARY KEY,
    experiment_id TEXT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    model TEXT,
    agent_version TEXT,
    status TEXT NOT NULL,
    workspace_dir TEXT,
    base_commit TEXT,
    result_commit TEXT,
    started_at TEXT,
    finished_at TEXT,
    duration_ms INTEGER,
    exit_code INTEGER,
    error TEXT,
    summary TEXT,
    usage_json TEXT,
    session_id TEXT,
    external_url TEXT,
    retries INTEGER NOT NULL DEFAULT 0,
    env_notes_json TEXT NOT NULL DEFAULT '[]',
    eval_status TEXT NOT NULL DEFAULT 'pending'
  );
  CREATE INDEX IF NOT EXISTS agent_runs_experiment ON agent_runs(experiment_id);
  CREATE TABLE IF NOT EXISTS run_events (
    id INTEGER PRIMARY KEY,
    experiment_id TEXT NOT NULL,
    agent_run_id TEXT,
    ts TEXT NOT NULL,
    type TEXT NOT NULL,
    payload_json TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS run_events_experiment ON run_events(experiment_id, id);
  CREATE TABLE IF NOT EXISTS artifacts (
    id TEXT PRIMARY KEY,
    agent_run_id TEXT NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    label TEXT NOT NULL,
    path TEXT NOT NULL,
    meta_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS artifacts_run ON artifacts(agent_run_id);
  CREATE TABLE IF NOT EXISTS metrics (
    agent_run_id TEXT NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value_num REAL,
    value_text TEXT,
    source TEXT NOT NULL,
    detail TEXT,
    created_at TEXT NOT NULL,
    PRIMARY KEY (agent_run_id, key)
  );
  CREATE TABLE IF NOT EXISTS ratings (
    agent_run_id TEXT NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
    dimension TEXT NOT NULL,
    score INTEGER NOT NULL,
    note TEXT,
    updated_at TEXT NOT NULL,
    PRIMARY KEY (agent_run_id, dimension)
  );
  CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    experiment_id TEXT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mime TEXT NOT NULL,
    size INTEGER NOT NULL,
    path TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    ref_id TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    started_at TEXT,
    finished_at TEXT,
    error TEXT
  );
  `,
  `ALTER TABLE agent_runs ADD COLUMN reported_model TEXT;`,
];

const g = globalThis as unknown as { __arenaDb?: Db; __arenaRaw?: DatabaseSync };

export function db(): Db {
  if (g.__arenaDb) return g.__arenaDb;
  const file = process.env.ARENA_DB_FILE || path.join(dataDir(), "arena.sqlite");
  const raw = new DatabaseSync(file);
  raw.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;");
  raw.exec("CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)");
  const row = raw.prepare("SELECT version FROM schema_version").get() as { version: number } | undefined;
  let version = row?.version ?? 0;
  if (!row) raw.prepare("INSERT INTO schema_version (version) VALUES (0)").run();
  for (; version < MIGRATIONS.length; version++) {
    raw.exec(MIGRATIONS[version]);
    raw.prepare("UPDATE schema_version SET version = ?").run(version + 1);
  }
  g.__arenaRaw = raw;
  g.__arenaDb = new SqliteDb(raw);
  return g.__arenaDb;
}

/** Test helper: drop the cached connection so a new ARENA_DB_FILE takes effect. */
export function resetDbForTests() {
  g.__arenaRaw?.close();
  g.__arenaRaw = undefined;
  g.__arenaDb = undefined;
}
