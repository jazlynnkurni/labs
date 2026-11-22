/**
 * Every metric the dashboard can show, with where it comes from. Shared by the
 * server and the browser, so it imports nothing from Node.
 *
 * source:
 *  - measured: computed by the arena from files, commands or a browser. Objective.
 *  - reported: the agent said so. Shown verbatim, never estimated.
 *  - manual / llm: opinions. Always labelled as such.
 */
export type Dimension = "design" | "engineering" | "functionality" | "efficiency";
export type Direction = "higher" | "lower" | "neutral";
export type Format = "count" | "bool" | "ms" | "usd" | "tokens" | "score" | "ratio";

export interface MetricDef {
  key: string;
  label: string;
  dimension: Dimension;
  direction: Direction;
  format: Format;
  source: "measured" | "reported";
  help: string;
}

export const METRICS: MetricDef[] = [
  // Functionality
  { key: "install_ok", label: "Install", dimension: "functionality", direction: "higher", format: "bool", source: "measured", help: "Dependencies installed without error." },
  { key: "build_ok", label: "Build", dimension: "functionality", direction: "higher", format: "bool", source: "measured", help: "The build script exited 0." },
  { key: "tests_passed", label: "Tests passed", dimension: "functionality", direction: "higher", format: "count", source: "measured", help: "Parsed from the test runner's output." },
  { key: "tests_failed", label: "Tests failed", dimension: "functionality", direction: "lower", format: "count", source: "measured", help: "Parsed from the test runner's output." },
  { key: "test_pass_rate", label: "Test pass rate", dimension: "functionality", direction: "higher", format: "ratio", source: "measured", help: "Passed divided by passed plus failed." },
  { key: "runtime_errors", label: "Runtime errors", dimension: "functionality", direction: "lower", format: "count", source: "measured", help: "Console errors and uncaught page errors across both viewports." },
  { key: "failed_requests", label: "Failed requests", dimension: "functionality", direction: "lower", format: "count", source: "measured", help: "Requests that failed or returned 4xx/5xx across both viewports." },
  { key: "a11y_violations", label: "A11y violations", dimension: "functionality", direction: "lower", format: "count", source: "measured", help: "axe-core rule violations on the desktop view." },
  { key: "a11y_serious", label: "A11y serious+", dimension: "functionality", direction: "lower", format: "count", source: "measured", help: "Critical and serious axe-core violations, desktop and mobile combined." },
  { key: "preview_ok", label: "Preview", dimension: "functionality", direction: "higher", format: "bool", source: "measured", help: "The app answered over HTTP." },
  // Engineering
  { key: "type_errors", label: "Type errors", dimension: "engineering", direction: "lower", format: "count", source: "measured", help: "tsc --noEmit errors, when the project has a tsconfig." },
  { key: "lint_ok", label: "Lint", dimension: "engineering", direction: "higher", format: "bool", source: "measured", help: "The lint script exited 0, when there is one." },
  { key: "any_count", label: "any usages", dimension: "engineering", direction: "lower", format: "count", source: "measured", help: "Explicit any in changed TypeScript files." },
  { key: "test_files", label: "Test files", dimension: "engineering", direction: "higher", format: "count", source: "measured", help: "Changed files that look like tests." },
  { key: "deps_added", label: "Deps added", dimension: "engineering", direction: "lower", format: "count", source: "measured", help: "New packages in package.json." },
  { key: "console_logs", label: "console.log", dimension: "engineering", direction: "lower", format: "count", source: "measured", help: "console.log calls left in changed source files." },
  { key: "largest_file", label: "Largest file", dimension: "engineering", direction: "lower", format: "count", source: "measured", help: "Lines in the longest changed source file." },
  { key: "files_changed", label: "Files changed", dimension: "engineering", direction: "neutral", format: "count", source: "measured", help: "Files in the diff." },
  { key: "lines_added", label: "Lines added", dimension: "engineering", direction: "neutral", format: "count", source: "measured", help: "From git diff --numstat." },
  { key: "lines_removed", label: "Lines removed", dimension: "engineering", direction: "neutral", format: "count", source: "measured", help: "From git diff --numstat." },
  // Design (objective parts only)
  { key: "mobile_overflow", label: "Mobile overflow", dimension: "design", direction: "lower", format: "bool", source: "measured", help: "The page scrolls sideways at 390px wide." },
  { key: "load_ms", label: "Load time", dimension: "design", direction: "lower", format: "ms", source: "measured", help: "Time to network idle on desktop, local server." },
  // Efficiency
  { key: "duration_ms", label: "Time", dimension: "efficiency", direction: "lower", format: "ms", source: "measured", help: "Wall-clock time from start to finish of the agent." },
  { key: "input_tokens", label: "Input tokens", dimension: "efficiency", direction: "lower", format: "tokens", source: "reported", help: "All prompt tokens the agent reported, cached reads and writes included." },
  { key: "output_tokens", label: "Output tokens", dimension: "efficiency", direction: "lower", format: "tokens", source: "reported", help: "As reported by the agent." },
  { key: "cost_usd", label: "Cost", dimension: "efficiency", direction: "lower", format: "usd", source: "reported", help: "Only when the agent reports it. Never estimated." },
  { key: "acus", label: "ACUs", dimension: "efficiency", direction: "lower", format: "count", source: "reported", help: "Devin compute units, as reported." },
  { key: "retries", label: "Retries", dimension: "efficiency", direction: "lower", format: "count", source: "measured", help: "Times the arena re-ran the agent." },
];

export const METRIC_BY_KEY = Object.fromEntries(METRICS.map((m) => [m.key, m])) as Record<string, MetricDef>;

/** Subjective design dimensions, rated by a person (or an LLM, labelled). */
export const RATING_DIMENSIONS = [
  { key: "visual_hierarchy", label: "Visual hierarchy" },
  { key: "typography", label: "Typography" },
  { key: "spacing", label: "Spacing and alignment" },
  { key: "consistency", label: "Component consistency" },
  { key: "responsive", label: "Responsive behaviour" },
  { key: "interaction", label: "Interaction design" },
  { key: "code_organization", label: "Code organisation" },
  { key: "maintainability", label: "Maintainability" },
  { key: "completeness", label: "Feature completeness" },
] as const;

export const DIMENSION_LABEL: Record<Dimension, string> = {
  design: "Design",
  engineering: "Engineering",
  functionality: "Functionality",
  efficiency: "Efficiency",
};

export function formatMetric(def: MetricDef | undefined, v: number | undefined): string {
  if (v === undefined || v === null || Number.isNaN(v)) return "n/a";
  switch (def?.format) {
    case "bool":
      // "Lower is better" booleans are problems (overflow present), not checks.
      if (def.direction === "lower") return v ? "Yes" : "No";
      return v ? "Pass" : "Fail";
    case "ms":
      return v >= 60_000 ? `${Math.floor(v / 60_000)}m ${Math.round((v % 60_000) / 1000)}s` : `${(v / 1000).toFixed(1)}s`;
    case "usd":
      return `$${v.toFixed(v < 1 ? 3 : 2)}`;
    case "tokens":
      return v >= 1000 ? `${(v / 1000).toFixed(v >= 100_000 ? 0 : 1)}k` : String(v);
    case "ratio":
      return `${Math.round(v * 100)}%`;
    default:
      return Number.isInteger(v) ? String(v) : v.toFixed(2);
  }
}

/**
 * The smallest difference worth calling a difference, at the precision the
 * value is shown with. A 40 ms or tenth-of-a-cent gap never decides who leads.
 */
export function tolerance(def: MetricDef | undefined, a: number, b: number): number {
  switch (def?.format) {
    case "ms":
      return 100;
    case "usd":
      return 0.001;
    case "ratio":
      return 0.005;
    case "tokens":
      return Math.max(1, Math.max(Math.abs(a), Math.abs(b)) * 0.01);
    default:
      return 1e-9;
  }
}

export function sameValue(def: MetricDef | undefined, a: number, b: number) {
  return Math.abs(a - b) < tolerance(def, a, b);
}
