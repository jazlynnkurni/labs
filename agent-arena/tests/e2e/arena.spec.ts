import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const axeSource = fs.readFileSync(createRequire(path.join(process.cwd(), "package.json")).resolve("axe-core/axe.min.js"), "utf8");

async function axeSerious(page: Page) {
  await page.addScriptTag({ content: axeSource });
  const violations = (await page.evaluate(async () => {
    // @ts-expect-error injected
    const r = await window.axe.run(document, { resultTypes: ["violations"] });
    return r.violations.map((v: { id: string; impact: string }) => ({ id: v.id, impact: v.impact }));
  })) as { id: string; impact: string }[];
  return violations.filter((v) => v.impact === "serious" || v.impact === "critical");
}

test("runs two fixture variants end to end and compares them", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Task").fill("Build a one-page landing for a tea shop with a menu section");
  await page.getByRole("checkbox", { name: "Run Scripted fixture" }).click();
  await page.getByRole("button", { name: "Compare another Scripted fixture model" }).click();
  await page.getByRole("button", { name: "Run comparison" }).click();
  await expect(page.getByRole("heading", { name: "Start 2 agents?" })).toBeVisible();
  await page.getByRole("button", { name: "Start", exact: true }).click();

  await page.waitForURL(/\/experiments\/exp_/);
  await expect(page.getByText("Development fixture. Not an AI agent", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Done", { exact: true })).toBeVisible({ timeout: 90_000 });

  // Each agent has its own diff.
  const panels = page.getByRole("article");
  await expect(panels).toHaveCount(2);

  // Checked in both themes: light (the browser default here), then dark.
  expect(await axeSerious(page)).toEqual([]);
  await page.emulateMedia({ colorScheme: "dark" });
  await page.waitForTimeout(300); // let the 150 ms colour transition settle
  expect(await axeSerious(page)).toEqual([]);
  await page.getByRole("tab", { name: "Evaluation" }).click();
  await expect(page.getByRole("heading", { name: "Summary for the selected criteria" })).toBeVisible();
  expect(await axeSerious(page)).toEqual([]);
  await page.emulateMedia({ colorScheme: "light" });
  await page.waitForTimeout(300); // let the 150 ms colour transition settle
  expect(await axeSerious(page)).toEqual([]);
  // Variant B wrote passing tests; variant A has no test script, so it is "n/a", not a failure.
  const table = page.locator("table").first();
  await expect(table).toContainText("100%");
  await expect(table).toContainText("n/a");

  // A personal rating is stored and survives a reload.
  await page.getByRole("radiogroup", { name: /Typography for Scripted fixture/ }).first().getByRole("radio", { name: "4 of 5" }).click();
  await page.reload();
  await page.getByRole("tab", { name: "Evaluation" }).click();
  await expect(page.getByRole("radiogroup", { name: /Typography for Scripted fixture/ }).first().getByRole("radio", { name: "4 of 5" })).toHaveAttribute("aria-checked", "true");

  // The frozen brief is shown verbatim.
  await page.getByRole("tab", { name: "Brief" }).click();
  await expect(page.getByText("Do not push, publish, deploy or open pull requests.", { exact: false })).toBeVisible();
  // Design context is on by default and recorded as one shared file.
  await expect(page.getByText("same file for every agent", { exact: false })).toBeVisible();

  // History lists it.
  await page.goto("/experiments");
  await expect(page.getByText("Build a one-page landing for a tea shop").first()).toBeVisible();
});

test("a long model list gets a search field that filters and picks", async ({ page }) => {
  // The fixture has two models; pad its list past the search threshold, in this test only.
  await page.route("**/api/agents", async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    for (const a of body.agents) {
      if (a.id === "dev-fixture") a.models = [...a.models, ...Array.from({ length: 16 }, (_, i) => ({ id: `filler-${i + 1}`, label: `Filler model ${i + 1}` }))];
    }
    await route.fulfill({ response: res, json: body });
  });
  await page.goto("/");
  const trigger = page.getByRole("combobox", { name: "Scripted fixture model 1" });
  await trigger.click();
  await page.getByRole("combobox", { name: "Search models" }).fill("styled");
  await expect(page.getByRole("option")).toHaveCount(1);
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(trigger).toHaveText("Variant B (styled, with a test)");
  await expect(trigger).toBeFocused();

  await trigger.click();
  await page.getByRole("combobox", { name: "Search models" }).fill("nothing like this");
  await expect(page.getByText("No matching models")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("refuses state-changing API calls from another origin", async ({ request }) => {
  const res = await request.post("/api/experiments/nope/cancel", { headers: { Origin: "http://127.0.0.1:5999" } });
  expect(res.status()).toBe(403);
});

test("settings shows every agent without exposing credentials", async ({ page }) => {
  await page.goto("/settings");
  for (const name of ["Claude Code", "Codex CLI", "Cursor Agent", "BLACKBOX CLI", "Devin"]) {
    await expect(page.getByRole("article", { name })).toBeVisible();
  }
  const html = await page.content();
  expect(html).not.toMatch(/sk-ant-|cog_[A-Za-z0-9]{8}|@[a-z0-9-]+\.(com|ai)\b/i);
});

for (const scheme of ["dark", "light"] as const)
for (const route of ["/", "/experiments", "/settings"]) {
  test(`${route} in ${scheme} has no serious accessibility violations and no sideways scroll @responsive`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto(route);
    await page.waitForLoadState("networkidle");
    // The theme follows the system and is set before first paint.
    expect(await page.evaluate(() => document.documentElement.classList.contains("dark"))).toBe(scheme === "dark");
    expect(await axeSerious(page)).toEqual([]);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  });
}

test("the theme toggle flips light and dark with one morphing glyph @responsive", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/");
  const isDark = () => page.evaluate(() => document.documentElement.classList.contains("dark"));
  const shown = () =>
    page.evaluate(() => {
      const button = [...document.querySelectorAll<HTMLElement>("button.theme-icon")].find((b) => b.offsetParent);
      return [...(button?.querySelectorAll("svg") ?? [])]
        .filter((svg) => getComputedStyle(svg).opacity === "1")
        .map((svg) => (svg.classList.contains("theme-icon-sun") ? "sun" : "moon"));
    });
  expect(await isDark()).toBe(false);
  await expect.poll(shown).toEqual(["sun"]);
  await page.getByRole("button", { name: "Switch to dark mode" }).filter({ visible: true }).click();
  expect(await isDark()).toBe(true);
  await expect.poll(shown).toEqual(["moon"]);
  await page.reload();
  expect(await isDark()).toBe(true);
  await page.getByRole("button", { name: "Switch to light mode" }).filter({ visible: true }).click();
  expect(await isDark()).toBe(false);
  await expect.poll(shown).toEqual(["sun"]);
});
