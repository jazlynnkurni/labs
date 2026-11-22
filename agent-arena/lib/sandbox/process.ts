import { spawn, type ChildProcess } from "node:child_process";
import { redact, secretValues } from "./env";

export interface RunProcessOptions {
  cmd: string;
  args: string[];
  cwd: string;
  env: Record<string, string>;
  /** Written to stdin, then stdin is closed. Keeps prompts out of `ps` output. */
  stdin?: string;
  timeoutMs: number;
  signal?: AbortSignal;
  onStdoutLine?: (line: string) => void;
  onStderrLine?: (line: string) => void;
}

export interface RunProcessResult {
  exitCode: number | null;
  signal: NodeJS.Signals | null;
  timedOut: boolean;
  cancelled: boolean;
  stdout: string;
  stderr: string;
  durationMs: number;
}

const MAX_CAPTURE = 4 * 1024 * 1024;

/** Every live process group we started, so none outlive the arena. */
const g = globalThis as unknown as { __arenaGroups?: Set<number>; __arenaExitHook?: boolean };
const groups = (g.__arenaGroups ??= new Set<number>());
if (!g.__arenaExitHook) {
  g.__arenaExitHook = true;
  const killAll = () => {
    for (const pid of groups) {
      try {
        process.kill(-pid, "SIGKILL");
      } catch {
        /* gone */
      }
    }
  };
  process.on("exit", killAll);
  for (const sig of ["SIGINT", "SIGTERM"] as const) {
    process.once(sig, () => {
      killAll();
      process.exit(130);
    });
  }
}

/**
 * Spawn a process in its own process group so cancelling kills the agent and
 * everything it started (dev servers, test runners), not just the parent.
 * Output is redacted line by line before any callback sees it.
 */
export function runProcess(opts: RunProcessOptions): Promise<RunProcessResult> {
  const started = Date.now();
  const secrets = secretValues();
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    let cancelled = false;
    let settled = false;

    let child: ChildProcess;
    try {
      child = spawn(opts.cmd, opts.args, {
        cwd: opts.cwd,
        env: opts.env as NodeJS.ProcessEnv,
        detached: true,
        stdio: ["pipe", "pipe", "pipe"],
      });
    } catch (err) {
      resolve({
        exitCode: null,
        signal: null,
        timedOut: false,
        cancelled: false,
        stdout: "",
        stderr: String(err),
        durationMs: Date.now() - started,
      });
      return;
    }

    if (child.pid !== undefined) groups.add(child.pid);

    const killGroup = (sig: NodeJS.Signals) => {
      if (child.pid === undefined) return;
      try {
        process.kill(-child.pid, sig);
      } catch {
        try {
          child.kill(sig);
        } catch {
          /* already gone */
        }
      }
    };

    const stop = (reason: "timeout" | "cancel") => {
      if (settled) return;
      if (reason === "timeout") timedOut = true;
      else cancelled = true;
      killGroup("SIGTERM");
      setTimeout(() => killGroup("SIGKILL"), 5000).unref();
    };

    const timer = setTimeout(() => stop("timeout"), opts.timeoutMs);
    timer.unref();
    const onAbort = () => stop("cancel");
    if (opts.signal) {
      if (opts.signal.aborted) onAbort();
      else opts.signal.addEventListener("abort", onAbort, { once: true });
    }

    const lineReader = (cb: ((l: string) => void) | undefined, sink: (s: string) => void) => {
      let buf = "";
      return {
        push(chunk: Buffer) {
          const text = redact(chunk.toString("utf8"), secrets);
          sink(text);
          if (!cb) return;
          buf += text;
          let idx;
          while ((idx = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, idx).replace(/\r$/, "");
            buf = buf.slice(idx + 1);
            if (line.length) cb(line);
          }
        },
        flush() {
          if (cb && buf.length) cb(buf);
          buf = "";
        },
      };
    };

    const out = lineReader(opts.onStdoutLine, (s) => {
      if (stdout.length < MAX_CAPTURE) stdout += s;
    });
    const err = lineReader(opts.onStderrLine, (s) => {
      if (stderr.length < MAX_CAPTURE) stderr += s;
    });

    child.stdout?.on("data", (c: Buffer) => out.push(c));
    child.stderr?.on("data", (c: Buffer) => err.push(c));
    child.stdin?.on("error", () => {});
    if (opts.stdin !== undefined) child.stdin?.end(opts.stdin);
    else child.stdin?.end();

    const finish = (exitCode: number | null, signal: NodeJS.Signals | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      opts.signal?.removeEventListener("abort", onAbort);
      out.flush();
      err.flush();
      // Leave nothing behind from this group.
      killGroup("SIGKILL");
      if (child.pid !== undefined) groups.delete(child.pid);
      resolve({ exitCode, signal, timedOut, cancelled, stdout, stderr, durationMs: Date.now() - started });
    };

    child.on("error", (e) => {
      stderr += String(e);
      finish(null, null);
    });
    child.on("close", (code, sig) => finish(code, sig));
  });
}

/** Run a short command and return trimmed stdout, or undefined on failure. */
export async function quick(cmd: string, args: string[], cwd = process.cwd(), env?: Record<string, string>) {
  const res = await runProcess({
    cmd,
    args,
    cwd,
    env: env ?? (process.env as Record<string, string>),
    timeoutMs: 20_000,
  });
  if (res.exitCode !== 0) return { ok: false as const, stdout: res.stdout.trim(), stderr: res.stderr.trim() };
  return { ok: true as const, stdout: res.stdout.trim(), stderr: res.stderr.trim() };
}
