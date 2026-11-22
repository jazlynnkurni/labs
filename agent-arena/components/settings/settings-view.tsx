"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Loader2, Minus, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/client/api";
import { agentColor } from "@/lib/client/format";
import type { AgentWithStatus, SystemInfo } from "@/lib/client/types";
import type { AgentCapabilities } from "@/lib/agents/types";
import { Button } from "@/components/ui/button";
import { AgentMark } from "@/components/status";
import { SwapChevron } from "@/components/chevron";
import { readiness, SetupHint } from "@/components/agent-setup";

const CAPS: { key: keyof AgentCapabilities; label: string }[] = [
  { key: "streaming", label: "Live progress" },
  { key: "tokenUsage", label: "Token usage" },
  { key: "costReporting", label: "Cost reporting" },
  { key: "modelSelection", label: "Model choice" },
  { key: "localWorkspace", label: "Local workspace" },
  { key: "budgetCap", label: "Dollar cap" },
  { key: "cancellation", label: "Cancellation" },
  { key: "imageInput", label: "Image input" },
];

export function SettingsView() {
  const [agents, setAgents] = useState<AgentWithStatus[]>();
  const [system, setSystem] = useState<SystemInfo>();
  const [refreshing, setRefreshing] = useState(false);
  const [target, setTarget] = useState<string>();

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const [a, s] = await Promise.all([api<{ agents: AgentWithStatus[] }>("/api/agents"), api<SystemInfo>("/api/system")]);
      setAgents(a.agents);
      setSystem(s);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    Promise.all([api<{ agents: AgentWithStatus[] }>("/api/agents"), api<SystemInfo>("/api/system")])
      .then(([a, s]) => {
        setAgents(a.agents);
        setSystem(s);
        // "Set up" in the composer links to #agent-<id>: mark that card once the cards exist.
        setTarget(decodeURIComponent(window.location.hash.slice(1)) || undefined);
      })
      .catch((e) => toast.error((e as Error).message));
  }, []);

  useEffect(() => {
    if (target) document.getElementById(target)?.scrollIntoView({ block: "start" });
  }, [target]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-12 pb-24 md:px-8 md:pt-20">
      <header className="mb-10 flex flex-wrap items-end gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Connections and setup</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Credentials stay in your shell, CLI logins or <code className="font-mono text-xs">.env.local</code>. The arena never shows or logs them, and checks here never spend tokens.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={load} disabled={refreshing}>
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
          Recheck
        </Button>
      </header>

      {system && (
        <section className="mb-10 grid gap-px overflow-hidden rounded-xl bg-hairline text-[13px] shadow-raised sm:grid-cols-3">
          <SysCell label="Docker runner" ok={system.runners.docker} detail={system.runners.docker ? "Daemon is running" : "Not running. Start Docker Desktop to use it."} />
          <SysCell label="macOS sandbox runner" ok={system.runners["host-sandbox"]} detail={system.runners["host-sandbox"] ? "sandbox-exec available" : "Only on macOS"} />
          <SysCell label="Data folder" ok detail={system.dataDir} mono />
        </section>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {!agents
          ? [0, 1, 2, 3].map((i) => <div key={i} className="h-80 animate-pulse rounded-2xl bg-surface-2/60" />)
          : agents.map((a) => <AgentCard key={a.id} agent={a} onTested={load} targeted={target === `agent-${a.id}`} />)}
      </div>
    </div>
  );
}

function SysCell({ label, ok, detail, mono }: { label: string; ok: boolean; detail: string; mono?: boolean }) {
  return (
    <div className="min-w-0 bg-surface p-4">
      <p className="flex items-center gap-2">
        <span className={cn("size-2 rounded-full", ok ? "bg-success" : "bg-faint")} />
        {label}
      </p>
      <p className={cn("mt-1 truncate text-xs text-muted-foreground", mono && "font-mono")} title={detail}>
        {detail}
      </p>
    </div>
  );
}

function AgentCard({ agent, onTested, targeted }: { agent: AgentWithStatus; onTested: () => void; targeted: boolean }) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; detail: string }>();
  const s = agent.status;

  async function test() {
    setTesting(true);
    try {
      setResult(await api<{ ok: boolean; detail: string }>(`/api/agents/${agent.id}/test`, { method: "POST" }));
      onTested();
    } catch (e) {
      setResult({ ok: false, detail: (e as Error).message });
    } finally {
      setTesting(false);
    }
  }

  const installLabel = agent.kind === "cloud-api" ? "API" : "Installed";
  const ready = readiness(agent);
  return (
    <article
      id={`agent-${agent.id}`}
      className={cn("flex scroll-mt-8 flex-col rounded-2xl bg-surface p-5 shadow-raised", targeted && "outline outline-warning/50")}
      aria-label={agent.name}
    >
      <header className="flex min-w-0 items-center gap-2.5">
        <AgentMark color={agentColor(agent.id)} />
        <h2 className="truncate text-[15px] font-semibold tracking-tight">{agent.name}</h2>
        <span className="truncate text-xs text-faint">{agent.vendor}</span>
        <span className={cn("ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px]", agent.automation === "full" ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>
          {agent.automation === "full" ? "Automated" : "Partially automated"}
        </span>
      </header>

      {!ready.ready && <SetupHint r={ready} className="mt-4 rounded-lg bg-warning/10 px-3 py-2 text-xs leading-5" />}

      <dl className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <div className="min-w-0">
          <dt className="text-faint">{installLabel}</dt>
          <dd className={cn("mt-0.5 flex items-center gap-1", s.installed ? "text-foreground" : "text-warning")}>
            {s.installed ? <Check className="size-3.5 text-success" /> : <X className="size-3.5" />}
            {s.installed ? "Yes" : "No"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-faint">Auth</dt>
          <dd className={cn("mt-0.5 truncate", s.auth === "authenticated" ? "text-foreground" : s.auth === "missing" ? "text-warning" : "text-muted-foreground")} title={s.authDetail}>
            {s.auth === "authenticated" ? "Signed in" : s.auth === "missing" ? "Missing" : "Unknown"}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-faint">Version</dt>
          <dd className="mt-0.5 truncate font-mono" title={s.version}>
            {s.version ?? "n/a"}
          </dd>
        </div>
      </dl>
      {ready.ready && s.authDetail && <p className="mt-2 text-xs text-muted-foreground">{s.authDetail}</p>}

      <div className="mt-5">
        <h3 className="mb-2 text-xs font-medium text-faint">Capabilities</h3>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          {CAPS.map((c) => (
            <li key={c.key} className={cn("flex items-center gap-1.5", agent.capabilities[c.key] ? "text-foreground" : "text-faint")}>
              {agent.capabilities[c.key] ? <Check className="size-3 text-success" /> : <Minus className="size-3" />}
              {c.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-5">
        <h3 className="mb-2 text-xs font-medium text-faint">Setup</h3>
        <ol className="flex flex-col gap-2 text-xs">
          {agent.setup.map((step, i) => (
            <li key={i} className="flex flex-col gap-1">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="text-faint tnum">{i + 1}.</span> {step.label}
                {step.url && (
                  <a href={step.url} target="_blank" rel="noreferrer noopener" aria-label="Docs" className="text-faint [@media(hover:hover)]:hover:text-foreground">
                    <ExternalLink className="size-3" />
                  </a>
                )}
              </span>
              {step.command && <CommandLine command={step.command} />}
            </li>
          ))}
          {agent.credentialEnv.length > 0 && (
            <li className="text-faint">
              Env vars it may read: <span className="font-mono">{agent.credentialEnv.join(", ")}</span>
            </li>
          )}
        </ol>
      </div>

      <details className="mt-5 text-xs">
        <summary className="flex h-6 cursor-pointer items-center gap-1.5 text-faint [@media(hover:hover)]:hover:text-foreground">
          Known limitations ({agent.limitations.length})
          <SwapChevron className="[&>svg]:size-3" />
        </summary>
        <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4 text-muted-foreground marker:text-faint">
          {agent.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </details>

      <footer className="mt-auto flex items-center gap-3 pt-5">
        <Button size="sm" variant="secondary" onClick={test} disabled={testing}>
          {testing && <Loader2 className="size-3.5 animate-spin" />}
          Test connection
        </Button>
        {result && <p className={cn("min-w-0 flex-1 truncate text-xs", result.ok ? "text-success" : "text-warning")} title={result.detail}>{result.detail}</p>}
        {agent.docsUrl && (
          <a href={agent.docsUrl} target="_blank" rel="noreferrer noopener" className="ml-auto inline-flex shrink-0 items-center gap-1 text-xs text-faint [@media(hover:hover)]:hover:text-foreground">
            Docs <ExternalLink className="size-3" />
          </a>
        )}
      </footer>
    </article>
  );
}

function CommandLine({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <span className="flex min-w-0 items-center gap-1 rounded-md bg-surface-2 pl-2.5 font-mono text-[11.5px]">
      <span className="min-w-0 flex-1 truncate py-1.5">{command}</span>
      <button
        aria-label="Copy command"
        onClick={() => {
          void navigator.clipboard.writeText(command);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        className="grid size-7 shrink-0 place-items-center text-faint [@media(hover:hover)]:hover:text-foreground"
      >
        {copied ? <Check className="size-3 text-success" /> : <Copy className="size-3" />}
      </button>
    </span>
  );
}
