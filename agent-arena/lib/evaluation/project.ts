import fs from "node:fs";
import path from "node:path";

export interface ProjectInfo {
  hasPackageJson: boolean;
  pm: "pnpm" | "npm" | "yarn" | "bun";
  scripts: Record<string, string>;
  deps: Record<string, string>;
  hasTsconfig: boolean;
  /** The command that serves the app, if any. */
  serve?: { kind: "script"; script: "dev" | "start" | "preview"; command: (port: number, host: string) => string } | { kind: "static"; root: string };
  /** Static output folders to try after a build. */
  staticCandidates: string[];
}

const NO_TEST = /no test specified/i;

export function readProject(ws: string): ProjectInfo {
  const pkgPath = path.join(ws, "package.json");
  let pkg: { scripts?: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string> } = {};
  const hasPackageJson = fs.existsSync(pkgPath);
  if (hasPackageJson) {
    try {
      pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    } catch {
      pkg = {};
    }
  }
  const scripts = pkg.scripts ?? {};
  if (scripts.test && NO_TEST.test(scripts.test)) delete scripts.test;
  const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };
  const pm: ProjectInfo["pm"] = fs.existsSync(path.join(ws, "pnpm-lock.yaml"))
    ? "pnpm"
    : fs.existsSync(path.join(ws, "yarn.lock"))
      ? "yarn"
      : fs.existsSync(path.join(ws, "bun.lockb")) || fs.existsSync(path.join(ws, "bun.lock"))
        ? "bun"
        : "npm";

  const staticCandidates = ["dist", "build", "out", "public", "."].filter((d) => fs.existsSync(path.join(ws, d, "index.html")));

  let serve: ProjectInfo["serve"];
  const pick = (["dev", "start", "preview"] as const).find((s) => scripts[s]);
  if (pick) {
    const script = scripts[pick];
    serve = {
      kind: "script",
      script: pick,
      command: (port, host) => {
        const run = `${pm === "npm" ? "npm run" : `${pm} run`} ${pick}`;
        if (/\bnext\b/.test(script)) return `${run} -- -p ${port} -H ${host}`;
        if (/\bvite\b|\bastro\b/.test(script)) return `${run} -- --port ${port} --host ${host} --strictPort`;
        return run;
      },
    };
  } else if (staticCandidates.length) {
    serve = { kind: "static", root: staticCandidates[0] };
  }
  return { hasPackageJson, pm, scripts, deps, hasTsconfig: fs.existsSync(path.join(ws, "tsconfig.json")), serve, staticCandidates };
}

export function installCommand(pm: ProjectInfo["pm"]) {
  switch (pm) {
    case "pnpm":
      return "pnpm install --no-frozen-lockfile";
    case "yarn":
      return "yarn install";
    case "bun":
      return "bun install";
    default:
      return "npm install --no-audit --no-fund";
  }
}

export function runScript(pm: ProjectInfo["pm"], script: string) {
  return pm === "npm" ? `npm run ${script}` : `${pm} run ${script}`;
}

/** Parse pass/fail counts from common test runners. Returns undefined when nothing matches. */
export function parseTestCounts(output: string): { passed?: number; failed?: number } | undefined {
  const text = output.replace(/\x1b\[[0-9;]*m/g, "");
  // Vitest: "Tests  3 failed | 12 passed (15)"
  const vitest = text.match(/Tests\s+(?:(\d+)\s+failed\s*\|\s*)?(\d+)\s+passed/);
  if (vitest) return { failed: Number(vitest[1] ?? 0), passed: Number(vitest[2]) };
  // Jest: "Tests:       1 failed, 2 passed, 3 total"
  const jest = text.match(/Tests:\s+(?:(\d+)\s+failed,\s*)?(?:\d+\s+\w+,\s*)*?(\d+)\s+passed/);
  if (jest) return { failed: Number(jest[1] ?? 0), passed: Number(jest[2]) };
  // node:test TAP: "# pass 2" and "# fail 0"
  const np = text.match(/^#\s*pass\s+(\d+)/m);
  const nf = text.match(/^#\s*fail\s+(\d+)/m);
  if (np || nf) return { passed: Number(np?.[1] ?? 0), failed: Number(nf?.[1] ?? 0) };
  // node:test spec reporter: "ℹ pass 2"
  const sp = text.match(/ℹ\s*pass\s+(\d+)/);
  const sf = text.match(/ℹ\s*fail\s+(\d+)/);
  if (sp || sf) return { passed: Number(sp?.[1] ?? 0), failed: Number(sf?.[1] ?? 0) };
  // Playwright / mocha: "12 passed", "2 failed" / "12 passing", "2 failing"
  const pp = text.match(/(\d+)\s+(?:passed|passing)\b/);
  const pf = text.match(/(\d+)\s+(?:failed|failing)\b/);
  if (pp || pf) return { passed: Number(pp?.[1] ?? 0), failed: Number(pf?.[1] ?? 0) };
  return undefined;
}

/** Count TypeScript errors in tsc output. */
export function countTsErrors(output: string) {
  return (output.match(/error TS\d+/g) ?? []).length;
}

/** Static code signals on the changed files only. No execution. */
export function codeSignals(ws: string, changedFiles: string[]) {
  let anyCount = 0;
  let tsFiles = 0;
  let testFiles = 0;
  let consoleLogs = 0;
  let sourceFiles = 0;
  let largestFile = 0;
  for (const rel of changedFiles) {
    if (/(^|\/)(node_modules|\.next|dist|build)\//.test(rel) || /lock(\.json|\.yaml|b)?$/.test(rel)) continue;
    const abs = path.join(ws, rel);
    if (!fs.existsSync(abs) || fs.statSync(abs).isDirectory()) continue;
    if (/\.(test|spec)\.[cm]?[jt]sx?$/.test(rel) || /(^|\/)__tests__\//.test(rel) || /(^|\/)tests?\//.test(rel)) testFiles++;
    if (!/\.[cm]?[jt]sx?$|\.vue$|\.svelte$/.test(rel)) continue;
    sourceFiles++;
    const text = fs.readFileSync(abs, "utf8");
    largestFile = Math.max(largestFile, text.split("\n").length);
    if (/\.tsx?$/.test(rel)) {
      tsFiles++;
      anyCount += (text.match(/:\s*any\b|as\s+any\b|<any>/g) ?? []).length;
    }
    consoleLogs += (text.match(/console\.log\(/g) ?? []).length;
  }
  return { anyCount, tsFiles, testFiles, consoleLogs, sourceFiles, largestFile };
}

export function addedDependencies(before: Record<string, string>, after: Record<string, string>) {
  return Object.keys(after).filter((k) => !(k in before));
}
