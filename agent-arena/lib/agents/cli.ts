import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { quick, runProcess, type RunProcessResult } from "@/lib/sandbox/process";
import { buildChildEnv } from "@/lib/sandbox/env";
import type { AgentRunContext } from "./types";

/** Places CLIs install themselves that a GUI-launched server's PATH may miss. */
const EXTRA_BIN_DIRS = [
  path.join(os.homedir(), ".local", "bin"),
  path.join(os.homedir(), ".npm-global", "bin"),
  path.join(os.homedir(), ".bun", "bin"),
  path.join(os.homedir(), ".cursor", "bin"),
  "/opt/homebrew/bin",
  "/usr/local/bin",
];

export function searchPath() {
  const parts = (process.env.PATH ?? "").split(path.delimiter).filter(Boolean);
  for (const d of EXTRA_BIN_DIRS) if (!parts.includes(d)) parts.push(d);
  return parts.join(path.delimiter);
}

/** Resolve a binary by name without running it. An env override wins. */
export function which(names: string[], overrideEnv?: string): string | undefined {
  const override = overrideEnv ? process.env[overrideEnv]?.trim() : undefined;
  if (override && fs.existsSync(override)) return override;
  for (const dir of searchPath().split(path.delimiter)) {
    for (const name of names) {
      const p = path.join(dir, name);
      try {
        fs.accessSync(p, fs.constants.X_OK);
        return p;
      } catch {
        /* keep looking */
      }
    }
  }
  return undefined;
}

export function agentEnv(credentialEnv: string[], extra: Record<string, string | undefined> = {}) {
  return buildChildEnv({ allow: credentialEnv, extra: { PATH: searchPath(), ...extra } });
}

export async function versionOf(bin: string, args = ["--version"]) {
  const r = await quick(bin, args, os.tmpdir(), agentEnv([]));
  const line = (r.stdout || r.stderr).split("\n")[0]?.trim();
  return r.ok && line ? line.slice(0, 80) : undefined;
}

/** A raw transcript file per run, so every byte the agent printed is kept. */
export function transcriptWriter(file: string) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const fd = fs.openSync(file, "a");
  return {
    line(stream: "out" | "err", text: string) {
      fs.writeSync(fd, `${stream === "err" ? "[stderr] " : ""}${text}\n`);
    },
    close() {
      try {
        fs.closeSync(fd);
      } catch {
        /* closed */
      }
    },
  };
}

export interface CliRunSpec {
  bin: string;
  args: string[];
  stdin?: string;
  env: Record<string, string>;
  transcriptFile: string;
  onJson?: (obj: Record<string, unknown>) => void;
  onText?: (line: string, stream: "stdout" | "stderr") => void;
}

/**
 * Run an agent CLI in the agent's own workspace. Lines that parse as JSON go
 * to `onJson`; everything else is shown as a log line. Every line is also
 * written to the run's transcript.
 */
export async function runCli(ctx: AgentRunContext, spec: CliRunSpec): Promise<RunProcessResult> {
  const t = transcriptWriter(spec.transcriptFile);
  try {
    return await runProcess({
      cmd: spec.bin,
      args: spec.args,
      cwd: ctx.workspaceDir,
      env: spec.env,
      stdin: spec.stdin,
      timeoutMs: ctx.limits.timeoutMs,
      signal: ctx.signal,
      onStdoutLine: (line) => {
        t.line("out", line);
        const trimmed = line.trim();
        if (spec.onJson && trimmed.startsWith("{")) {
          try {
            spec.onJson(JSON.parse(trimmed));
            return;
          } catch {
            /* not JSON after all */
          }
        }
        if (spec.onText) spec.onText(line, "stdout");
        else ctx.emit({ type: "log", stream: "stdout", text: line });
      },
      onStderrLine: (line) => {
        t.line("err", line);
        if (spec.onText) spec.onText(line, "stderr");
        else ctx.emit({ type: "log", stream: "stderr", text: line });
      },
    });
  } finally {
    t.close();
  }
}

export function failureText(res: RunProcessResult, fallback: string) {
  if (res.timedOut) return "Stopped at the time limit.";
  if (res.cancelled) return "Cancelled.";
  const tail = res.stderr.trim().split("\n").slice(-6).join("\n");
  return tail || fallback;
}

export const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** Short, one-line description of a tool call's input for the activity feed. */
export function describeInput(input: unknown): string | undefined {
  if (!input || typeof input !== "object") return undefined;
  const o = input as Record<string, unknown>;
  const v = o.command ?? o.file_path ?? o.path ?? o.pattern ?? o.url ?? o.description;
  return typeof v === "string" ? v.slice(0, 200) : undefined;
}
