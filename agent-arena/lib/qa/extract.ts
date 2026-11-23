import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import type { Box, ButtonEvidence, Evidence } from "./types";

// Resolve from the project root: inside the Next server bundle import.meta.url does not point at node_modules.
const require = createRequire(path.join(process.cwd(), "package.json"));

/**
 * Load a fixture page and measure every `[data-qa-id]` element inside `[data-qa-root]`:
 * boxes at rest, hover and press, the label's box in each, computed type and motion,
 * a hit-area probe, keyboard focus, and an axe-core scan of the fixture only.
 * A fresh headless browser with a throwaway profile, closed when done.
 */
export async function extractButtons(
  url: string,
  outDir: string,
): Promise<Evidence> {
  const { chromium } = await import("playwright");
  fs.mkdirSync(outDir, { recursive: true });
  const evidence: Evidence = {
    url,
    capturedAt: new Date().toISOString(),
    buttons: [],
    consoleErrors: [],
  };
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({
      viewport: { width: 1320, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: "no-preference",
    });
    const page = await context.newPage();
    page.on("console", (m) => {
      if (m.type() === "error")
        evidence.consoleErrors.push(m.text().slice(0, 300));
    });
    await page.goto(url, { waitUntil: "networkidle", timeout: 30_000 });
    await page.waitForSelector("[data-qa-root]", { timeout: 10_000 });
    // Let any entrance or font swap settle before measuring.
    await page.waitForTimeout(600);

    const ids = await page.$$eval("[data-qa-root] [data-qa-id]", (els) =>
      els.map((e) => e.getAttribute("data-qa-id")!),
    );
    const settle = () => page.waitForTimeout(450);

    for (const id of ids) {
      await page.mouse.move(2, 2);
      await settle();
      const rest = await snapshot(page, id);
      const b = rest.box;
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await settle();
      const hover = await snapshot(page, id);
      await page.mouse.down();
      await page.waitForTimeout(120);
      const press = await snapshot(page, id);
      await page.mouse.up();
      await page.mouse.move(2, 2);
      const probe = await page.evaluate(
        ({ id, size }) => {
          const el = document.querySelector(`[data-qa-id="${id}"]`)!;
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const h = size / 2 - 1;
          const pts = [
            [-h, -h],
            [h, -h],
            [-h, h],
            [h, h],
            [-h, 0],
            [h, 0],
            [0, -h],
            [0, h],
          ];
          let hits = 0;
          for (const [dx, dy] of pts) {
            const hit = document.elementFromPoint(cx + dx, cy + dy);
            if (hit && (hit === el || el.contains(hit))) hits++;
          }
          return { size, hits, total: pts.length };
        },
        { id, size: 40 },
      );
      evidence.buttons.push({
        id,
        variant: rest.variant,
        size: rest.size,
        label: rest.label,
        accessibleName: rest.accessibleName,
        rest: rest.box,
        hover: hover.box,
        press: press.box,
        labelRest: rest.labelBox,
        labelHover: hover.labelBox,
        labelPress: press.labelBox,
        fontWeightRest: rest.fontWeight,
        fontWeightHover: hover.fontWeight,
        background: {
          rest: rest.background,
          hover: hover.background,
          press: press.background,
        },
        color: rest.color,
        colorPress: press.color,
        border: rest.border,
        whiteSpace: rest.whiteSpace,
        labelLines: rest.labelLines,
        transition: rest.transition,
        hitProbe: probe,
        hasIcon: rest.hasIcon,
      });
    }

    // Keyboard focus: start just before the fixture, then Tab through it and record what changes.
    // Isolated, so a failure here leaves every other measurement in place.
    try {
      await page.evaluate(() => {
        const root = document.querySelector<HTMLElement>("[data-qa-root]")!;
        root.tabIndex = -1;
        root.focus();
      });
      const restShadow = Object.fromEntries(
        evidence.buttons.map((b) => [b.id, ""]),
      );
      for (const b of evidence.buttons) {
        restShadow[b.id] = await page.$eval(`[data-qa-id="${b.id}"]`, (e) => {
          const s = getComputedStyle(e);
          return `${s.boxShadow}|${s.outlineStyle} ${s.outlineWidth}`;
        });
      }
      for (let i = 0; i < evidence.buttons.length * 2 + 4; i++) {
        await page.keyboard.press("Tab");
        await page.waitForTimeout(80);
        const focused = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          const id = el?.closest("[data-qa-id]")?.getAttribute("data-qa-id");
          if (!id || !el) return null;
          const s = getComputedStyle(el.closest("[data-qa-id]")!);
          return {
            id,
            boxShadow: s.boxShadow,
            outline: `${s.outlineStyle} ${s.outlineWidth}`,
          };
        });
        if (!focused) continue;
        const btn = evidence.buttons.find((b) => b.id === focused.id);
        if (btn && !btn.focusVisible) {
          btn.focusVisible = {
            changed:
              `${focused.boxShadow}|${focused.outline}` !==
              restShadow[focused.id],
            boxShadow: focused.boxShadow,
            outline: focused.outline,
          };
        }
      }
    } catch (e) {
      evidence.focusError = String((e as Error).message).slice(0, 200);
    }

    // axe-core on the fixture only, so the app shell around it does not count.
    try {
      await page.addScriptTag({
        content: fs.readFileSync(
          require.resolve("axe-core/axe.min.js"),
          "utf8",
        ),
      });
      evidence.a11y = (await page.evaluate(async () => {
        // @ts-expect-error injected by addScriptTag
        const res = await window.axe.run(
          document.querySelector("[data-qa-root]"),
          { resultTypes: ["violations"] },
        );
        return res.violations.map(
          (v: {
            id: string;
            impact: string;
            nodes: unknown[];
            help: string;
          }) => ({
            id: v.id,
            impact: v.impact,
            nodes: v.nodes.length,
            help: v.help,
          }),
        );
      })) as Evidence["a11y"];
    } catch (e) {
      evidence.a11yError = String((e as Error).message).slice(0, 200);
    }

    try {
      const shot = path.join(outDir, "fixture.png");
      await page
        .locator("[data-qa-root]")
        .screenshot({ path: shot, timeout: 10_000 });
      evidence.screenshot = shot;
    } catch {
      // A missing screenshot is shown as missing; the measurements stand.
    }
    await context.close();
  } catch (e) {
    evidence.extractError = String((e as Error).message).slice(0, 300);
  } finally {
    await browser.close();
  }
  return evidence;
}

type Page = import("playwright").Page;

async function snapshot(page: Page, id: string) {
  return page.$eval(`[data-qa-id="${id}"]`, (el) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const box = { x: r.x, y: r.y, width: r.width, height: r.height };
    // The label's own box: every text node inside the button.
    const range = document.createRange();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const texts: Text[] = [];
    while (walker.nextNode()) {
      const t = walker.currentNode as Text;
      if (t.textContent?.trim()) texts.push(t);
    }
    let labelBox:
      { x: number; y: number; width: number; height: number } | undefined;
    let labelLines = 0;
    if (texts.length) {
      range.setStartBefore(texts[0]);
      range.setEndAfter(texts[texts.length - 1]);
      const lr = range.getBoundingClientRect();
      labelBox = { x: lr.x, y: lr.y, width: lr.width, height: lr.height };
      const lh = parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.4;
      labelLines = Math.max(1, Math.round(lr.height / lh));
    }
    const label = texts.map((t) => t.textContent!.trim()).join(" ");
    return {
      variant: el.getAttribute("data-variant") ?? "",
      size: el.getAttribute("data-size") ?? "",
      label,
      accessibleName: el.getAttribute("aria-label") ?? label,
      box,
      labelBox,
      labelLines,
      fontWeight: s.fontWeight,
      background: s.backgroundColor,
      color: s.color,
      border: `${s.borderTopWidth} ${s.borderTopStyle} ${s.borderTopColor}`,
      whiteSpace: s.whiteSpace,
      transition: {
        property: s.transitionProperty,
        duration: s.transitionDuration,
        timing: s.transitionTimingFunction,
      },
      hasIcon: Boolean(el.querySelector("svg")),
    };
  });
}

export type { Box, ButtonEvidence };
