import os from "node:os";

/**
 * Child processes never inherit the arena's environment wholesale. They get a
 * short allowlist of harmless variables plus, for an agent, only the
 * credential variables that agent declared. Nothing else from the host leaks in.
 */
const BASE_ALLOW = ["PATH", "HOME", "USER", "LOGNAME", "SHELL", "LANG", "LC_ALL", "TERM", "TMPDIR", "TZ"];

export function buildChildEnv(opts: { allow?: string[]; extra?: Record<string, string | undefined> } = {}) {
  const env: Record<string, string> = {};
  for (const key of [...BASE_ALLOW, ...(opts.allow ?? [])]) {
    const value = process.env[key];
    if (value !== undefined && value !== "") env[key] = value;
  }
  // Agents run non-interactively; keep colour codes out of captured logs.
  env.NO_COLOR = "1";
  env.FORCE_COLOR = "0";
  env.CI = "1";
  if (!env.HOME) env.HOME = os.homedir();
  if (!env.PATH) env.PATH = "/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin";
  for (const [k, v] of Object.entries(opts.extra ?? {})) {
    if (v !== undefined) env[k] = v;
  }
  return env;
}

/** Names of env vars that look like credentials, for redaction. */
const SECRETISH = /(KEY|TOKEN|SECRET|PASSWORD|PASS|AUTH|COOKIE|SESSION)/i;

/** Collect the values of every credential-looking variable so logs can be scrubbed. */
export function secretValues(): string[] {
  const values: string[] = [];
  for (const [k, v] of Object.entries(process.env)) {
    if (v && v.length >= 8 && SECRETISH.test(k)) values.push(v);
  }
  return values.sort((a, b) => b.length - a.length);
}

const TOKEN_PATTERNS: RegExp[] = [
  /sk-ant-[A-Za-z0-9_-]{10,}/g,
  /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/g,
  /apk_[A-Za-z0-9_-]{10,}/g,
  /cog_[A-Za-z0-9_-]{10,}/g,
  /gh[pousr]_[A-Za-z0-9]{20,}/g,
  /Bearer\s+[A-Za-z0-9._-]{16,}/g,
];

/** Remove credential values and well-known token shapes from text before it is stored or shown. */
export function redact(text: string, values: string[] = secretValues()): string {
  let out = text;
  for (const v of values) out = out.split(v).join("[redacted]");
  for (const re of TOKEN_PATTERNS) out = out.replace(re, "[redacted]");
  return out;
}
