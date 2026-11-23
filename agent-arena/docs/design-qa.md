# Design QA with Jev

A proof of concept on one component, the Button. Read this before adding a second.

## How it works

```
brief + rules + notes ──► POST /api/qa
                              │
                  1. extract  │  headless Chromium, throwaway profile, the fixture at /qa/fixture/button
                              │  boxes at rest, hover, press; label boxes; computed type and motion;
                              │  a 40px hit probe; keyboard focus; axe-core on the fixture only; a screenshot
                              ▼
                  2. code     │  12 deterministic checks in lib/qa/criteria.ts, free and repeatable
                              ▼
                  3. Jev      │  4 judgment questions, one batched request, cached by state and question,
                              │  asked only when there is evidence and a key (server side only)
                              ▼
                  4. save     │  a JSON run in ~/.agent-arena/qa/runs, outside the repo
                              ▼
   /qa dashboard ◄────────────┘  findings, evidence, your verdict, agreement, revision status
        │
        └─ "Propose a fix" ──► claude -p with Read, Grep and Glob only, no MCP, a $0.50 cap
                                 returns a diff as text; nothing is applied. You apply it in your
                                 usual Claude Code or Cursor session, mark it applied, and rerun.
```

Every criterion ends as **Passed**, **Needs review** (the rule is broken, or Jev is unsure) or **Not enough
evidence** (a measurement is missing, Jev has no key, or Jev was not asked).

| Where | What |
| --- | --- |
| `lib/qa/criteria.ts` | The predefined criteria, each naming its rule, and the Jev thresholds |
| `lib/qa/extract.ts` | Playwright extraction |
| `lib/qa/jev.ts` | The Jev client: `POST {JEV_API_BASE_URL}/v1/systemone`, 8 questions and 32 KiB per request, cache |
| `lib/qa/evaluate.ts` | One run: extract, check, ask, save |
| `lib/qa/propose.ts` | Read-only Claude Code proposals |
| `app/api/qa/**`, `app/qa/**`, `components/qa/qa-view.tsx` | API, fixture and dashboard |
| `.claude/skills/jev-agent`, `.agents/skills/jev-agent` | The Jev Agent Skill (jev-ai/jev-agent-skill), read in full before install |
| `tests/unit/qa.test.ts` | Checks, answer mapping and the cache |

## Which checks go where

Code takes anything measurable: the label never moving, weight on hover, `transition: all`, the curve and
250ms, a visible press, the 40px hit area, one-line labels, keyboard focus, axe-core, sentence case and dashes,
names on icon-only buttons. Jev takes only what code cannot decide: whether the variant hierarchy reads clearly
(noul), how strongly the destructive variant signals loss (score), whether the labels say what happens
(choice), and whether the family fits the brief (noul).

## Limitations

- **Jev sees text, not pixels.** It judges the measured colours, sizes and labels it is given, not the
  screenshot. A hierarchy judgment from RGB values is weaker than a person looking. (Jev has an experimental
  image question type, `box`, for locating things; it is not used here.)
- **Thresholds are guesses until compared.** Noul passes at 0.8, a score needs confidence 0.6. The Jev
  documentation is explicit that confidence is not the chance of being right. Mark your own verdicts on the
  dashboard for a few runs and tune from the "Jev vs you" count before trusting it on more components.
- **The fixture is not the app.** It measures the component in isolation, at one viewport, in the light theme
  the page loads in. Real call sites can override classes (most icon buttons in the arena pass their own
  colours), so a fixture finding is about the component's defaults.
- **One component, one viewport.** Dark mode, touch (44px) and other widths are not measured yet.
- **Hover and press are simulated** with the mouse in a headless browser; the check waits 450ms for
  transitions, so a longer animation would be measured mid-flight.
- **Proposals are suggestions.** Claude Code reads the code but cannot run it, so a diff is unverified until
  you apply it and rerun QA.
- **Provider.** The skill and this client use thejevai.com, a hosted wrapper around TypeSafe's Jev. TypeSafe's
  model is also documented on AI/ML API at a different endpoint. If you switch, only `JEV_API_BASE_URL` and the
  path in `lib/qa/jev.ts` change.

## Costs

- **Code checks:** free. A run takes about 16s, almost all of it the headless browser.
- **Jev:** one request per run for the four questions, and none on a rerun with the same state and
  questions (cached). The documented examples show 1 credit per request; thejevai.com does not publish a
  price per credit, so check your account's pricing page before running this in a loop.
- **Claude Code proposals:** only when you press "Propose a fix", capped at $0.50 each by
  `--max-budget-usd`, and the reported cost is shown on the finding. On a Claude subscription this is the
  CLI's own estimate, not a bill.

## How it fits your workflow

It sits after a build and before review, the same place as the arena's own evaluation. Your coding agents keep
working as they do; QA never edits files, never commits, and only proposes. Run it after a change to the Button,
read the review items, ask for a proposal where you want one, apply it in your normal session, rerun, and mark
your own verdicts so the agreement numbers mean something.

## Before expanding

1. Put `JEV_API_KEY` in `.env.local` yourself and run QA a few times; mark your verdicts on every row.
2. Look at "Jev vs you". Tune the thresholds in `criteria.ts`, or move a question to code if it turns out
   measurable.
3. Only then add a second component: a fixture page under `app/qa/fixture/`, its criteria next to the
   Button's, and a component switch on the dashboard.
