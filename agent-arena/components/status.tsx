import { cn } from "@/lib/utils";

const RUN_TONE: Record<string, { label: string; tone: string; pulse?: boolean }> = {
  queued: { label: "Queued", tone: "bg-faint" },
  preparing: { label: "Preparing", tone: "bg-info", pulse: true },
  running: { label: "Running", tone: "bg-warning", pulse: true },
  evaluating: { label: "Evaluating", tone: "bg-info", pulse: true },
  succeeded: { label: "Finished", tone: "bg-success" },
  done: { label: "Done", tone: "bg-success" },
  failed: { label: "Failed", tone: "bg-danger" },
  timed_out: { label: "Timed out", tone: "bg-danger" },
  cancelled: { label: "Cancelled", tone: "bg-faint" },
  interrupted: { label: "Interrupted", tone: "bg-faint" },
  awaiting_import: { label: "Needs import", tone: "bg-warning" },
  skipped: { label: "Skipped", tone: "bg-faint" },
};

export function statusLabel(status: string) {
  return RUN_TONE[status]?.label ?? status;
}

export function StatusDot({ status, className }: { status: string; className?: string }) {
  const s = RUN_TONE[status] ?? { tone: "bg-faint" };
  return (
    <span className={cn("relative inline-flex size-2 shrink-0", className)} aria-hidden>
      {s.pulse && <span className={cn("absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping", s.tone)} />}
      <span className={cn("relative inline-flex size-2 rounded-full", s.tone)} />
    </span>
  );
}

export function StatusPill({ status, className }: { status: string; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 shrink-0 items-center gap-1.5 rounded-full bg-surface-2 px-2.5 text-xs whitespace-nowrap text-muted-foreground", className)}>
      <StatusDot status={status} />
      {statusLabel(status)}
    </span>
  );
}

/** Marks where a number came from, so opinions never pass as measurements. */
export function SourceTag({ source }: { source: "measured" | "reported" | "manual" | "llm" }) {
  const map = {
    measured: { label: "Measured", cls: "text-muted-foreground" },
    reported: { label: "Agent-reported", cls: "text-info" },
    manual: { label: "Your rating", cls: "text-warning" },
    llm: { label: "LLM opinion", cls: "text-agent-3" },
  } as const;
  const m = map[source];
  return <span className={cn("text-[11px] font-medium whitespace-nowrap", m.cls)}>{m.label}</span>;
}

export function AgentMark({ color, className }: { color: string; className?: string }) {
  return <span className={cn("inline-block size-2.5 shrink-0 rounded-[3px]", className)} style={{ background: color }} aria-hidden />;
}
