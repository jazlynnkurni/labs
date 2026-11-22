# Company material and what needs approval

Rule for any session under the personal account: **do not open, read, run or summarise anything in this list unless Jaz approves that specific item in chat.** Company means AutumnHQ (Claude org "Autumn AI") and spark-glasses (Eden). Edit `handoff.config.json` if that definition changes.

Nothing here has been moved, deleted or changed. Each item says what happens if you do nothing.

## Needs a decision

| # | Item | Where | Why it matters | If you do nothing | Suggested |
|---|---|---|---|---|---|
| 1 | Company skills `autumngotmotion`, `creation-rules`, `react-book-sync` | `~/.claude/skills/` | Skills are local, so they stay listed in every personal session and can be loaded. They hold Autumn's motion tokens, design-system rules and repo paths. | Still active under the personal account. | `./handoff quarantine --apply` before switching; `./handoff restore --apply` when you go back. |
| 2 | Taste notes `memory-spark.md`, `spark-chat.md`, `autumn-portfolio.md` | `~/.claude/jaz-taste/` | Captured from company sessions; `learn-taste` can read them. | Readable by personal sessions. | Quarantined together with item 1. |
| 3 | Company lines in the global CLAUDE.md: the "Company (`~/spark`)" project-map entry, the `spark:` repo rule, and the Eden and Clover mentions in your bio and brand palettes | `~/.claude/CLAUDE.md` | This file is sent with every session. These lines name company repos and products but contain no code or internal detail. | Sent with every personal session. | Probably fine to keep (names only). Your call. |
| 4 | Skills that mention company work: `enforce-design-system` (Autumn listed first), `ux-writing-humanize` (points at `~/spark/.agents/skills`) | `~/.claude/skills/` | Mostly your own rules; the company parts are references. | Active. | Keep. If a session follows the `~/spark` path, that is a company read and needs approval. |
| 5 | Personal-project memories that mention company names | `~/.claude/projects/-Users-jazlynnkurniandra-Desktop-labs/memory/` (for example `doordash-clover-deck.md`, `mobile-experience-wip.md`, `workspace-split.md`) and two in portfolio-experiments | They load in labs and portfolio sessions. Some are case-study and interview work about company products. | Load as now. | Skim them; delete or trim any line you would not want under the personal account. |
| 6 | Agent Arena | `~/Desktop/labs/agent-arena` | Built while signed in to the company account, but it is personal work in your labs and contains no company code. Its first paid Claude Code run went through the company subscription ($0.50 at list price). | Treated as personal. | Confirm it is personal. |

## Off limits unless approved (no action needed now)

| Item | Where | Note |
|---|---|---|
| Company repositories | `~/spark` (spark-glasses), `~/autumn-app`, `~/autumn-design`, `~/autumn-feedback`, `~/autumn-system-test`, `~/autumn-next-security` (AutumnHQ), `~/autumn-motion-studio`, `~/autumn-films`, `~/autumn-recovery`, `~/Desktop/autumn-launch-videos` | Opening a session in any of these under the personal account sends company code to that account. `./handoff init` refuses to launch in them. |
| Company project memory | `~/.claude/projects/-Users-jazlynnkurniandra-spark` (96 memories), `...-autumn-app` (6), and four Claude desktop scratch sessions from the Autumn AI org (69 together) | Only load for sessions in those folders. Leave untouched. |
| Company session transcripts | `.jsonl` files in those project folders, plus `~/.claude/history.jsonl` | Not loaded automatically. Do not resume or search company sessions from the personal account. |
| claude.ai artifacts, Docs and connectors from the company account | claude.ai | Stay with the company account. Do not re-create them under the personal one. |
| Company keys | any `.env` in company repos, `ANTHROPIC_API_KEY` used by `autumngotmotion/tools/motion-review.mjs` | Never copy into personal projects. |

## Before you stop using the company account

* Uncommitted work: `~/spark` (11 files on `jaz/hud-display`), `~/autumn-app` (15 on `reviewdoc`), `~/autumn-design` (3), `~/autumn-system-test` (19), `~/autumn-motion-studio` (19, no commits yet). Commit, push or stash these under company rules while still on the company account if they need to be shared. Switching Claude accounts does not touch them either way.

## Not company (no approval needed)

Codex CLI is signed in to your personal ChatGPT account (gmail, free plan). Cursor CLI will use whatever key you add. Your portfolio, labs, Fostr, SocialBricks and humor-class repos are personal.
