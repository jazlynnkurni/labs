import fs from "node:fs";
import path from "node:path";
import { artifactDir } from "@/lib/storage/paths";
import { applyPatch } from "@/lib/sandbox/workspace";
import { redact } from "@/lib/sandbox/env";
import { num } from "./cli";
import type { AgentAdapter, Usage } from "./types";

const CRED_ENV = ["DEVIN_API_KEY", "DEVIN_ORG_ID"];
const BASE = () => (process.env.DEVIN_API_BASE?.trim() || "https://api.devin.ai/v3").replace(/\/$/, "");

function creds() {
  const key = process.env.DEVIN_API_KEY?.trim();
  const org = process.env.DEVIN_ORG_ID?.trim();
  return key && org ? { key, org } : undefined;
}

async function api<T>(method: string, route: string, body?: unknown, signal?: AbortSignal): Promise<T> {
  const c = creds();
  if (!c) throw new Error("DEVIN_API_KEY and DEVIN_ORG_ID are not set.");
  const res = await fetch(`${BASE()}/organizations/${encodeURIComponent(c.org)}${route}`, {
    method,
    headers: { Authorization: `Bearer ${c.key}`, ...(body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : {}) },
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    signal,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Devin API ${method} ${route} returned ${res.status}: ${redact(text).slice(0, 300)}`);
  return (text ? JSON.parse(text) : {}) as T;
}

interface DevinSession {
  session_id?: string;
  devin_id?: string;
  url?: string;
  status?: string;
  status_detail?: string;
  acus_consumed?: number;
  on_demand_usage?: number;
  structured_output?: { summary?: string; unified_diff?: string; files_changed?: string[] } | null;
  pull_requests?: { pr_url: string; pr_state?: string }[];
}

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string", description: "What you built and any caveats." },
    files_changed: { type: "array", items: { type: "string" } },
    unified_diff: {
      type: "string",
      description: "The complete unified diff (git diff format) of every change relative to the starting point, including new files.",
    },
  },
  required: ["summary", "unified_diff"],
};

const DEVIN_SUFFIX = `

Files: every path above under .arena/attachments/ (the design context included) is attached to this session under the same file name. Read the attachment wherever the brief names that path.

Delivery for this comparison: do not open a pull request and do not push any branch. When you are finished, put the complete unified diff of all your changes (git diff format, new files included) in the structured output field unified_diff, plus a short summary.`;

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve) => {
    const t = setTimeout(resolve, ms);
    signal.addEventListener("abort", () => (clearTimeout(t), resolve()), { once: true });
  });

/**
 * Devin works in Cognition's cloud, not in the local workspace. The adapter
 * creates a session through the v3 API, polls status and messages, asks for
 * the result as a unified diff in structured output, and applies that diff to
 * Devin's own local workspace so it is evaluated exactly like the others.
 * If no usable diff comes back, the run waits for a manual patch import.
 */
export const devin: AgentAdapter = {
  id: "devin",
  name: "Devin",
  vendor: "Cognition",
  kind: "cloud-api",
  automation: "partial",
  docsUrl: "https://docs.devin.ai/api-reference/overview",
  capabilities: {
    streaming: false,
    tokenUsage: false,
    costReporting: true,
    modelSelection: false,
    localWorkspace: false,
    budgetCap: false,
    cancellation: true,
    imageInput: true,
  },
  limitations: [
    "Runs in Devin's cloud machine, not in the local snapshot. It only sees a repository if you name one that is connected to your Devin org, at that repository's current state, which may differ from the local snapshot.",
    "No live log stream. Progress is polled from the session and its messages every 10 seconds.",
    "Usage is reported in ACUs (acus_consumed). A dollar figure appears only if the API returns on_demand_usage.",
    "The result comes back as a diff in structured output. If it is missing or does not apply, import a patch by hand.",
    "Each session consumes ACUs from your Devin plan.",
  ],
  setup: [
    { label: "Create a service user API key in Devin settings", url: "https://docs.devin.ai/api-reference/overview" },
    { label: "Add DEVIN_API_KEY and DEVIN_ORG_ID to .env.local, then restart the app" },
    { label: "Connect repositories through a Git integration if Devin should start from one", url: "https://docs.devin.ai/integrations/overview" },
  ],
  credentialEnv: CRED_ENV,
  models: [{ id: "", label: "Devin (no model choice)" }],

  async detect() {
    const checkedAt = new Date().toISOString();
    const c = creds();
    return {
      agentId: "devin",
      installed: true,
      version: "API v3",
      auth: c ? "authenticated" : "missing",
      authDetail: c ? "DEVIN_API_KEY and DEVIN_ORG_ID are set (not yet verified)" : "DEVIN_API_KEY or DEVIN_ORG_ID is missing",
      checkedAt,
    };
  },

  async testConnection() {
    if (!creds()) return { ok: false, detail: "Set DEVIN_API_KEY and DEVIN_ORG_ID in .env.local.", billable: false };
    try {
      // Listing sessions is a read and costs no ACUs.
      await api("GET", "/sessions");
      return { ok: true, detail: "The API accepted the key (listed sessions, no ACUs used).", billable: false };
    } catch (e) {
      return { ok: false, detail: (e as Error).message, billable: false };
    }
  },

  async run(ctx) {
    if (!creds()) return { ok: false, error: "DEVIN_API_KEY and DEVIN_ORG_ID are not set.", retries: 0 };
    const attachmentUrls: string[] = [];
    for (const a of ctx.attachments) {
      const form = new FormData();
      form.append("file", new Blob([fs.readFileSync(a.absPath)], { type: a.mime }), a.name);
      const up = await api<{ url: string }>("POST", "/attachments", form, ctx.signal);
      attachmentUrls.push(up.url);
    }
    const body: Record<string, unknown> = {
      prompt: ctx.brief + DEVIN_SUFFIX,
      title: `Agent Arena ${ctx.experimentId}`,
      tags: ["agent-arena"],
      structured_output_schema: OUTPUT_SCHEMA,
    };
    if (ctx.remote?.repo) body.repos = [ctx.remote.repo];
    if (attachmentUrls.length) body.attachment_urls = attachmentUrls;

    const created = await api<DevinSession>("POST", "/sessions", body, ctx.signal);
    const id = created.devin_id ?? created.session_id;
    if (!id) return { ok: false, error: "Devin did not return a session id.", retries: 0 };
    ctx.emit({ type: "status", message: "Session created" });
    if (created.url) ctx.emit({ type: "link", label: "Open in Devin", url: created.url });

    const deadline = Date.now() + ctx.limits.timeoutMs;
    let cursor: string | undefined;
    let session: DevinSession = created;
    let lastStatus = "";
    const seen = new Set<string>();
    const transcript = path.join(artifactDir(ctx.experimentId, ctx.runId), "devin-messages.jsonl");

    while (true) {
      if (ctx.signal.aborted || Date.now() > deadline) {
        const timedOut = !ctx.signal.aborted;
        try {
          await api("DELETE", `/sessions/${id}`);
          ctx.emit({ type: "log", stream: "system", text: "Asked Devin to terminate the session." });
        } catch (e) {
          ctx.emit({ type: "log", stream: "stderr", text: `Could not terminate: ${(e as Error).message}` });
        }
        return { ok: false, error: timedOut ? "Stopped at the time limit." : "Cancelled.", sessionId: id, externalUrl: session.url, retries: 0, usage: usageOf(session) };
      }
      await sleep(10_000, ctx.signal);
      if (ctx.signal.aborted) continue;
      try {
        session = await api<DevinSession>("GET", `/sessions/${id}`);
        // Pagination uses end_cursor; the query parameter name is not spelled out in the
        // docs we verified, so `after` is an assumption. Duplicates are harmless here.
        const msgs = await api<{ items?: { event_id?: string; source?: string; message?: string; created_at?: string }[]; end_cursor?: string }>(
          "GET",
          `/sessions/${id}/messages${cursor ? `?after=${encodeURIComponent(cursor)}` : ""}`,
        );
        for (const m of msgs.items ?? []) {
          const key = m.event_id ?? `${m.created_at}:${m.message?.slice(0, 40)}`;
          if (seen.has(key)) continue;
          seen.add(key);
          fs.appendFileSync(transcript, JSON.stringify(m) + "\n");
          if (m.source === "devin" && m.message) ctx.emit({ type: "message", text: m.message });
        }
        if (msgs.end_cursor) cursor = msgs.end_cursor;
      } catch (e) {
        ctx.emit({ type: "log", stream: "stderr", text: (e as Error).message });
        continue;
      }
      const status = `${session.status ?? "?"}${session.status_detail ? ` / ${session.status_detail}` : ""}`;
      if (status !== lastStatus) {
        ctx.emit({ type: "status", message: `Devin: ${status}` });
        lastStatus = status;
      }
      const u = usageOf(session);
      if (u) ctx.emit({ type: "usage", usage: u });
      const done =
        session.status === "exit" ||
        session.status === "error" ||
        session.status_detail === "finished" ||
        (session.status_detail === "waiting_for_user" && Boolean(session.structured_output?.unified_diff)) ||
        session.status === "suspended";
      if (done) break;
    }

    const out = session.structured_output ?? undefined;
    const usage = usageOf(session);
    if (out?.unified_diff?.trim()) {
      const patchFile = path.join(artifactDir(ctx.experimentId, ctx.runId), "devin.patch");
      fs.writeFileSync(patchFile, out.unified_diff.endsWith("\n") ? out.unified_diff : out.unified_diff + "\n");
      try {
        await applyPatch(ctx.workspaceDir, patchFile);
        ctx.emit({ type: "status", message: "Applied Devin's diff to its local workspace" });
        return { ok: session.status !== "error", summary: out.summary, usage, sessionId: id, externalUrl: session.url, retries: 0 };
      } catch (e) {
        return {
          ok: false,
          summary: out.summary,
          usage,
          sessionId: id,
          externalUrl: session.url,
          retries: 0,
          awaitingManualImport: true,
          error: (e as Error).message,
        };
      }
    }
    return {
      ok: false,
      summary: out?.summary,
      usage,
      sessionId: id,
      externalUrl: session.url,
      retries: 0,
      awaitingManualImport: true,
      error: `Devin finished (${session.status}${session.status_detail ? ` / ${session.status_detail}` : ""}) without a diff in structured output. Import a patch by hand.`,
    };
  },
};

function usageOf(s: DevinSession): Usage | undefined {
  const acus = num(s.acus_consumed);
  const usd = num(s.on_demand_usage);
  if (acus === undefined && usd === undefined) return undefined;
  return {
    other: acus !== undefined ? { acus } : undefined,
    costUsd: usd,
    costSource: usd !== undefined ? "reported" : undefined,
  };
}
