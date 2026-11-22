/**
 * The contract every agent integration implements.
 *
 * An adapter turns one frozen task brief into work inside one isolated
 * workspace. It never decides scores, never invents usage numbers and never
 * reads another agent's workspace. Anything it cannot measure stays undefined.
 */

export type AgentId = "claude-code" | "codex" | "cursor" | "blackbox" | "devin" | "dev-fixture";

/** Where the agent actually does its work. This changes what a comparison can claim. */
export type ExecutionKind = "local-cli" | "cloud-api";

/** How much of the loop is automatic. */
export type AutomationLevel = "full" | "partial" | "manual";

export interface AgentCapabilities {
  /** Progress events arrive while the agent works. */
  streaming: boolean;
  /** The agent reports token counts itself. */
  tokenUsage: boolean;
  /** The agent reports a cost figure itself. */
  costReporting: boolean;
  /** A model can be chosen per run. */
  modelSelection: boolean;
  /** Runs inside the local isolated workspace the arena creates. */
  localWorkspace: boolean;
  /** A dollar cap can be enforced by the agent itself. */
  budgetCap: boolean;
  /** A running task can be stopped. */
  cancellation: boolean;
  /** Image attachments can be passed as images, not only as file paths. */
  imageInput: boolean;
}

export interface SetupStep {
  label: string;
  /** A shell command for the user to run themselves. Never run by the app. */
  command?: string;
  url?: string;
}

export interface ModelOption {
  id: string;
  label: string;
}

export type AuthState = "authenticated" | "missing" | "unknown";

export interface AgentStatus {
  agentId: AgentId;
  installed: boolean;
  version?: string;
  auth: AuthState;
  /** Safe to show in the UI. Never contains a credential, email or token. */
  authDetail?: string;
  checkedAt: string;
  error?: string;
}

export interface Attachment {
  name: string;
  mime: string;
  /** Path inside the agent's workspace, relative to its root. */
  relPath: string;
  /** Absolute path of this agent's copy. */
  absPath: string;
}

export interface RunLimits {
  timeoutMs: number;
  /** Only enforced by agents whose capabilities.budgetCap is true. */
  maxBudgetUsd?: number;
  /** Only enforced by agents that support it. */
  maxTurns?: number;
}

/** Normalised usage. Every field is optional because most agents report only some. */
export interface Usage {
  /** All prompt tokens, cached reads and writes included, so agents compare like for like. */
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  costUsd?: number;
  /** Where the cost number came from. Absent means there is no cost number. */
  costSource?: "reported";
  /** Agent-specific units such as Devin ACUs, kept verbatim. */
  other?: Record<string, number>;
}

export type AgentEvent =
  | { type: "status"; message: string }
  | { type: "log"; stream: "stdout" | "stderr" | "system"; text: string }
  | { type: "message"; text: string }
  | { type: "tool"; name: string; detail?: string }
  | { type: "usage"; usage: Usage }
  | { type: "link"; label: string; url: string };

export interface AgentRunContext {
  runId: string;
  experimentId: string;
  /** Absolute path of this agent's own isolated repository. */
  workspaceDir: string;
  /** The frozen brief, byte for byte identical across agents. */
  brief: string;
  model?: string;
  attachments: Attachment[];
  limits: RunLimits;
  signal: AbortSignal;
  emit: (event: AgentEvent) => void;
  /** Settings for agents that work against a remote repository (Devin). */
  remote?: { repo?: string; branch?: string };
}

export interface AgentResult {
  ok: boolean;
  exitCode?: number | null;
  /** The agent's own final message. */
  summary?: string;
  usage?: Usage;
  error?: string;
  sessionId?: string;
  externalUrl?: string;
  /** The model the agent says it actually used, when it says. */
  reportedModel?: string;
  turns?: number;
  /** Retries the arena made, not retries inside the agent. */
  retries: number;
  /** True when the arena had to stop and wait for a person (partial automation). */
  awaitingManualImport?: boolean;
}

export interface ConnectionTest {
  ok: boolean;
  detail: string;
  /** True when the test made a billable call. Tests here never should. */
  billable: false;
}

export interface AgentAdapter {
  id: AgentId;
  name: string;
  vendor: string;
  kind: ExecutionKind;
  automation: AutomationLevel;
  docsUrl: string;
  capabilities: AgentCapabilities;
  limitations: string[];
  setup: SetupStep[];
  /** Env vars this adapter may read. Only these are passed to its process. */
  credentialEnv: string[];
  models: ModelOption[];
  /**
   * Ask the CLI which models this account can use right now. Free, local or
   * read-only. Replaces `models` in the composer when it succeeds.
   */
  listModels?(): Promise<ModelOption[]>;
  /** Hidden from the composer unless development fixtures are enabled. */
  devOnly?: boolean;
  detect(): Promise<AgentStatus>;
  testConnection(): Promise<ConnectionTest>;
  run(ctx: AgentRunContext): Promise<AgentResult>;
}

/** Public, serialisable view of an adapter for the frontend. */
export interface AgentDescriptor {
  id: AgentId;
  name: string;
  vendor: string;
  kind: ExecutionKind;
  automation: AutomationLevel;
  docsUrl: string;
  capabilities: AgentCapabilities;
  limitations: string[];
  setup: SetupStep[];
  credentialEnv: string[];
  models: ModelOption[];
  devOnly: boolean;
}

export function describe(adapter: AgentAdapter): AgentDescriptor {
  return {
    id: adapter.id,
    name: adapter.name,
    vendor: adapter.vendor,
    kind: adapter.kind,
    automation: adapter.automation,
    docsUrl: adapter.docsUrl,
    capabilities: adapter.capabilities,
    limitations: adapter.limitations,
    setup: adapter.setup,
    credentialEnv: adapter.credentialEnv,
    models: adapter.models,
    devOnly: Boolean(adapter.devOnly),
  };
}
