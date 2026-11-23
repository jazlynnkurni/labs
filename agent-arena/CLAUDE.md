# Agent Arena

Personal project (Jaz's labs, not company work). A local Next.js app that runs one coding task through several coding agents, each in its own isolated git clone of the same starting files, then compares the results side by side. Local only: nothing is ever pushed, published or deployed from here.

@AGENTS.md

Read `README.md` for the full architecture, agent guide and security model. This file is the short version plus current state.

## Run it

```bash
pnpm dev              # http://localhost:6700
pnpm dev:fixtures     # same, plus the scripted fixture (a fake, free agent for testing the pipeline)
pnpm test             # Vitest, 51 tests
pnpm build && pnpm test:e2e   # Playwright, 9 tests on port 6710 with a temp data dir
pnpm lint && pnpm typecheck
```

Run data lives in `~/.agent-arena` (SQLite `arena.sqlite`, workspaces, artifacts, `trash/`), never in this repo.

## Map

* `lib/agents/` one adapter per agent behind `AgentAdapter` (`types.ts`); register in `registry.ts`.
* `lib/orchestration/` frozen brief and hash, runner (jobs, concurrency, cancel, diff capture), SSE bus.
* `lib/sandbox/` git workspaces, process groups, env allowlist and redaction, Docker and macOS `sandbox-exec` runners, previews.
* `lib/evaluation/` project detection, Playwright plus axe inspection, metric catalog, `compare.ts` (pure).
* `lib/storage/` async `Db` interface over `node:sqlite`, repositories, migrations in `db.ts`.
* `app/` pages (composer, experiment, history, settings) and API routes; `proxy.ts` guards the API to localhost and same origin.

## Rules that are easy to break

* Next 16 with Cache Components on: route handlers go through `handler()` in `lib/server/api.ts` (calls `connection()`); anything reading the URL sits inside `<Suspense>`. Read `node_modules/next/dist/docs/` before using a Next API.
* Never invent numbers. Cost and tokens are only what an agent reports; unmeasured is `n/a`, never zero. Subjective scores are labelled as Jaz's ratings. Differences below display precision are ties (`sameValue` in `lib/evaluation/catalog.ts`).
* Input tokens mean all prompt tokens, cache included, for every agent.
* Every real agent run costs money: get Jaz's explicit yes in chat before starting one. Use the scripted fixture for testing.
* Generated code only runs in a sandbox runner. Never add a plain host runner.
* Credentials stay in env or CLI logins. Never print, log or store them; `.env.local` is Jaz's to edit.
* House rules from the global CLAUDE.md apply: no em dashes, `&apos;` in JSX, no commits or pushes without her say-so.

* Design context (`lib/context/design-context.ts`): one identical file built from Jaz's ~/.claude design defaults and chosen rule skills, company lines stripped. On by default in the composer. Keep it identical across agents.

## State (2026-11-21)

Done and verified:
* Directions layer (2026-11-23): "Continue directions" on any finished run starts a new experiment of 5 runs by the same agent and model from that run's result (`continueDirections` in runner.ts, `lib/directions/`). On it, "Let Jev handle" asks Jev one `choice` over the directions (RobP's client `lib/qa/jev.ts`, stored in `decisions`), and "Grill me" is a docked chat on Claude Code (Read, Glob, Grep only, cwd = the workspaces) built on her grill-me skill plus her jaz-agent notes (`/grilling` is not installed). Fixture experiments get labelled canned answers. Verified with fixtures only; no real run, Jev call or Grill reply yet.

* Full app: composer (several models per agent), live run view, diffs, file tree, screenshots, live preview, evaluation, dashboard with leaders, trade-offs, head to head, ratings, history, agent settings.
* Claude Code 2.1.312, Codex CLI 0.171.0 and Cursor Agent 2026.11.22 verified with real paid runs (`exp_20261122_71fc3e` two agents, `exp_20261122_b2785c` all three, same tip calculator brief). Codex is signed in to Jaz's personal ChatGPT account (free plan), not the company plan. Cursor is signed in through `agent login` (model "Auto"); it reports no tokens or cost.

Open:
1. Done: the three-agent run. `.env.local` exists with an empty `CURSOR_API_KEY=` line; not needed while the browser login holds.
2. BLACKBOX not installed: on 2026-11-21 every official install route returned 404 (`blackbox.ai/install.sh` fetches from `releases.blackbox.ai/api/v0/latest`, which 404s; `@blackbox/cli` is not on npm). Jaz approved installing it once the official route works; do not use look-alike npm packages. After install she runs `blackbox configure` herself. Devin needs `DEVIN_API_KEY` and `DEVIN_ORG_ID`. Both adapters are written from docs and unverified.
3. Docker is not running, so evaluation uses the macOS sandbox.
4. No LLM judge yet (the `llm` metric source exists for it).
5. Disabled agents in the composer are easy to miss (Jaz asked where Devin and BLACKBOX were). Possible follow-up: a clearer "Set up" affordance.
6. Nothing is committed. The folder sits inside the labs repo (branch `tiles-lab`).
