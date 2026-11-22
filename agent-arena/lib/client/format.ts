export function duration(ms?: number) {
  if (ms === undefined || ms === null) return "n/a";
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${String(s % 60).padStart(2, "0")}s`;
}

export function tokens(n?: number) {
  if (n === undefined) return undefined;
  return n >= 1000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k` : String(n);
}

export function usd(n?: number) {
  if (n === undefined) return undefined;
  return `$${n.toFixed(n < 1 ? 3 : 2)}`;
}

export function relative(iso?: string) {
  if (!iso) return "";
  const d = Date.now() - Date.parse(iso);
  const m = Math.round(d / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function bytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

const AGENT_COLOR: Record<string, string> = {
  "claude-code": "var(--agent-1)",
  codex: "var(--agent-2)",
  cursor: "var(--agent-3)",
  blackbox: "var(--agent-4)",
  devin: "var(--agent-5)",
  "dev-fixture": "var(--agent-6)",
};
export const agentColor = (id: string) => AGENT_COLOR[id] ?? "var(--agent-6)";

/** The model asked for wins; otherwise whatever the agent reported it used. */
export function runLabel(r: { agentName: string; model?: string; reportedModel?: string }) {
  const m = r.model || r.reportedModel;
  return m ? `${r.agentName} (${m})` : r.agentName;
}
