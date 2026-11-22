import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runProcess, quick, type RunProcessResult } from "./process";
import { buildChildEnv } from "./env";
import { searchPath } from "@/lib/agents/cli";

/**
 * Where generated code runs during evaluation and previews. Generated code is
 * untrusted, so it never runs with plain host access:
 *
 *  - docker: a throwaway node container that sees only the workspace.
 *  - host-sandbox: macOS sandbox-exec. Writes are confined to the workspace,
 *    every read under your home folder except the workspace is refused, and
 *    the environment is empty apart from PATH. Network stays on so installs work.
 */
export type ExecRunner = "docker" | "host-sandbox";

export const DOCKER_IMAGE = process.env.ARENA_DOCKER_IMAGE || "node:24-bookworm-slim";

export async function dockerAvailable() {
  const r = await quick("docker", ["info", "--format", "{{.ServerVersion}}"], os.tmpdir(), buildChildEnv({ extra: { PATH: searchPath() } }));
  return r.ok;
}

export function sandboxExecAvailable() {
  return process.platform === "darwin" && fs.existsSync("/usr/bin/sandbox-exec");
}

export async function runnerAvailability() {
  const docker = await dockerAvailable();
  const host = sandboxExecAvailable();
  return { docker, "host-sandbox": host };
}

function sbString(s: string) {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Build the sandbox-exec profile for one workspace. Reads under the home
 * folder are refused except the workspace itself and the bare directory
 * entries on the path down to it (Node lstat()s every parent when it resolves
 * a file; those entries reveal folder names only, never file contents).
 */
export function sandboxProfile(workspace: string, home = process.env.ARENA_SANDBOX_HOME || os.homedir()) {
  const ws = fs.realpathSync(workspace);
  const realHome = fs.existsSync(home) ? fs.realpathSync(home) : home;
  const ancestors: string[] = [];
  for (let dir = path.dirname(ws); dir.length > 1; dir = path.dirname(dir)) ancestors.push(dir);
  const literals = ancestors.map((d) => `(literal ${sbString(d)})`).join(" ");
  return `(version 1)
(allow default)
(deny file-write* (subpath "/"))
(allow file-write* (subpath ${sbString(ws)}) (literal "/dev/null") (literal "/dev/tty") (regex #"^/dev/fd/") (regex #"^/dev/ttys"))
(deny file-read* (subpath ${sbString(realHome)}))
(allow file-read* ${literals} (subpath ${sbString(ws)}))
`;
}

export interface ExecOptions {
  workspace: string;
  command: string;
  timeoutMs: number;
  signal?: AbortSignal;
  env?: Record<string, string>;
  /** Docker only: publish this container port on 127.0.0.1. */
  port?: number;
  onLine?: (line: string, stream: "stdout" | "stderr") => void;
  name?: string;
}

/** Run a shell command against a workspace inside the chosen runner. */
export async function execIn(runner: ExecRunner, opts: ExecOptions): Promise<RunProcessResult> {
  const arenaDir = path.join(opts.workspace, ".arena");
  for (const d of ["home", "tmp", "npm-cache"]) fs.mkdirSync(path.join(arenaDir, d), { recursive: true });

  if (runner === "docker") {
    const args = [
      "run",
      "--rm",
      "--init",
      ...(opts.name ? ["--name", opts.name] : []),
      "--memory",
      "4g",
      "--cpus",
      "2",
      "--pids-limit",
      "1024",
      "--security-opt",
      "no-new-privileges",
      "-v",
      `${fs.realpathSync(opts.workspace)}:/work`,
      "-w",
      "/work",
      "-e",
      "HOME=/work/.arena/home",
      "-e",
      "npm_config_cache=/work/.arena/npm-cache",
      "-e",
      "CI=1",
      ...Object.entries(opts.env ?? {}).flatMap(([k, v]) => ["-e", `${k}=${v}`]),
      ...(opts.port ? ["-p", `127.0.0.1:${opts.port}:${opts.port}`] : []),
      DOCKER_IMAGE,
      "sh",
      "-lc",
      `corepack enable >/dev/null 2>&1; ${opts.command}`,
    ];
    return runProcess({
      cmd: "docker",
      args,
      cwd: opts.workspace,
      env: buildChildEnv({ extra: { PATH: searchPath() } }),
      timeoutMs: opts.timeoutMs,
      signal: opts.signal,
      onStdoutLine: (l) => opts.onLine?.(l, "stdout"),
      onStderrLine: (l) => opts.onLine?.(l, "stderr"),
    });
  }

  const profileFile = path.join(arenaDir, "sandbox.sb");
  fs.writeFileSync(profileFile, sandboxProfile(opts.workspace));
  const env: Record<string, string> = {
    PATH: searchPath(),
    HOME: path.join(arenaDir, "home"),
    TMPDIR: path.join(arenaDir, "tmp"),
    npm_config_cache: path.join(arenaDir, "npm-cache"),
    LANG: "en_US.UTF-8",
    CI: "1",
    NO_COLOR: "1",
    NEXT_TELEMETRY_DISABLED: "1",
    ...(opts.env ?? {}),
  };
  return runProcess({
    cmd: "/usr/bin/sandbox-exec",
    args: ["-f", profileFile, "/bin/sh", "-c", opts.command],
    cwd: opts.workspace,
    env,
    timeoutMs: opts.timeoutMs,
    signal: opts.signal,
    onStdoutLine: (l) => opts.onLine?.(l, "stdout"),
    onStderrLine: (l) => opts.onLine?.(l, "stderr"),
  });
}

export async function stopDocker(name: string) {
  await quick("docker", ["rm", "-f", name], os.tmpdir(), buildChildEnv({ extra: { PATH: searchPath() } }));
}
