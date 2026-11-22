import type { AgentWithStatus } from "@/lib/client/types";

export type Readiness =
  | { ready: true; note?: string }
  | {
      ready: false;
      /** What is missing, in a few words. */
      missing: string;
      /** The command that fixes it, when there is one. */
      command?: string;
      /** The rest of the fix, in plain words. */
      fix?: string;
    };

/**
 * One reading of an agent's setup state, shared by the composer and the Agents page,
 * so "not set up" always names what is missing and how to fix it, in the same words.
 * Built only from the adapter's own setup steps and env list; nothing is guessed.
 */
export function readiness(a: AgentWithStatus): Readiness {
  const s = a.status;
  const env = a.credentialEnv;
  if (!s.installed) {
    const install = a.setup.find((x) => x.command) ?? a.setup[0];
    return { ready: false, missing: "Not installed", command: install?.command, fix: install?.command ? undefined : install?.label };
  }
  if (s.auth === "missing") {
    const signIn = a.setup.find((x, i) => i > 0 && x.command && !/^check/i.test(x.label));
    if (signIn?.command) {
      return {
        ready: false,
        missing: s.authDetail ?? "Not signed in",
        command: signIn.command,
        fix: env[0] ? `or add ${env[0]} to .env.local and restart the app` : undefined,
      };
    }
    return {
      ready: false,
      missing: "Not connected",
      fix: env.length ? `Add ${env.join(" and ")} to .env.local, then restart the app` : s.authDetail,
    };
  }
  if (a.automation !== "full") return { ready: true, note: "Partial automation" };
  if (s.auth === "unknown") return { ready: true, note: "Sign-in not checked" };
  return { ready: true };
}

/** The fix as one line: what is missing, then what to run or add. */
export function SetupHint({ r, className }: { r: Extract<Readiness, { ready: false }>; className?: string }) {
  return (
    <p className={className}>
      <span className="text-warning">{r.missing}.</span>{" "}
      {r.command && (
        <>
          <span className="text-muted-foreground">Run </span>
          <code className="rounded bg-surface-2 px-1 py-px font-mono text-[11.5px] text-foreground">{r.command}</code>
          {r.fix ? <span className="text-muted-foreground">, {r.fix}.</span> : <span className="text-muted-foreground">.</span>}
        </>
      )}
      {!r.command && r.fix && <span className="text-muted-foreground">{r.fix}.</span>}
    </p>
  );
}
