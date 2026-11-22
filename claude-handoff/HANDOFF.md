# Claude account handoff

Prepared 2026-11-21 while signed in to the company account (Autumn AI). Read this first in any new session after switching to the personal account. Companion files: `APPROVALS.md` (company material and what needs Jaz's yes), `INVENTORY.md` (generated list of skills, plugins, MCP servers, memory and repos), `README.md` (the switching steps).

## 1. How this setup works

Almost all of Jaz's Claude Code context is **files on this Mac**, not tied to an account:

| Layer | Where | What it holds |
|---|---|---|
| Global instructions | `~/.claude/CLAUDE.md` | Who she is, 17 standing rules, voice split, design defaults, project map, repo rules. Loads in every session. |
| Project instructions | `CLAUDE.md` / `AGENTS.md` in each repo | Repo-specific rules (portfolio, portfolio-experiments, Fostr, SocialBricks, Agent Arena, spark). |
| Memory | `~/.claude/projects/<folder>/memory/` | One fact per file plus a `MEMORY.md` index, per project folder. Loads for sessions in that folder. |
| Skills | `~/.claude/skills/<name>/SKILL.md` | 28 local skills. Their descriptions are listed in every session. |
| Subagents | `~/.claude/agents/jaz.md`, `tailor.md` | Design engineer and resume tailor. |
| Plugins | `~/.claude/plugins` (installed from public marketplaces) | figma, vercel, swift-lsp, interfaces. |
| Settings | `~/.claude/settings.json`, `~/.claude.json` | Permissions, enabled plugins, local MCP servers (XcodeBuildMCP; figma dev mode in the portfolio). |
| Taste notes | `~/.claude/jaz-taste/` | Corrections captured by `learn-taste`. |

Things that come **from the signed-in account** are listed in section 6.

## 2. Standing rules a new session must keep

These live in `~/.claude/CLAUDE.md` and carry over on their own. The ones most often broken:

* No em dashes anywhere. Commas, full stops, middots.
* Personal work in `~/Desktop/labs` (GitHub `jazlynnkurni`); company work in `~/spark` and the `~/autumn-*` folders. Never mix.
* Never commit or push without her explicit say-so. Public redeploys need her yes first.
* Never invent her facts, numbers, dates or quotes. `jaz-applications/references/record.md` is the source of truth for her work history.
* Never type passwords or touch API keys she pastes; keys go in env by her hand.
* Headless Chrome only with its own `--user-data-dir` in the scratchpad. Downscale images to 1400px before reading. One check per build.
* Formal writing in her name loads `anthony`; anything to a company or recruiter loads `jaz-applications`; everything else `ux-writing-humanize`.
* Iteration style: five localhost prototypes, she picks, then refine from screenshots.

## 3. Projects and where each one stands

### Agent Arena (personal, active) `~/Desktop/labs/agent-arena`

**What it is.** A local Next.js 16 app that runs one coding task through several coding agents (Claude Code, Codex CLI, Cursor Agent, BLACKBOX CLI, Devin), each in its own isolated git clone of the same starting files, then compares results: live logs, diffs, file trees, screenshots, build and test results, accessibility, time, tokens and reported cost. Full detail in its `README.md` and `CLAUDE.md`.

**Why it is built this way.**
* One full clone per agent, remotes removed: agents cannot see or overwrite each other or push anywhere.
* Generated code runs only in Docker or a macOS `sandbox-exec` profile that cannot read the home folder.
* No invented numbers: cost and tokens only as agents report them; unmeasured shows `n/a`; subjective scores are her ratings, labelled.
* Claude Code runs inside the arena with `--setting-sources project --strict-mcp-config` so her personal CLAUDE.md and plugins do not skew comparisons.
* Every real run costs money, so the composer requires an explicit confirmation, and Claude must get her yes in chat first.

**Verified.** 29 unit tests, 9 Playwright tests. A real paid run of Claude Code (2.1.312) against Codex (0.171.0) on a tip calculator (`exp_20261122_71fc3e`): both succeeded, Claude Code $0.50 reported, Codex reported no cost.

**Unfinished.**
1. Cursor Agent CLI installed but its browser login never completed. She is adding `CURSOR_API_KEY` to `.env.local`. Then restart the server and run Claude Code, Codex and Cursor together on the same brief (already approved by her).
2. BLACKBOX not installed; Devin needs `DEVIN_API_KEY` and `DEVIN_ORG_ID`. Both adapters are unverified.
3. Docker not running, so evaluation uses the macOS sandbox.
4. No LLM judge yet.
5. Disabled agents in the composer are easy to miss.
6. Nothing committed (inside the labs repo, branch `tiles-lab`).

**Accounts it uses.** Codex is signed in to her **personal** ChatGPT account (gmail, free plan), not the company plan. After switching, Claude Code runs inside the arena bill the **personal** Claude account.

**Resume.** `cd ~/Desktop/labs/agent-arena && pnpm dev`, open http://localhost:6700, then read its `CLAUDE.md`.

### Everything else

Each project's own memory index (`MEMORY.md` in its memory folder) and `CLAUDE.md` hold its state. These carry over. The project map with ports is in `~/.claude/CLAUDE.md`. Uncommitted work per repo is listed in `INVENTORY.md` and by `./handoff check`.

Company projects (`~/spark`, `~/autumn-app`, `~/autumn-design`, `~/autumn-feedback`, `~/autumn-system-test`, `~/autumn-next-security`, `~/autumn-motion-studio`, `~/autumn-films`, `~/autumn-recovery`, `~/Desktop/autumn-launch-videos`) are deliberately **not** summarised here. See `APPROVALS.md`.

## 4. Skills

The full table (class, tools, packages, paths) is in `INVENTORY.md`. Groups:

* **Her UI rules** (personal): `break-never`, `chevron-swap`, `hover-only-grey`, `icon-text-line`, `no-gray-hover`, `precise-box`, `press-answers`, `rhythm-first`, `sticky-pill`, `enforce-design-system` (written for Autumn first, also covers her portfolio, SocialBricks and Clover; mixed).
* **Design system work** (generic): `build-design-system`, `design-system-boss`, `migrate-design-system`, `component-docs`, `token-mapping`, `ui-review`, `learn-taste`.
* **Motion** (generic): `gestures`, `review-animations`, `motion-prompt`, `huashu-art-motion`, `stageshow`.
* **Writing** (personal): `anthony`, `jaz-applications`, `ux-writing-humanize` (mixed: it points at skills inside `~/spark/.agents/skills`).
* **Company**: `autumngotmotion`, `creation-rules`, `react-book-sync`. Documented below; using them under the personal account needs her approval.

### autumngotmotion (company skill, needs approval to use under the personal account)

**What it does.** Autumn's motion studio: launch films, feature previews, product reels and demo videos rendered from code. One page paints any moment with `window.seek(t)`; Playwright walks time and pipes frames to ffmpeg; sound is synthesised from the same cue list. Renders are identical every run.

**Where it lives.** `~/.claude/skills/autumngotmotion/`
* `SKILL.md` the workflow and hard rules.
* `references/` motion system and tokens, sound kit, story shapes, scenarios, X trends, prompt pack, Remotion route, product motion.
* `tools/` `motion-lint.mjs` (static guard), `motion-review.mjs` (model review of one file), `qa.mjs` (film gate: dead stretches, blank flashes, palette), `autumn-motion.ts` (product motion tokens).
* `studio/` the engine copied into each film folder: `render.mjs`, `score.mjs`, `score-house.mjs`, `sfx.mjs`, `mix.sh`, `contact.sh`, `beats.py`, `lib/motion.js`, `lib/glyph.js`, `lib/wav.mjs`, `remotion/autumn-motion.ts`, `CLAUDE.md` (film folder rules), `examples/brief-to-rows/` (the gold example).

**Configuration.**
* Film folders go in `~/autumn-films/<slug>` unless she names one. Never inside `~/spark` or a personal lab.
* `studio/package.json` scripts: `stills`, `draft` (30 fps), `render` (60 fps, 4 subframes), `sound`, `mix`, `contact`.
* Headless Chrome profile via `--profile <scratchpad>/chrome-<slug>` (or `MOTION_PROFILE`).
* Film values marked PROPOSED in `lib/motion.js`, `score.mjs`, `sfx.mjs` are undecided; when she picks one, update, date and save to memory.

**Usage.** Collect once: preview or launch film, the one-line feature or story, real data, formats (16:9 then 9:16 by default), sound, a reference. Then the gated pipeline: folder, data script, shot list on the beat grid (her OK), five directions for a new kind of film (her pick), build from the gold example, stills and one critique, render and sound, `qa.mjs` with no red plus a fresh-eyes subagent review, deliver `out/final.mp4`, contact sheet and poster. Load `creation-rules` whenever product UI appears. Never publish or post.

**Dependencies.**
* Node and npm, `playwright` 1.49.1 (studio devDependency) with its Chromium, `ffmpeg` (installed via Homebrew), Python 3 with `numpy` for `beats.py`.
* Optional: Remotion for route B.
* `tools/motion-review.mjs` reads `ANTHROPIC_API_KEY` from env.
* Company inputs: the `autumn` CLI (`autumn run ... --out rows.json`, not on PATH here) or the landing sample `landing/public/sample-task.json`, and `design/system/styles.css`, both from the AutumnHQ repo.
* Sibling skills: `creation-rules`, `motion-prompt`, `huashu-art-motion`.

**Why it is company material.** It encodes Autumn's motion tokens, brand ground, glyph field and scenarios, and it needs company repos and data to run. Under the personal account it would still be listed (skills are local), so `APPROVALS.md` asks her whether to keep it active or quarantine it.

### creation-rules and react-book-sync (company)

`creation-rules` is her rulebook for the Autumn design system (autumn-system on localhost 4620, branch `jaz-design`). `react-book-sync` syncs Autumn design revisions into the Autumn React book (localhost 4630) and reads `~/autumn-app`, `~/autumn-design` and `~/autumn-system-test`. Both are only useful inside company repos.

## 5. Outstanding tasks across the setup

* Agent Arena items 1 to 6 above.
* Uncommitted work exists in most repos (see `INVENTORY.md`). Nothing is lost by switching accounts, but company repos should be committed or stashed under company rules before she stops using the company account.
* Decisions in `APPROVALS.md`.

## 6. What carries over when the account changes

**Carries over automatically (local files):** `~/.claude/CLAUDE.md`, every project `CLAUDE.md`, all project memory, the 28 local skills, the `jaz` and `tailor` subagents, installed plugins, `settings.json`, local MCP servers, taste notes, past session transcripts on disk, every repo and `.env` file, and logins for other tools (Codex, Cursor CLI, gh, Vercel CLI).

**Does not carry over (belongs to the account):**
* Org-synced skills in `~/.claude/skills/synced/<org>` (docs, docx, pdf, pptx, xlsx, google-workspace, deep-research, morning, skill-creator and the browser skills) and org-synced plugins. The personal account syncs its own set, which may differ.
* Org-managed settings and limits (`remote-settings.json`, `policy-limits.json`).
* claude.ai connectors: Google Drive, Docs, Sheets, Meetings, Claude Docs, and the Figma and Vercel sign-ins. Reconnect what you need.
* Artifacts, conversations and anything else stored on claude.ai under the company account.
* Billing, usage limits and the data policy that applies to new sessions: from the switch on, the personal account's settings govern what is sent.
* Desktop app session list: sessions started under the company account may not be listed under the personal one, but their transcripts stay on disk.

## 7. Resuming in a fresh session

1. `~/Desktop/labs/claude-handoff/handoff init ~/Desktop/labs/agent-arena --launch` starts Claude Code there with the resume prompt.
2. Or start a session anywhere and paste the prompt that `./handoff init` prints.
3. The new session should read this file, `APPROVALS.md`, `INVENTORY.md` and the project's `CLAUDE.md`, then report where things stand before doing anything.
