import fs from "node:fs";
import path from "node:path";
import { artifacts, metrics, runs, type AgentRun } from "@/lib/storage/repo";
import { artifactDir, toDataRel } from "@/lib/storage/paths";
import { publish } from "@/lib/orchestration/bus";
import { execIn, runnerAvailability, type ExecRunner } from "@/lib/sandbox/exec";
import { startPreview, stopPreview } from "@/lib/sandbox/preview";
import { git } from "@/lib/sandbox/workspace";
import { inspect } from "./browser";
import { addedDependencies, codeSignals, countTsErrors, installCommand, parseTestCounts, readProject, runScript } from "./project";

const STEP_TIMEOUT = 10 * 60_000;

async function step(run: AgentRun, name: string, status: "running" | "pass" | "fail" | "skip", detail?: string) {
  await publish(run.experimentId, run.id, "eval", { step: name, status, detail });
}

function tail(s: string, lines = 40) {
  return s.trim().split("\n").slice(-lines).join("\n");
}

/** Write usage the agent reported into metrics, verbatim. */
async function recordReported(run: AgentRun) {
  const u = run.usage;
  await metrics.set({ agentRunId: run.id, key: "retries", valueNum: run.retries, source: "measured" });
  if (run.durationMs !== undefined) await metrics.set({ agentRunId: run.id, key: "duration_ms", valueNum: run.durationMs, source: "measured" });
  if (!u) return;
  if (u.inputTokens !== undefined) await metrics.set({ agentRunId: run.id, key: "input_tokens", valueNum: u.inputTokens, source: "reported" });
  if (u.outputTokens !== undefined) await metrics.set({ agentRunId: run.id, key: "output_tokens", valueNum: u.outputTokens, source: "reported" });
  if (u.costUsd !== undefined) await metrics.set({ agentRunId: run.id, key: "cost_usd", valueNum: u.costUsd, source: "reported" });
  if (u.other?.acus !== undefined) await metrics.set({ agentRunId: run.id, key: "acus", valueNum: u.other.acus, source: "reported" });
}

/**
 * Objective checks on one agent's frozen result. Every command runs inside the
 * chosen sandbox runner. Nothing here assigns a score; it only records what
 * happened, and anything it could not measure is left missing, not zero.
 */
export async function evaluateRun(runId: string, runner: ExecRunner | "off", signal: AbortSignal) {
  const run = await runs.get(runId);
  if (!run?.workspaceDir) return;
  await recordReported(run);
  if (runner === "off") {
    await runs.update(runId, { evalStatus: "skipped" });
    return;
  }
  const avail = await runnerAvailability();
  if (!avail[runner]) {
    await runs.update(runId, { evalStatus: "skipped" });
    await step(run, "runner", "skip", runner === "docker" ? "Docker is not running. Start Docker Desktop or pick the macOS sandbox runner." : "sandbox-exec is not available on this machine.");
    await publish(run.experimentId, run.id, "run", { evalStatus: "skipped" });
    return;
  }

  await runs.update(runId, { evalStatus: "running" });
  await publish(run.experimentId, run.id, "run", { evalStatus: "running" });
  const ws = run.workspaceDir;
  const outDir = artifactDir(run.experimentId, run.id);
  const report: Record<string, unknown> = { runner, startedAt: new Date().toISOString(), steps: [] as unknown[] };
  const steps = report.steps as { name: string; ok?: boolean; exitCode?: number | null; durationMs?: number; output?: string; skipped?: string }[];
  const set = (key: string, valueNum: number, detail?: string) => metrics.set({ agentRunId: run.id, key, valueNum, source: "measured", detail });
  await metrics.clear(run.id, "measured");
  await recordReported(run);

  // Diff-based numbers survive a fresh evaluation.
  const diffArt = (await artifacts.forRun(run.id)).find((a) => a.kind === "diff");
  const numstat = (diffArt?.meta.numstat as { file: string; added: number; removed: number }[]) ?? [];
  await set("files_changed", numstat.length);
  await set("lines_added", numstat.reduce((s, n) => s + n.added, 0));
  await set("lines_removed", numstat.reduce((s, n) => s + n.removed, 0));

  try {
    const info = readProject(ws);

    // Static signals: no execution.
    const changed = numstat.map((n) => n.file);
    const sig = codeSignals(ws, changed);
    await set("any_count", sig.anyCount);
    await set("test_files", sig.testFiles);
    await set("console_logs", sig.consoleLogs);
    if (sig.sourceFiles) await set("largest_file", sig.largestFile);
    let baseDeps: Record<string, string> = {};
    if (run.baseCommit) {
      const basePkg = await git(ws, ["show", `${run.baseCommit}:package.json`], { allowFail: true });
      try {
        const p = JSON.parse(basePkg || "{}");
        baseDeps = { ...(p.dependencies ?? {}), ...(p.devDependencies ?? {}) };
      } catch {
        /* no base package.json */
      }
    }
    if (info.hasPackageJson) await set("deps_added", addedDependencies(baseDeps, info.deps).length, addedDependencies(baseDeps, info.deps).join(", "));

    const exec = async (name: string, command: string, timeoutMs = STEP_TIMEOUT) => {
      await step(run, name, "running", command);
      const res = await execIn(runner, { workspace: ws, command, timeoutMs, signal });
      const ok = res.exitCode === 0 && !res.timedOut;
      const output = tail(`${res.stdout}\n${res.stderr}`, 80);
      steps.push({ name, ok, exitCode: res.exitCode, durationMs: res.durationMs, output });
      await step(run, name, ok ? "pass" : "fail", res.timedOut ? "Timed out" : tail(output, 6));
      return { ok, res, output: `${res.stdout}\n${res.stderr}` };
    };

    let installed = false;
    if (info.hasPackageJson && !signal.aborted) {
      const r = await exec("install", installCommand(info.pm));
      installed = r.ok;
      await set("install_ok", r.ok ? 1 : 0);
    } else {
      steps.push({ name: "install", skipped: "No package.json" });
      await step(run, "install", "skip", "No package.json");
    }

    if (installed && info.hasTsconfig && !signal.aborted) {
      const r = await exec("typecheck", "npx --no-install tsc --noEmit -p .");
      // Only record a count when tsc actually ran: a clean exit, or real TS errors.
      if (r.ok || /error TS\d+/.test(r.output)) await set("type_errors", countTsErrors(r.output));
    }

    if (installed && info.scripts.lint && !signal.aborted) {
      const r = await exec("lint", runScript(info.pm, "lint"));
      await set("lint_ok", r.ok ? 1 : 0);
    }

    if (installed && info.scripts.build && !signal.aborted) {
      const r = await exec("build", runScript(info.pm, "build"));
      await set("build_ok", r.ok ? 1 : 0);
    } else if (info.hasPackageJson && !info.scripts.build) {
      await step(run, "build", "skip", "No build script");
    }

    if (installed && info.scripts.test && !signal.aborted) {
      const r = await exec("test", runScript(info.pm, "test"));
      const counts = parseTestCounts(r.output);
      if (counts) {
        if (counts.passed !== undefined) await set("tests_passed", counts.passed);
        if (counts.failed !== undefined) await set("tests_failed", counts.failed);
        const total = (counts.passed ?? 0) + (counts.failed ?? 0);
        if (total > 0) await set("test_pass_rate", (counts.passed ?? 0) / total);
      } else {
        // We know whether it passed, but not the counts. Say exactly that.
        await metrics.set({ agentRunId: run.id, key: "tests_failed", valueNum: r.ok ? 0 : 1, source: "measured", detail: "Counts not parsed; value reflects exit code only" });
      }
      fs.writeFileSync(path.join(outDir, "test-output.txt"), tail(r.output, 400));
    } else {
      await step(run, "test", "skip", info.scripts.test ? "Install failed" : "No test script");
    }

    // Preview and browser inspection.
    const canServe = info.serve && (info.serve.kind === "static" || installed);
    if (canServe && !signal.aborted) {
      await step(run, "preview", "running", info.serve!.kind === "static" ? `static ${info.serve!.kind === "static" ? info.serve!.root : ""}` : info.serve!.kind);
      try {
        const p = await startPreview(run.id, ws, runner, { timeoutMs: 150_000 });
        await set("preview_ok", 1, p.note);
        await step(run, "preview", "pass", p.note ? `${p.url} (${p.note})` : p.url);
        if (p.note) report.previewNote = p.note;
        await step(run, "browser", "running", "Playwright at 1440×900 and 390×844");
        const shots = await inspect(p.url, path.join(outDir, "screens"));
        await artifacts.clearKind(run.id, "screenshot");
        let runtimeErrors = 0;
        let failedReq = 0;
        let serious = 0;
        for (const s of shots) {
          runtimeErrors += s.consoleErrors.length + s.pageErrors.length;
          failedReq += s.failedRequests.length;
          serious += (s.a11y?.critical ?? 0) + (s.a11y?.serious ?? 0);
          await artifacts.add({ agentRunId: run.id, kind: "screenshot", label: s.viewport, path: toDataRel(s.screenshot), meta: { viewport: s.viewport, full: toDataRel(s.fullPage) } });
          if (s.viewport === "desktop") {
            if (s.a11y) await set("a11y_violations", s.a11y.violations);
            await set("load_ms", s.loadMs);
          }
          if (s.viewport === "mobile") await set("mobile_overflow", s.horizontalOverflow ? 1 : 0);
        }
        await set("runtime_errors", runtimeErrors);
        await set("failed_requests", failedReq);
        if (shots.some((s) => s.a11y)) await set("a11y_serious", serious);
        report.browser = shots.map((s) => ({ ...s, screenshot: toDataRel(s.screenshot), fullPage: toDataRel(s.fullPage) }));
        await step(run, "browser", "pass", `${runtimeErrors} runtime errors, ${serious} serious a11y issues`);
      } catch (e) {
        await set("preview_ok", 0, (e as Error).message.slice(0, 500));
        steps.push({ name: "preview", ok: false, output: (e as Error).message });
        await step(run, "preview", "fail", (e as Error).message.slice(0, 400));
      } finally {
        await stopPreview(run.id);
      }
    } else {
      await step(run, "preview", "skip", info.serve ? "Install failed" : "Nothing to serve");
    }

    report.finishedAt = new Date().toISOString();
    const reportFile = path.join(outDir, "evaluation.json");
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    await artifacts.clearKind(run.id, "report");
    await artifacts.add({ agentRunId: run.id, kind: "report", label: "Evaluation report", path: toDataRel(reportFile), meta: {} });
    await runs.update(runId, { evalStatus: signal.aborted ? "skipped" : "done" });
    await publish(run.experimentId, run.id, "run", { evalStatus: signal.aborted ? "skipped" : "done" });
  } catch (e) {
    await runs.update(runId, { evalStatus: "failed" });
    await step(run, "evaluation", "fail", (e as Error).message);
    await publish(run.experimentId, run.id, "run", { evalStatus: "failed" });
  }
}
