"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUp, FolderGit2, Paperclip, Plus, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/lib/client/api";
import { agentColor, bytes, duration, usd } from "@/lib/client/format";
import type { AgentWithStatus, SystemInfo } from "@/lib/client/types";
import { DEFAULT_CONSTRAINTS } from "@/lib/orchestration/constraints";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchSelect } from "@/components/ui/search-select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AgentMark } from "@/components/status";
import { SwapChevron } from "@/components/chevron";
import { readiness, SetupHint } from "@/components/agent-setup";
import { DesignContextPicker, type DesignContextValue } from "./design-context-picker";
import { buttonVariants } from "@/components/ui/button";

type ModelPick = { model: string; custom: string };
/** Per agent: on or off, and one or more models (the same agent can run once per model). */
type Selection = Record<string, { on: boolean; models: ModelPick[] }>;
type RepoInfo = { path: string; commit: string; branch?: string; dirty: boolean; remote?: string; subject?: string };

const CUSTOM = "__custom__";
/** Above this many models, the picker gets a search field. */
const SEARCH_AT = 12;

export function Composer() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentWithStatus[]>();
  const [system, setSystem] = useState<SystemInfo>();
  const [prompt, setPrompt] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sel, setSel] = useState<Selection>({});
  const [sourceKind, setSourceKind] = useState<"empty" | "local-repo">("empty");
  const [repoPath, setRepoPath] = useState("");
  const [repo, setRepo] = useState<RepoInfo>();
  const [repoError, setRepoError] = useState<string>();
  const [parallel, setParallel] = useState(true);
  const [timeoutMinutes, setTimeoutMinutes] = useState(20);
  const [budget, setBudget] = useState("5");
  const [maxTurns, setMaxTurns] = useState("");
  const [evalEnabled, setEvalEnabled] = useState(true);
  const [runner, setRunner] = useState<"docker" | "host-sandbox">("host-sandbox");
  const [constraints, setConstraints] = useState(DEFAULT_CONSTRAINTS);
  const [showConstraints, setShowConstraints] = useState(false);
  const [devinRepo, setDevinRepo] = useState("");
  const [designContext, setDesignContext] = useState<DesignContextValue>({ enabled: true, ids: [] });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api<{ agents: AgentWithStatus[] }>("/api/agents")
      .then((d) => {
        setAgents(d.agents);
        setSel((prev) => {
          const next: Selection = { ...prev };
          for (const a of d.agents) next[a.id] ??= { on: false, models: [{ model: a.models[0]?.id ?? "", custom: "" }] };
          return next;
        });
      })
      .catch((e) => toast.error(e.message));
    api<SystemInfo>("/api/system")
      .then((s) => {
        setSystem(s);
        setRunner(s.runners.docker ? "docker" : "host-sandbox");
      })
      .catch(() => undefined);
  }, []);

  const chosen = useMemo(
    () =>
      (agents ?? [])
        .filter((a) => sel[a.id]?.on)
        .flatMap((a) =>
          sel[a.id].models.map((p) => {
            const model = p.model === CUSTOM ? p.custom.trim() : p.model;
            return { agent: a, model: model || undefined };
          }),
        ),
    [agents, sel],
  );

  const budgetNum = Number(budget) > 0 ? Number(budget) : undefined;
  const turnsNum = Number(maxTurns) > 0 ? Math.floor(Number(maxTurns)) : undefined;
  const billable = chosen.filter((c) => !c.agent.devOnly);
  const duplicate = new Set(chosen.map((c) => `${c.agent.id}:${c.model ?? ""}`)).size !== chosen.length;
  const canRun = prompt.trim().length > 0 && chosen.length > 0 && !duplicate && !submitting && (sourceKind === "empty" || Boolean(repo));

  async function inspect() {
    setRepo(undefined);
    setRepoError(undefined);
    if (!repoPath.trim()) return;
    try {
      setRepo(await api<RepoInfo>(`/api/repo/inspect?path=${encodeURIComponent(repoPath.trim())}`));
    } catch (e) {
      setRepoError((e as Error).message);
    }
  }

  async function submit() {
    setSubmitting(true);
    try {
      const payload = {
        prompt,
        source: sourceKind === "empty" ? { kind: "empty" } : { kind: "local-repo", path: repo!.path },
        config: {
          agents: chosen.map((c) => ({ agentId: c.agent.id, model: c.model })),
          parallel,
          limits: { timeoutMinutes, maxBudgetUsd: budgetNum, maxTurns: turnsNum },
          evaluation: { enabled: evalEnabled, runner: evalEnabled ? runner : "off" },
          constraints,
          remote: devinRepo.trim() ? { repo: devinRepo.trim() } : undefined,
          context: designContext.enabled && designContext.ids.length ? { ids: designContext.ids } : undefined,
        },
        confirmedPaid: true,
      };
      const form = new FormData();
      form.append("payload", JSON.stringify(payload));
      for (const f of files) form.append("files", f);
      const { id } = await api<{ id: string }>("/api/experiments", { method: "POST", body: form });
      router.push(`/experiments/${id}`);
    } catch (e) {
      toast.error((e as Error).message);
      setSubmitting(false);
      setConfirmOpen(false);
    }
  }

  function openConfirm() {
    if (!canRun) return;
    setAcknowledged(billable.length === 0);
    setConfirmOpen(true);
  }

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      if (f.size > 20 * 1024 * 1024) {
        toast.error(`${f.name} is larger than 20 MB.`);
        continue;
      }
      if (!next.some((x) => x.name === f.name && x.size === f.size)) next.push(f);
    }
    setFiles(next);
  }

  const devinSelected = chosen.some((c) => c.agent.id === "devin");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-12 pb-24 md:px-8 md:pt-20">
      <header className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">One task, several agents, side by side</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Each agent gets the same frozen brief and its own copy of the starting files. Nothing is pushed anywhere.
        </p>
      </header>

      {/* Prompt */}
      <section
        className="rounded-2xl bg-surface p-2 shadow-raised"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          addFiles(e.dataTransfer.files);
        }}
      >
        <label htmlFor="prompt" className="sr-only">
          Task
        </label>
        <textarea
          id="prompt"
          ref={textarea}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              openConfirm();
            }
          }}
          placeholder="Describe the coding task. For example: Build a pomodoro timer as a Vite + React app with a settings panel and keyboard shortcuts."
          className="block min-h-44 w-full resize-y bg-transparent px-3 py-3 text-[15px] leading-relaxed outline-none placeholder:text-faint"
        />
        {files.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 px-2 pb-2">
            {files.map((f) => (
              <li key={`${f.name}-${f.size}`} className="flex h-7 min-w-0 items-center gap-1.5 rounded-md bg-surface-2 pr-1 pl-2 text-xs">
                <span className="max-w-48 truncate">{f.name}</span>
                <span className="shrink-0 text-faint tnum">{bytes(f.size)}</span>
                <button
                  type="button"
                  aria-label={`Remove ${f.name}`}
                  onClick={() => setFiles(files.filter((x) => x !== f))}
                  className="grid size-6 shrink-0 place-items-center text-faint [@media(hover:hover)]:hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-1 border-t border-hairline px-1 pt-2">
          <input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => (addFiles(e.target.files), (e.target.value = ""))} />
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => fileInput.current?.click()}>
            <Paperclip className="size-4" strokeWidth={1.75} />
            Attach
          </Button>
          <span className="ml-auto hidden text-xs text-faint sm:inline">⌘ Enter to run</span>
          <Button size="sm" className="ml-2" disabled={!canRun} onClick={openConfirm}>
            {submitting ? <Loader2 className="size-4 animate-spin" /> : <ArrowUp className="size-4" />}
            Run comparison
          </Button>
        </div>
      </section>

      {/* Agents */}
      <Section title="Agents" hint={duplicate ? "The same model is picked twice" : chosen.length ? `${chosen.length} ${chosen.length === 1 ? "run" : "runs"}` : "Pick two or more"}>
        {!agents ? (
          <div className="flex flex-col gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-2/60" />
            ))}
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-hairline overflow-hidden rounded-xl bg-surface shadow-raised">
            {agents.map((a) => {
              const s = sel[a.id] ?? { on: false, models: [{ model: "", custom: "" }] };
              const setPick = (i: number, p: Partial<ModelPick>) => setSel({ ...sel, [a.id]: { ...s, models: s.models.map((m, j) => (j === i ? { ...m, ...p } : m)) } });
              const ready = readiness(a);
              const disabled = !ready.ready;
              return (
                <li key={a.id} className="flex min-h-14 flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5">
                  <Checkbox
                    id={`agent-${a.id}`}
                    checked={s.on}
                    disabled={disabled}
                    onCheckedChange={(v) => setSel({ ...sel, [a.id]: { ...s, on: Boolean(v) } })}
                    aria-label={`Run ${a.name}`}
                  />
                  <label htmlFor={`agent-${a.id}`} className="flex min-w-0 flex-1 items-center gap-2.5">
                    <AgentMark color={agentColor(a.id)} />
                    <span className="truncate text-sm font-medium">{a.name}</span>
                    <span className="hidden truncate text-xs text-faint sm:inline">{a.vendor}</span>
                    {a.devOnly && <span className="shrink-0 rounded bg-warning/15 px-1.5 py-0.5 text-[11px] text-warning">Dev fixture, not an AI</span>}
                  </label>
                  {ready.ready && ready.note && <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">{ready.note}</span>}
                  {!ready.ready && (
                    <Link href={`/settings#agent-${a.id}`} className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "shrink-0")} aria-label={`Set up ${a.name}`}>
                      Set up
                    </Link>
                  )}
                  {!ready.ready && <SetupHint r={ready} className="basis-full pl-12 text-xs leading-5" />}
                  {ready.ready && a.models.length > 0 && (
                    <div className="flex shrink-0 flex-col items-end gap-1.5 max-sm:basis-full max-sm:items-start max-sm:pl-12">
                      {s.models.map((p, i) => (
                        <div key={i} className="flex items-center gap-2">
                          {p.model === CUSTOM && (
                            <Input
                              value={p.custom}
                              onChange={(e) => setPick(i, { custom: e.target.value })}
                              placeholder="model id"
                              aria-label={`${a.name} custom model id`}
                              className="h-7 w-32 text-xs"
                            />
                          )}
                          {a.models.length > SEARCH_AT ? (
                            <SearchSelect
                              value={p.model}
                              onValueChange={(v) => setPick(i, { model: v })}
                              options={[...a.models.map((m) => ({ value: m.id, label: m.label })), ...(a.capabilities.modelSelection ? [{ value: CUSTOM, label: "Custom model" }] : [])]}
                              disabled={!a.capabilities.modelSelection}
                              className="w-40"
                              aria-label={`${a.name} model ${i + 1}`}
                              searchLabel="Search models"
                              emptyText="No matching models"
                            />
                          ) : (
                            <Select
                              value={p.model}
                              onValueChange={(v) => setPick(i, { model: String(v) })}
                              items={[...a.models.map((m) => ({ value: m.id, label: m.label })), ...(a.capabilities.modelSelection ? [{ value: CUSTOM, label: "Custom model" }] : [])]}
                              disabled={!a.capabilities.modelSelection}
                            >
                              <SelectTrigger size="sm" className="w-40" aria-label={`${a.name} model ${i + 1}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {a.models.map((m) => (
                                  <SelectItem key={m.id || "default"} value={m.id}>
                                    {m.label}
                                  </SelectItem>
                                ))}
                                {a.capabilities.modelSelection && <SelectItem value={CUSTOM}>Custom model</SelectItem>}
                              </SelectContent>
                            </Select>
                          )}
                          {s.models.length > 1 ? (
                            <button
                              type="button"
                              aria-label={`Remove ${a.name} model ${i + 1}`}
                              onClick={() => setSel({ ...sel, [a.id]: { ...s, models: s.models.filter((_, j) => j !== i) } })}
                              className="grid size-7 place-items-center text-faint [@media(hover:hover)]:hover:text-foreground"
                            >
                              <X className="size-3.5" />
                            </button>
                          ) : (
                            a.capabilities.modelSelection && (
                              <button
                                type="button"
                                aria-label={`Compare another ${a.name} model`}
                                title="Run this agent again with another model"
                                onClick={() => setSel({ ...sel, [a.id]: { on: true, models: [...s.models, { model: a.models[1]?.id ?? CUSTOM, custom: "" }] } })}
                                className="grid size-7 place-items-center text-faint [@media(hover:hover)]:hover:text-foreground"
                              >
                                <Plus className="size-3.5" />
                              </button>
                            )
                          )}
                        </div>
                      ))}
                      {s.models.length > 1 && s.models.length < 4 && (
                        <button
                          type="button"
                          onClick={() => setSel({ ...sel, [a.id]: { ...s, models: [...s.models, { model: CUSTOM, custom: "" }] } })}
                          className="flex h-7 items-center gap-1 text-xs text-faint [@media(hover:hover)]:hover:text-foreground"
                        >
                          <Plus className="size-3" /> Another model
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
        {devinSelected && (
          <div className="mt-3 rounded-xl bg-surface p-4 shadow-raised">
            <label htmlFor="devin-repo" className="text-sm font-medium">
              Devin repository <span className="font-normal text-faint">(optional)</span>
            </label>
            <p className="mt-1 text-xs text-muted-foreground">
              Devin works in its own cloud machine and cannot see the local snapshot. Name a repository connected to your Devin org, or leave empty to start from nothing.
            </p>
            <Input id="devin-repo" value={devinRepo} onChange={(e) => setDevinRepo(e.target.value)} placeholder="owner/repo" className="mt-2 h-8 max-w-xs" />
          </div>
        )}
      </Section>

      {/* Starting point */}
      <Section title="Design context" hint={designContext.enabled ? `${designContext.ids.length} selected` : "Off"}>
        <DesignContextPicker value={designContext} onChange={setDesignContext} />
      </Section>

      <Section title="Starting point">
        <div className="rounded-xl bg-surface p-4 shadow-raised">
          <div className="flex gap-1 rounded-lg bg-surface-2 p-1" role="radiogroup" aria-label="Starting point">
            {(
              [
                { id: "empty", label: "Empty project" },
                { id: "local-repo", label: "Local repository" },
              ] as const
            ).map((o) => (
              <button
                key={o.id}
                role="radio"
                aria-checked={sourceKind === o.id}
                onClick={() => setSourceKind(o.id)}
                className={cn(
                  "h-8 flex-1 rounded-md text-sm text-muted-foreground transition-colors",
                  sourceKind === o.id && "bg-background text-foreground shadow-raised",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
          {sourceKind === "empty" ? (
            <p className="mt-3 text-xs text-muted-foreground">Every agent starts in a fresh git repository with only a .gitignore.</p>
          ) : (
            <div className="mt-3">
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <FolderGit2 className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-faint" strokeWidth={1.75} />
                  <Input
                    value={repoPath}
                    onChange={(e) => (setRepoPath(e.target.value), setRepo(undefined))}
                    onBlur={inspect}
                    onKeyDown={(e) => e.key === "Enter" && inspect()}
                    placeholder="~/code/my-app"
                    aria-label="Repository folder"
                    className="h-9 pl-8 font-mono text-[13px]"
                  />
                </div>
                <Button variant="secondary" className="h-9" onClick={inspect}>
                  Check
                </Button>
              </div>
              {repoError && <p className="mt-2 text-xs text-danger">{repoError}</p>}
              {repo && (
                <div className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
                  <span className="text-faint">Commit</span>
                  <span className="min-w-0 truncate font-mono">
                    {repo.commit.slice(0, 10)} {repo.subject && <span className="font-sans text-muted-foreground">{repo.subject}</span>}
                  </span>
                  {repo.branch && (
                    <>
                      <span className="text-faint">Branch</span>
                      <span className="font-mono">{repo.branch}</span>
                    </>
                  )}
                  {repo.dirty && (
                    <>
                      <span className="text-warning">Note</span>
                      <span className="text-warning">Uncommitted changes will not be included. Agents start from the last commit.</span>
                    </>
                  )}
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">The repository is only read. Each agent gets its own clone with no remote.</p>
            </div>
          )}
        </div>
      </Section>

      {/* Limits */}
      <Section title="Execution and limits">
        <div className="grid gap-px overflow-hidden rounded-xl bg-hairline shadow-raised sm:grid-cols-2">
          <Field label="Run in parallel" hint="All agents start together.">
            <Switch checked={parallel} onCheckedChange={setParallel} aria-label="Run in parallel" />
          </Field>
          <Field label="Time limit per agent" hint="Enforced for every agent.">
            <NumberInput value={String(timeoutMinutes)} onChange={(v) => setTimeoutMinutes(Math.min(240, Math.max(1, Math.floor(Number(v) || 1))))} suffix="min" label="Time limit in minutes" />
          </Field>
          <Field label="Budget cap per agent" hint="Only agents that support a cap enforce it.">
            <NumberInput value={budget} onChange={setBudget} prefix="$" label="Budget cap in dollars" placeholder="none" />
          </Field>
          <Field label="Max turns" hint="Claude Code only.">
            <NumberInput value={maxTurns} onChange={setMaxTurns} label="Max turns" placeholder="none" />
          </Field>
          <Field label="Evaluate results" hint="Install, build, test, screenshot and audit each result.">
            <Switch checked={evalEnabled} onCheckedChange={setEvalEnabled} aria-label="Evaluate results" />
          </Field>
          <Field label="Run generated code in" hint={runner === "docker" ? "Throwaway container per step." : "macOS sandbox: no access to your home folder."}>
            <Select
              value={runner}
              onValueChange={(v) => setRunner(v as "docker" | "host-sandbox")}
              disabled={!evalEnabled}
              items={[
                { value: "docker", label: "Docker" },
                { value: "host-sandbox", label: "macOS sandbox" },
              ]}
            >
              <SelectTrigger size="sm" className="w-40" aria-label="Sandbox runner">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="docker" disabled={!system?.runners.docker}>
                  Docker{system && !system.runners.docker ? " (not running)" : ""}
                </SelectItem>
                <SelectItem value="host-sandbox" disabled={system ? !system.runners["host-sandbox"] : false}>
                  macOS sandbox
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <BudgetSummary chosen={chosen} budget={budgetNum} timeoutMinutes={timeoutMinutes} system={system} parallel={parallel} />
        <div className="mt-3">
          <button
            onClick={() => setShowConstraints(!showConstraints)}
            className="flex h-8 items-center gap-1.5 text-xs text-muted-foreground [@media(hover:hover)]:hover:text-foreground"
            aria-expanded={showConstraints}
          >
            <SwapChevron open={showConstraints} />
            Shared constraints added to every brief
          </button>
          {showConstraints && (
            <Textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} className="mt-2 min-h-32 font-mono text-xs" aria-label="Shared constraints" />
          )}
        </div>
      </Section>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start {chosen.length} {chosen.length === 1 ? "agent" : "agents"}?</DialogTitle>
            <DialogDescription>
              {billable.length ? "These runs use your own accounts and may be billed by each provider." : "Development fixtures only. Nothing is billed."}
            </DialogDescription>
          </DialogHeader>
          <ul className="flex flex-col gap-2 text-sm">
            {chosen.map((c, i) => (
              <li key={`${c.agent.id}-${i}`} className="flex min-w-0 items-center gap-2.5">
                <AgentMark color={agentColor(c.agent.id)} />
                <span className="truncate">{c.agent.name}</span>
                <span className="truncate text-xs text-faint">{c.model ?? "default model"}</span>
                <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                  {c.agent.devOnly
                    ? "Free"
                    : c.agent.capabilities.budgetCap && budgetNum
                      ? `Capped at ${usd(budgetNum)}`
                      : c.agent.kind === "cloud-api"
                        ? "Uses plan credits"
                        : `Up to ${timeoutMinutes} min, no cost cap`}
                </span>
              </li>
            ))}
          </ul>
          {billable.length > 0 && (
            <label className="flex items-start gap-2.5 rounded-lg bg-surface-2 p-3 text-xs text-muted-foreground">
              <Checkbox checked={acknowledged} onCheckedChange={(v) => setAcknowledged(Boolean(v))} className="mt-0.5" />
              I understand these agents run with my credentials and may cost money.
            </label>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!acknowledged || submitting} onClick={submit}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Start
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-12">
      <div className="mb-3 flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-medium">{title}</h2>
        {hint && <span className="text-xs text-faint">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-16 min-w-0 items-center justify-between gap-4 bg-surface px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm">{label}</p>
        <p className="text-xs text-faint">{hint}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function NumberInput({ value, onChange, prefix, suffix, label, placeholder }: { value: string; onChange: (v: string) => void; prefix?: string; suffix?: string; label: string; placeholder?: string }) {
  return (
    <div className="flex h-8 w-28 items-center rounded-lg border border-input bg-input/30 px-2.5 text-sm focus-within:border-ring">
      {prefix && <span className="mr-1 text-faint">{prefix}</span>}
      <input
        inputMode="decimal"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
        aria-label={label}
        className="w-full min-w-0 bg-transparent text-right outline-none tnum placeholder:text-faint"
      />
      {suffix && <span className="ml-1 text-faint">{suffix}</span>}
    </div>
  );
}

/** Limits and real past spend. No forecasts: the arena only shows numbers it has seen. */
function BudgetSummary({
  chosen,
  budget,
  timeoutMinutes,
  system,
  parallel,
}: {
  chosen: { agent: AgentWithStatus; model?: string }[];
  budget?: number;
  timeoutMinutes: number;
  system?: SystemInfo;
  parallel: boolean;
}) {
  if (!chosen.length) return null;
  const capped = chosen.filter((c) => c.agent.capabilities.budgetCap && budget);
  const uncapped = chosen.filter((c) => !c.agent.devOnly && !(c.agent.capabilities.budgetCap && budget));
  const wall = parallel ? timeoutMinutes : timeoutMinutes * chosen.length;
  const names = (list: typeof chosen) => [...new Set(list.map((c) => c.agent.name))].join(", ");
  const uniqueAgents = [...new Map(chosen.map((c) => [c.agent.id, c.agent])).values()];
  return (
    <div className="mt-3 rounded-xl bg-surface p-4 text-xs shadow-raised">
      <p className="mb-3 text-sm font-medium">Budget and limits</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2">
        <dt className="text-faint">Longest possible run</dt>
        <dd className="tnum">{wall} min</dd>
        <dt className="text-faint">Hard dollar cap</dt>
        <dd className="tnum">
          {capped.length && budget ? `${usd(budget * capped.length)} across ${capped.length} capped ${capped.length === 1 ? "run" : "runs"} (${names(capped)})` : "None"}
        </dd>
        {uncapped.length > 0 && (
          <>
            <dt className="text-faint">Not cost-capped</dt>
            <dd>{names(uncapped)} (time limit only)</dd>
          </>
        )}
        {uniqueAgents.map((agent) => {
          const h = system?.history[agent.id];
          if (!h || !h.runs) return null;
          return (
            <FragmentRow
              key={agent.id}
              label={`${agent.name} history`}
              value={`${h.runs} past ${h.runs === 1 ? "run" : "runs"}, ${duration(h.avgDurationMs)} average${h.withCost ? `, ${usd(h.avgCostUsd)} average reported cost` : ", no cost reported"}`}
            />
          );
        })}
      </dl>
      <p className="mt-3 text-faint">No estimate is shown for agents without history. Costs are only ever what an agent reported.</p>
    </div>
  );
}

function FragmentRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-faint">{label}</dt>
      <dd className="tnum">{value}</dd>
    </>
  );
}
