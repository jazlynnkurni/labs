import type { ButtonEvidence, Evidence, JevAnswer, QaStatus } from "./types";
import type { JevQuestion } from "./jev";

/**
 * Button criteria, predefined. Each names the rule it comes from.
 *
 * Deterministic checks run in code against measurements: free, instant, repeatable.
 * Jev criteria are the judgments code cannot make (hierarchy, clarity, fit to a brief);
 * they are asked once per run in a single batched request, and only when the evidence exists.
 *
 * Jev thresholds below are starting values, not truths. Tune them against manual review
 * on the dashboard (the agreement column) before trusting them on more components.
 */

export interface Verdict {
  status: QaStatus;
  reason: string;
  evidence: unknown;
}

export interface DeterministicCriterion {
  id: string;
  title: string;
  rule: string;
  method: "deterministic";
  check: (e: Evidence) => Verdict;
}

export interface JevCriterion {
  id: string;
  title: string;
  rule: string;
  method: "jev";
  question: JevQuestion;
  judge: (a: JevAnswer) => Verdict;
}

export type Criterion = DeterministicCriterion | JevCriterion;

const EASE = "cubic-bezier(0.2, 0.8, 0.1, 1)";
const near = (a: number, b: number, tol = 0.5) => Math.abs(a - b) <= tol;
const sameBox = (a?: { x: number; y: number; width: number; height: number }, b?: { x: number; y: number; width: number; height: number }) =>
  Boolean(a && b && near(a.x, b.x) && near(a.y, b.y) && near(a.width, b.width) && near(a.height, b.height));
const name = (b: ButtonEvidence) => `${b.variant}/${b.size}${b.label ? ` "${b.label}"` : ""}`;
const list = (bs: ButtonEvidence[]) => bs.map(name).join(", ");

/** Shared shape for "every button must satisfy this". */
function everyButton(e: Evidence, ok: (b: ButtonEvidence) => boolean, pass: string, fail: (bad: ButtonEvidence[]) => string, pick: (b: ButtonEvidence) => unknown): Verdict {
  if (!e.buttons.length) return { status: "insufficient", reason: "No buttons were measured on the fixture.", evidence: null };
  const bad = e.buttons.filter((b) => !ok(b));
  return { status: bad.length ? "review" : "pass", reason: bad.length ? fail(bad) : pass, evidence: Object.fromEntries(e.buttons.map((b) => [b.id, pick(b)])) };
}

export const BUTTON_CRITERIA: Criterion[] = [
  {
    id: "label-still",
    title: "Label never moves",
    rule: "sticky-pill: text inside a pill or button never moves in any state",
    method: "deterministic",
    check: (e) =>
      everyButton(
        e,
        (b) => sameBox(b.rest, b.hover) && sameBox(b.rest, b.press) && (!b.labelRest || (sameBox(b.labelRest, b.labelHover) && sameBox(b.labelRest, b.labelPress))),
        "Button and label boxes are identical at rest, hover and press (within 0.5px).",
        (bad) => `Moves on hover or press: ${list(bad)}.`,
        (b) => ({ rest: b.labelRest, hover: b.labelHover, press: b.labelPress }),
      ),
  },
  {
    id: "no-weight-change",
    title: "No weight change on hover",
    rule: "Hover darkens, never emboldens",
    method: "deterministic",
    check: (e) =>
      everyButton(e, (b) => b.fontWeightRest === b.fontWeightHover, "Font weight is the same at rest and on hover.", (bad) => `Weight changes on hover: ${list(bad)}.`, (b) => [b.fontWeightRest, b.fontWeightHover]),
  },
  {
    id: "no-transition-all",
    title: "No transition: all",
    rule: "Never transition: all",
    method: "deterministic",
    check: (e) =>
      everyButton(e, (b) => !/\ball\b/.test(b.transition.property), "Every transition names its properties.", (bad) => `Uses transition: all: ${list(bad)}.`, (b) => b.transition.property),
  },
  {
    id: "ease-curve",
    title: "Her ease-out curve",
    rule: `Her ease-out: ${EASE} at 250ms (2026-11-22)`,
    method: "deterministic",
    check: (e) =>
      everyButton(
        e,
        (b) => b.transition.timing.split(/,(?![^(]*\))/).every((t) => t.trim() === EASE),
        `Every transition runs on ${EASE}.`,
        (bad) => `Other curves on: ${list(bad)}.`,
        (b) => b.transition.timing,
      ),
  },
  {
    id: "state-duration",
    title: "250ms state changes",
    rule: "UI motion 250ms; menus and popovers under 200ms",
    method: "deterministic",
    check: (e) =>
      everyButton(
        e,
        (b) => b.transition.duration.split(",").every((d) => d.trim() === "0.25s"),
        "Every state transition takes 250ms.",
        (bad) => `Other durations on: ${list(bad)}.`,
        (b) => b.transition.duration,
      ),
  },
  {
    id: "press-answers",
    title: "Press shows a visible change",
    rule: "press-answers: every press produces a visible response",
    method: "deterministic",
    check: (e) =>
      everyButton(
        e,
        (b) => b.background.press !== b.background.rest || b.colorPress !== b.color,
        "Every button changes its background, or its text and glyph colour, on press.",
        (bad) => `No visible change on press: ${list(bad)}.`,
        (b) => ({ background: b.background, color: [b.color, b.colorPress] }),
      ),
  },
  {
    id: "hit-area",
    title: "40px hit area",
    rule: "Hit areas 40px desktop, 44px touch",
    method: "deterministic",
    check: (e) =>
      everyButton(
        e,
        (b) => b.hitProbe.hits === b.hitProbe.total,
        "A 40 by 40 target around every button's centre lands on the button.",
        (bad) => `Under 40px: ${bad.map((b) => `${name(b)} ${Math.round(b.rest.width)}x${Math.round(b.rest.height)}`).join(", ")}.`,
        (b) => ({ size: `${Math.round(b.rest.width)}x${Math.round(b.rest.height)}`, probe: `${b.hitProbe.hits}/${b.hitProbe.total}` }),
      ),
  },
  {
    id: "one-line",
    title: "Labels stay on one line",
    rule: "break-never: a one-line control stays one line",
    method: "deterministic",
    check: (e) =>
      everyButton(e, (b) => b.labelLines <= 1 && b.whiteSpace === "nowrap", "Every label is one line with white-space: nowrap.", (bad) => `Wraps or can wrap: ${list(bad)}.`, (b) => ({ lines: b.labelLines, whiteSpace: b.whiteSpace })),
  },
  {
    id: "focus-visible",
    title: "Keyboard focus is visible",
    rule: "Focus rings on keyboard focus",
    method: "deterministic",
    check: (e) => {
      if (!e.buttons.length) return { status: "insufficient", reason: "No buttons were measured.", evidence: null };
      const unreached = e.buttons.filter((b) => !b.focusVisible);
      if (unreached.length === e.buttons.length) return { status: "insufficient", reason: `Tab never reached the buttons, so focus could not be measured${e.focusError ? `: ${e.focusError}` : "."}`, evidence: e.focusError ?? null };
      const bad = e.buttons.filter((b) => b.focusVisible && !b.focusVisible.changed);
      const status: QaStatus = bad.length ? "review" : unreached.length ? "insufficient" : "pass";
      const reason = bad.length ? `No visible focus change: ${list(bad)}.` : unreached.length ? `Tab did not reach: ${list(unreached)}.` : "Every button shows a ring or outline on keyboard focus.";
      return { status, reason, evidence: Object.fromEntries(e.buttons.map((b) => [b.id, b.focusVisible ?? "not reached"])) };
    },
  },
  {
    id: "axe",
    title: "No axe-core violations",
    rule: "Accessibility: axe-core, WCAG A and AA rules",
    method: "deterministic",
    check: (e) => {
      if (!e.a11y) return { status: "insufficient", reason: `axe did not run${e.a11yError ? `: ${e.a11yError}` : "."}`, evidence: e.a11yError ?? null };
      return e.a11y.length
        ? { status: "review", reason: `${e.a11y.length} violation${e.a11y.length > 1 ? "s" : ""}: ${e.a11y.map((v) => `${v.id} (${v.impact}, ${v.nodes})`).join(", ")}.`, evidence: e.a11y }
        : { status: "pass", reason: "axe found no violations in the fixture.", evidence: [] };
    },
  },
  {
    id: "label-copy",
    title: "Sentence case, no em dash",
    rule: "App UI in sentence case with a capital first letter; no em dashes or middots",
    method: "deterministic",
    check: (e) =>
      everyButton(
        e,
        (b) => {
          const text = b.label || b.accessibleName;
          if (!text) return false;
          if (/[\u2014\u00b7]/.test(text)) return false;
          const words = text.split(/\s+/);
          const firstOk = /^[A-Z0-9]/.test(words[0]);
          // Later words are lowercase, unless an acronym (two or more capitals).
          const restOk = words.slice(1).every((w) => !/^[A-Z][a-z]/.test(w));
          return firstOk && restOk;
        },
        "Every label and accessible name is sentence case with no em dash or middot.",
        (bad) => `Check the copy of: ${bad.map((b) => `"${b.label || b.accessibleName || "(no name)"}"`).join(", ")}. Proper nouns may be fine.`,
        (b) => b.label || b.accessibleName,
      ),
  },
  {
    id: "icon-only-named",
    title: "Icon-only buttons have a name",
    rule: "Every control has an accessible name",
    method: "deterministic",
    check: (e) => {
      const iconOnly = e.buttons.filter((b) => b.hasIcon && !b.label);
      if (!iconOnly.length) return { status: "insufficient", reason: "The fixture has no icon-only button to check.", evidence: null };
      const bad = iconOnly.filter((b) => !b.accessibleName.trim());
      return { status: bad.length ? "review" : "pass", reason: bad.length ? `Unnamed: ${list(bad)}.` : "Every icon-only button has an aria-label.", evidence: iconOnly.map((b) => [b.id, b.accessibleName]) };
    },
  },

  // Judgments: Jev. Thresholds are starting values; compare with manual review before trusting them.
  {
    id: "hierarchy",
    title: "Variant hierarchy reads clearly",
    rule: "One filled button per group; the rest quieter",
    method: "jev",
    question: {
      type: "noul",
      instructions:
        "Judging only the measured colours and borders in the state: is the default (primary) variant clearly the most prominent, with secondary, outline and ghost each visibly quieter than it?",
      criteria: { true: "The primary stands out and the others step down in emphasis", false: "Two or more variants compete for emphasis, or the order is unclear" },
    },
    judge: (a) => noulVerdict(a.noul, "The primary reads as the most prominent and the others step down.", "Variants compete for emphasis or the order is unclear."),
  },
  {
    id: "destructive-signal",
    title: "Destructive reads as irreversible",
    rule: "Red only for what cannot be undone; a destructive action names the loss",
    method: "jev",
    question: {
      type: "score",
      instructions: "How clearly does the destructive variant signal an irreversible action, compared with the other variants?",
      criteria: ["Indistinguishable from the other actions", "Different by colour only", "Different by colour and by a label that names what is lost"],
    },
    judge: (a) => scoreVerdict(a, 1.5, "The destructive button differs by colour and by a label that names the loss.", "The destructive button relies on colour alone or does not stand apart."),
  },
  {
    id: "label-clarity",
    title: "Labels say what happens",
    rule: "Labels are plain verbs a stranger understands",
    method: "jev",
    question: {
      type: "choice",
      instructions: "How would a first-time user read these button labels and accessible names?",
      criteria: {
        clear: "Each label is a plain verb phrase that says what will happen",
        mixed: "Some labels are vague or use internal jargon",
        unclear: "Most labels do not say what will happen",
      },
    },
    judge: (a) => {
      const c = a.confidence ?? 0;
      if (a.choice === "clear" && c >= 0.6) return { status: "pass", reason: `Jev reads the labels as clear (confidence ${c.toFixed(2)}).`, evidence: a };
      return { status: "review", reason: `Jev reads the labels as ${a.choice ?? "unknown"} (confidence ${c.toFixed(2)}).`, evidence: a };
    },
  },
  {
    id: "brief-fit",
    title: "Fits the design brief",
    rule: "The implementation does what the brief asks",
    method: "jev",
    question: {
      type: "noul",
      instructions: "Given the design brief and the rules in the state, does the measured button family do what the brief asks?",
      criteria: { true: "The measurements match what the brief asks for", false: "At least one thing the brief asks for is missing or contradicted" },
    },
    judge: (a) => noulVerdict(a.noul, "The measured family matches the brief.", "Something the brief asks for is missing or contradicted."),
  },
];

/** Noul: 0.8 or above passes, 0.2 or below is a clear no, anything between is unclear. Both of the last go to review. */
export function noulVerdict(p: number | undefined, yes: string, no: string): Verdict {
  if (p === undefined) return { status: "insufficient", reason: "Jev returned no probability.", evidence: null };
  if (p >= 0.8) return { status: "pass", reason: `${yes} (p ${p.toFixed(2)})`, evidence: { noul: p } };
  if (p <= 0.2) return { status: "review", reason: `${no} (p ${p.toFixed(2)})`, evidence: { noul: p } };
  return { status: "review", reason: `Jev is unsure (p ${p.toFixed(2)}); look at it yourself.`, evidence: { noul: p } };
}

/** Score: at or above the bar with confidence 0.6 or more passes; everything else goes to review. */
export function scoreVerdict(a: JevAnswer, bar: number, yes: string, no: string): Verdict {
  const s = a.score;
  const c = a.confidence ?? 0;
  if (s === undefined) return { status: "insufficient", reason: "Jev returned no score.", evidence: null };
  if (s >= bar && c >= 0.6) return { status: "pass", reason: `${yes} (score ${s.toFixed(2)}, confidence ${c.toFixed(2)})`, evidence: a };
  return { status: "review", reason: `${s >= bar ? "Low confidence. " : `${no} `}(score ${s.toFixed(2)}, confidence ${c.toFixed(2)})`, evidence: a };
}

/** The one state Jev sees: the brief, a trimmed rules excerpt and the measurements that matter, nothing else. */
export function jevState(e: Evidence, brief: string, rules: string) {
  return {
    brief: brief.slice(0, 2000),
    rules: rules.slice(0, 6000),
    buttons: e.buttons.map((b) => ({
      variant: b.variant,
      size: b.size,
      label: b.label || null,
      accessibleName: b.accessibleName,
      background: b.background.rest,
      text: b.color,
      border: b.border,
      size_px: `${Math.round(b.rest.width)}x${Math.round(b.rest.height)}`,
      icon: b.hasIcon,
    })),
  };
}
