import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

export const VIEWPORTS = [
  { id: "desktop", label: "Desktop 1440×900", width: 1440, height: 900, mobile: false },
  { id: "mobile", label: "Mobile 390×844", width: 390, height: 844, mobile: true },
] as const;

export interface ViewportResult {
  viewport: (typeof VIEWPORTS)[number]["id"];
  screenshot: string;
  fullPage: string;
  consoleErrors: string[];
  pageErrors: string[];
  failedRequests: string[];
  horizontalOverflow: boolean;
  a11y?: { violations: number; critical: number; serious: number; moderate: number; minor: number; rules: { id: string; impact: string; nodes: number; help: string }[] };
  /** Why the accessibility audit could not run, if it could not. */
  a11yError?: string;
  loadMs: number;
}

let axeSource: string | undefined;
function axe() {
  if (!axeSource) {
    // Resolve from the project root: inside the Next server bundle import.meta.url
    // does not point at node_modules.
    const require = createRequire(path.join(process.cwd(), "package.json"));
    axeSource = fs.readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");
  }
  return axeSource;
}

/**
 * Load one URL at every standard viewport with a fresh, throwaway browser
 * profile, and measure only what can be measured: errors, layout overflow,
 * axe-core violations and load time. Screenshots are the same size for every agent.
 */
export async function inspect(url: string, outDir: string): Promise<ViewportResult[]> {
  const { chromium } = await import("playwright");
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results: ViewportResult[] = [];
  try {
    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        isMobile: vp.mobile,
        hasTouch: vp.mobile,
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      const consoleErrors: string[] = [];
      const pageErrors: string[] = [];
      const failedRequests: string[] = [];
      page.on("console", (m) => {
        if (m.type() === "error") consoleErrors.push(m.text().slice(0, 300));
      });
      page.on("pageerror", (e) => pageErrors.push(String(e.message).slice(0, 300)));
      page.on("requestfailed", (r) => failedRequests.push(`${r.failure()?.errorText ?? "failed"} ${r.url()}`.slice(0, 300)));
      page.on("response", (r) => {
        if (r.status() >= 400) failedRequests.push(`${r.status()} ${r.url()}`.slice(0, 300));
      });
      const t0 = Date.now();
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
      } catch {
        await page.goto(url, { waitUntil: "load", timeout: 30_000 }).catch(() => undefined);
      }
      const loadMs = Date.now() - t0;
      await page.waitForTimeout(800);
      const shot = path.join(outDir, `${vp.id}.png`);
      const full = path.join(outDir, `${vp.id}-full.png`);
      await page.screenshot({ path: shot });
      const height = await page.evaluate(() => document.documentElement.scrollHeight).catch(() => vp.height);
      await page.screenshot({ path: full, fullPage: height <= 6000, clip: height > 6000 ? { x: 0, y: 0, width: vp.width, height: 6000 } : undefined });
      const horizontalOverflow = await page
        .evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
        .catch(() => false);
      let a11y: ViewportResult["a11y"];
      let a11yError: string | undefined;
      try {
        await page.addScriptTag({ content: axe() });
        const r = (await page.evaluate(async () => {
          // @ts-expect-error injected by addScriptTag
          const res = await window.axe.run(document, { resultTypes: ["violations"] });
          return res.violations.map((v: { id: string; impact: string; nodes: unknown[]; help: string }) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }));
        })) as { id: string; impact: string; nodes: number; help: string }[];
        const count = (i: string) => r.filter((v) => v.impact === i).length;
        a11y = { violations: r.length, critical: count("critical"), serious: count("serious"), moderate: count("moderate"), minor: count("minor"), rules: r };
      } catch (e) {
        // Leave it unmeasured, but say why in the report rather than hiding it.
        a11y = undefined;
        a11yError = String((e as Error).message).slice(0, 200);
      }
      results.push({ viewport: vp.id, screenshot: shot, fullPage: full, consoleErrors, pageErrors, failedRequests, horizontalOverflow, a11y, a11yError, loadMs });
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return results;
}
