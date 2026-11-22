import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";

/**
 * Jaz's design context, assembled from her own Claude setup into one file that
 * every agent receives byte for byte. Without it, only Claude Code could ever
 * see her rules (and the arena switches those off for fairness), so the
 * comparison would measure taste-free defaults.
 *
 * Lines that name company work are dropped before anything leaves this
 * machine: this file goes to OpenAI, Cursor and others, not only Anthropic.
 */

const claudeHome = () => process.env.ARENA_CLAUDE_HOME || path.join(os.homedir(), ".claude");

/** Her UI rule skills: short, rule-shaped, on by default. */
const RULE_SKILLS = ["break-never", "chevron-swap", "hover-only-grey", "icon-text-line", "no-gray-hover", "precise-box", "press-answers", "rhythm-first", "sticky-pill"];
/** Longer craft guides: offered, off by default. */
const OPTIONAL_SKILLS = ["gestures", "review-animations", "ui-review", "enforce-design-system", "ux-writing-humanize"];

/** Any line naming company work is removed. Matches whole words, case-insensitive. */
const COMPANY = /\b(autumn\w*|autumnhq|spark(?:-glasses)?|clover|eden|rayneo)\b/i;

export interface ContextSource {
  id: string;
  kind: "defaults" | "skill";
  label: string;
  description: string;
  bytes: number;
  defaultOn: boolean;
  removedLines: number;
}

interface Loaded extends ContextSource {
  body: string;
}

function stripCompany(text: string) {
  let removed = 0;
  const kept = text.split("\n").filter((line) => {
    if (COMPANY.test(line)) {
      removed++;
      return false;
    }
    return true;
  });
  return { text: kept.join("\n").replace(/\n{3,}/g, "\n\n").trim(), removed };
}

function section(md: string, heading: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const start = md.search(new RegExp(`^## ${escaped}\\s*$`, "m"));
  if (start < 0) return "";
  const rest = md.slice(start).split("\n").slice(1);
  const end = rest.findIndex((l) => /^## /.test(l));
  return (end < 0 ? rest : rest.slice(0, end)).join("\n").trim();
}

function loadDefaults(): Loaded | undefined {
  const file = path.join(claudeHome(), "CLAUDE.md");
  if (!fs.existsSync(file)) return undefined;
  const md = fs.readFileSync(file, "utf8");
  const design = section(md, "Design defaults")
    .split("\n")
    // Project brand palettes are not rules for a fresh task.
    .filter((l) => !/^brand palettes/i.test(l.trim()))
    .join("\n");
  if (!design) return undefined;
  const standing = section(md, "Standing rules (binding)")
    .split("\n")
    .filter((l) => /^(1|8|9)\.\s/.test(l.trim()))
    .join("\n");
  const raw = [standing && `### Always\n\n${standing}`, design].filter(Boolean).join("\n\n");
  const { text, removed } = stripCompany(raw);
  return {
    id: "defaults",
    kind: "defaults",
    label: "Design defaults",
    description: "Spacing system, polish rules, motion and easing, and your own rules from your global CLAUDE.md.",
    bytes: Buffer.byteLength(text),
    defaultOn: true,
    removedLines: removed,
    body: text,
  };
}

function loadSkill(name: string, defaultOn: boolean): Loaded | undefined {
  const file = path.join(claudeHome(), "skills", name, "SKILL.md");
  if (!fs.existsSync(file)) return undefined;
  const md = fs.readFileSync(file, "utf8");
  const fm = md.match(/^---\n([\s\S]*?)\n---\n?/);
  const description = fm?.[1].match(/^description:\s*(.+)$/m)?.[1].replace(/^['"]|['"]$/g, "") ?? "";
  const firstSentence = description.split(/(?<=\.)\s/)[0] ?? "";
  const { text, removed } = stripCompany(fm ? md.slice(fm[0].length) : md);
  return {
    id: `skill:${name}`,
    kind: "skill",
    label: name,
    description: firstSentence.length > 160 ? `${firstSentence.slice(0, 159).trimEnd()}…` : firstSentence,
    bytes: Buffer.byteLength(text),
    defaultOn,
    removedLines: removed,
    body: text,
  };
}

function loadAll(): Loaded[] {
  const out: Loaded[] = [];
  const d = loadDefaults();
  if (d) out.push(d);
  for (const s of RULE_SKILLS) {
    const l = loadSkill(s, true);
    if (l) out.push(l);
  }
  for (const s of OPTIONAL_SKILLS) {
    const l = loadSkill(s, false);
    if (l) out.push(l);
  }
  return out;
}

export function listSources(): ContextSource[] {
  return loadAll().map((s) => ({ id: s.id, kind: s.kind, label: s.label, description: s.description, bytes: s.bytes, defaultOn: s.defaultOn, removedLines: s.removedLines }));
}

export const CONTEXT_FILE_NAME = "DESIGN-CONTEXT.md";

export interface ComposedContext {
  text: string;
  bytes: number;
  hash: string;
  ids: string[];
  removedLines: number;
}

/** Build the one file every agent receives. Unknown ids are ignored. */
export function composeContext(ids: string[]): ComposedContext | undefined {
  const wanted = new Set(ids);
  const picked = loadAll().filter((s) => wanted.has(s.id));
  if (!picked.length) return undefined;
  const parts = [
    "# Design context",
    "",
    "These are the design and engineering rules of the person who wrote this task. Every agent in this comparison received this same file. Follow them wherever they apply to the task.",
  ];
  for (const s of picked) {
    parts.push("", s.kind === "defaults" ? "## Design defaults" : `## Rule: ${s.label}`, "", s.body);
  }
  // Her own rule: no em dashes anywhere. Her skill files contain some; the file we send does not.
  const text = parts.join("\n").trim().replace(/\s*\u2014\s*/g, ", ") + "\n";
  return {
    text,
    bytes: Buffer.byteLength(text),
    hash: createHash("sha256").update(text).digest("hex").slice(0, 16),
    ids: picked.map((s) => s.id),
    removedLines: picked.reduce((n, s) => n + s.removedLines, 0),
  };
}
