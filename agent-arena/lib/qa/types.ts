/**
 * Design QA: types shared by the extractor, the criteria, the Jev client and the dashboard.
 *
 * Every criterion ends in one of three statuses:
 *   pass          the evidence meets the rule
 *   review        the evidence breaks the rule, or the judgment is not clear enough to trust
 *   insufficient  there is not enough evidence to judge (missing measurement, no Jev key, Jev not run)
 */

export type QaStatus = "pass" | "review" | "insufficient";
export type Method = "deterministic" | "jev";
export type ManualVerdict = "pass" | "fail" | "unsure";
export type RevisionStatus = "open" | "proposing" | "proposed" | "applied" | "dismissed";

/** One rendered button, measured in the browser. */
export interface ButtonEvidence {
  id: string;
  variant: string;
  size: string;
  label: string;
  accessibleName: string;
  rest: Box;
  hover: Box;
  press: Box;
  labelRest?: Box;
  labelHover?: Box;
  labelPress?: Box;
  fontWeightRest: string;
  fontWeightHover: string;
  background: { rest: string; hover: string; press: string };
  color: string;
  /** Text and glyph colour while pressed: for icon-only buttons this is the feedback. */
  colorPress: string;
  border: string;
  whiteSpace: string;
  labelLines: number;
  transition: { property: string; duration: string; timing: string };
  /** Points around the centre that land on this button, for a 40 by 40 target. */
  hitProbe: { size: number; hits: number; total: number };
  focusVisible?: { changed: boolean; boxShadow: string; outline: string };
  hasIcon: boolean;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface A11yViolation {
  id: string;
  impact: string;
  nodes: number;
  help: string;
}

/** Everything the extractor saw on one page. */
export interface Evidence {
  url: string;
  capturedAt: string;
  buttons: ButtonEvidence[];
  a11y?: A11yViolation[];
  a11yError?: string;
  focusError?: string;
  screenshot?: string;
  consoleErrors: string[];
  extractError?: string;
}

export interface JevAnswer {
  type: "choice" | "score" | "noul";
  noul?: number;
  choice?: string;
  score?: number;
  confidence?: number;
  probabilities?: Record<string, number>;
  legend?: Record<string, string>;
}

export interface CriterionResult {
  id: string;
  title: string;
  rule: string;
  method: Method;
  status: QaStatus;
  /** One plain sentence on why. */
  reason: string;
  /** The measured values or the Jev answer that decided it. */
  evidence: unknown;
  jev?: { question: unknown; answer?: JevAnswer; cached: boolean; model: string };
  manual?: { verdict: ManualVerdict; note?: string; at: string };
  revision: { status: RevisionStatus; proposal?: string; costUsd?: number; at?: string; error?: string };
}

export interface QaRun {
  id: string;
  component: string;
  createdAt: string;
  brief: string;
  rules: string;
  notes: string;
  evidence: Evidence;
  results: CriterionResult[];
  jev: { keyPresent: boolean; model: string; requests: number; cachedRequests: number; creditsUsed: number; error?: string };
  durationMs: number;
}
