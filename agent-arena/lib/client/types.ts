import type { AgentDescriptor, AgentStatus, AgentEvent } from "@/lib/agents/types";
import type { AgentRun, Artifact, Experiment, Metric, Rating } from "@/lib/storage/repo";

export type AgentWithStatus = AgentDescriptor & { status: AgentStatus };

export type RunView = Omit<AgentRun, "workspaceDir"> & {
  agent?: AgentDescriptor;
  artifacts: (Omit<Artifact, "path"> & { meta: Record<string, unknown> })[];
  metrics: Metric[];
  ratings: Rating[];
};

export interface ExperimentDetail {
  experiment: Experiment;
  active: boolean;
  attachments: { id: string; name: string; mime: string; size: number }[];
  runs: RunView[];
}

export interface StreamEvent {
  id: number;
  experimentId: string;
  agentRunId?: string;
  ts: string;
  type: "agent" | "run" | "experiment" | "eval" | string;
  payload: Record<string, unknown>;
}

export type FeedItem = { id: number; ts: string; event: AgentEvent };
export type EvalStep = { step: string; status: "running" | "pass" | "fail" | "skip"; detail?: string; ts: string };

export interface SystemInfo {
  runners: { docker: boolean; "host-sandbox": boolean };
  devFixtures: boolean;
  dataDir: string;
  platform: string;
  history: Record<string, { runs: number; withCost: number; avgCostUsd?: number; avgDurationMs?: number }>;
}
