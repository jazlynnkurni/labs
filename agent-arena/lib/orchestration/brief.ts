import { createHash } from "node:crypto";
import type { ExperimentConfig } from "@/lib/storage/repo";
export { DEFAULT_CONSTRAINTS } from "./constraints";

/**
 * The brief is built once, frozen, hashed and handed byte for byte to every
 * agent. Nothing agent-specific goes in here; per-agent differences are
 * recorded separately so they can be shown next to the results.
 */
export function composeBrief(prompt: string, constraints: string, attachmentPaths: string[], contextPath?: string) {
  const parts = [prompt.trim()];
  if (contextPath) {
    parts.push(`Before you start, read ${contextPath}. It holds the design rules of the person who wrote this task, and every agent received the same file. Follow them wherever they apply.`);
  }
  if (attachmentPaths.length) {
    parts.push(`Attached files (read them, do not modify them):\n${attachmentPaths.map((p) => `- ${p}`).join("\n")}`);
  }
  if (constraints.trim()) parts.push(`Constraints:\n${constraints.trim()}`);
  return parts.join("\n\n");
}

export function hashConfig(brief: string, config: ExperimentConfig, sourceCommit: string) {
  const stable = JSON.stringify({ brief, config, sourceCommit });
  return createHash("sha256").update(stable).digest("hex").slice(0, 16);
}

export function titleFrom(prompt: string) {
  const line = prompt.trim().split("\n")[0].replace(/\s+/g, " ");
  return line.length > 72 ? `${line.slice(0, 71).trimEnd()}…` : line || "Untitled task";
}
