import { afterEach, describe, expect, it, vi } from "vitest";
import { BUTTON_CRITERIA, noulVerdict, scoreVerdict, type DeterministicCriterion } from "@/lib/qa/criteria";
import { askJev } from "@/lib/qa/jev";
import type { ButtonEvidence, Evidence } from "@/lib/qa/types";

const box = (x = 0, y = 0, w = 120, h = 40) => ({ x, y, width: w, height: h });

function button(over: Partial<ButtonEvidence> = {}): ButtonEvidence {
  return {
    id: "default",
    variant: "default",
    size: "default",
    label: "Run comparison",
    accessibleName: "Run comparison",
    rest: box(),
    hover: box(),
    press: box(),
    labelRest: box(10, 10, 100, 20),
    labelHover: box(10, 10, 100, 20),
    labelPress: box(10, 10, 100, 20),
    fontWeightRest: "500",
    fontWeightHover: "500",
    background: { rest: "rgb(0, 0, 0)", hover: "rgb(20, 20, 20)", press: "rgb(40, 40, 40)" },
    color: "rgb(255, 255, 255)",
    colorPress: "rgb(255, 255, 255)",
    border: "1px solid rgba(0, 0, 0, 0)",
    whiteSpace: "nowrap",
    labelLines: 1,
    transition: { property: "color, background-color", duration: "0.25s, 0.25s", timing: "cubic-bezier(0.2, 0.8, 0.1, 1), cubic-bezier(0.2, 0.8, 0.1, 1)" },
    hitProbe: { size: 40, hits: 8, total: 8 },
    focusVisible: { changed: true, boxShadow: "ring", outline: "none 0px" },
    hasIcon: false,
    ...over,
  };
}

const evidence = (buttons: ButtonEvidence[], extra: Partial<Evidence> = {}): Evidence => ({ url: "x", capturedAt: "t", buttons, consoleErrors: [], a11y: [], ...extra });
const check = (id: string, e: Evidence) => (BUTTON_CRITERIA.find((c) => c.id === id) as DeterministicCriterion).check(e);

describe("deterministic button checks", () => {
  it("passes a button that follows every measurable rule", () => {
    const e = evidence([button()]);
    for (const c of BUTTON_CRITERIA) {
      if (c.method !== "deterministic" || c.id === "icon-only-named") continue;
      expect(c.check(e).status, c.id).toBe("pass");
    }
  });

  it("sends a moving label to review", () => {
    expect(check("label-still", evidence([button({ labelPress: box(10, 11, 100, 20) })])).status).toBe("review");
  });

  it("accepts a glyph colour change as press feedback on an icon-only button", () => {
    const icon = button({ label: "", hasIcon: true, background: { rest: "transparent", hover: "transparent", press: "transparent" }, color: "grey", colorPress: "black" });
    expect(check("press-answers", evidence([icon])).status).toBe("pass");
    expect(check("press-answers", evidence([{ ...icon, colorPress: "grey" }])).status).toBe("review");
  });

  it("sends a 32px button to review for hit area", () => {
    const v = check("hit-area", evidence([button({ rest: box(0, 0, 120, 32), hitProbe: { size: 40, hits: 4, total: 8 } })]));
    expect(v.status).toBe("review");
    expect(v.reason).toContain("120x32");
  });

  it("flags a different curve and transition: all", () => {
    expect(check("ease-curve", evidence([button({ transition: { property: "all", duration: "0.15s", timing: "ease" } })])).status).toBe("review");
    expect(check("no-transition-all", evidence([button({ transition: { property: "all", duration: "0.15s", timing: "ease" } })])).status).toBe("review");
  });

  it("flags title case and em dashes in labels", () => {
    expect(check("label-copy", evidence([button({ label: "Run Comparison" })])).status).toBe("review");
    expect(check("label-copy", evidence([button({ label: "Run \u2014 now" })])).status).toBe("review");
    expect(check("label-copy", evidence([button({ label: "Open PR" })])).status).toBe("pass");
  });

  it("reports missing evidence instead of guessing", () => {
    expect(check("label-still", evidence([])).status).toBe("insufficient");
    expect(check("axe", evidence([button()], { a11y: undefined, a11yError: "blocked" })).status).toBe("insufficient");
    expect(check("focus-visible", evidence([button({ focusVisible: undefined })])).status).toBe("insufficient");
  });
});

describe("Jev answer mapping", () => {
  it("maps noul probabilities to pass, clear no and unsure", () => {
    expect(noulVerdict(0.9, "y", "n").status).toBe("pass");
    expect(noulVerdict(0.1, "y", "n").status).toBe("review");
    expect(noulVerdict(0.5, "y", "n").reason).toContain("unsure");
    expect(noulVerdict(undefined, "y", "n").status).toBe("insufficient");
  });

  it("needs both the score and the confidence to pass", () => {
    expect(scoreVerdict({ type: "score", score: 1.8, confidence: 0.9 }, 1.5, "y", "n").status).toBe("pass");
    expect(scoreVerdict({ type: "score", score: 1.8, confidence: 0.3 }, 1.5, "y", "n").status).toBe("review");
    expect(scoreVerdict({ type: "score", score: 0.9, confidence: 0.9 }, 1.5, "y", "n").status).toBe("review");
  });
});

describe("Jev client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.JEV_API_KEY;
  });

  it("refuses to call without a key", async () => {
    await expect(askJev("s", { q: { type: "noul", instructions: "?" } })).rejects.toThrow(/JEV_API_KEY/);
  });

  it("calls once, then answers the same question from the cache", async () => {
    process.env.JEV_API_KEY = "test-key";
    const fetchMock = vi.fn(async () =>
      Response.json({ code: 0, message: "ok", data: { result: { answers: { q: { type: "noul", noul: 0.91 } } }, creditsUsed: 1 } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const q = { q: { type: "noul" as const, instructions: "Is it clear?" } };
    const first = await askJev({ a: 1 }, q);
    const second = await askJev({ a: 1 }, q);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first.answers.q.cached).toBe(false);
    expect(second.answers.q.cached).toBe(true);
    expect(second.answers.q.answer.noul).toBe(0.91);
    // The key goes in the header only, never in the body.
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(String(init.body)).not.toContain("test-key");
  });

  it("does not read data when the envelope code is not 0", async () => {
    process.env.JEV_API_KEY = "test-key";
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({ code: 7, message: "bad question", data: {} })));
    await expect(askJev({ b: 2 }, { q: { type: "noul", instructions: "x" } })).rejects.toThrow(/code 7/);
  });
});
