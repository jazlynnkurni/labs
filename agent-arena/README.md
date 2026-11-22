# Agent Arena

Run one coding task through several coding agents, each in its own isolated copy of the same starting files, then compare what they built side by side: logs, diffs, file trees, screenshots, build and test results, accessibility, time, tokens and cost.

Local only. Nothing is pushed, published or deployed.

## Quick start

```bash
pnpm install
npx playwright install chromium
cp .env.example .env.local   # optional, only for API keys and overrides
pnpm dev                     # http://localhost:6700
```

`pnpm dev:fixtures` also shows the **scripted fixture**, a development-only stand-in that writes a canned page so you can exercise the whole pipeline without paying for a run. It is labelled as "not an AI" everywhere it appears, and its results mean nothing.

Requirements: macOS or Linux, Node 22.5+ (uses the built-in `node:sqlite`), git, pnpm. Docker is optional (see Evaluation runners).

## What happens when you press Run

1. **Freeze.** The prompt, shared constraints and attachment list become one brief. The brief, config and starting commit are hashed. Every agent receives the brief byte for byte.
2. **Snapshot.** The starting point is cloned once into `<data>/experiments/<id>/source`: either an empty repo, or `HEAD` of a local repository you pick (read only; uncommitted changes are excluded and the exclusion is recorded).
3. **Isolate.** Each agent gets its **own full git clone** of the snapshot in `<data>/experiments/<id>/workspaces/<run>`. Separate `.git` directories mean no shared refs, index or worktree list, and every clone has its remote removed, so nothing can be pushed. Attachments are copied into `.arena/attachments/`, which is excluded from diffs.
4. **Run.** Agents run concurrently (or one after another). Each runs in its own process group with only its own credentials in the environment. Progress streams to the browser over Server-Sent Events and is stored in SQLite, so a reload replays everything.
5. **Capture.** Whatever the agent left (commits, edits, untracked files) is frozen as one commit in its private repo and saved as a patch, even after a failure or timeout.
6. **Evaluate.** Install, typecheck, lint, build, test, serve, screenshot and audit each result inside a sandbox runner.
7. **Compare.** Dashboard with sortable metrics, per-criterion leaders, trade-offs, head to head, your ratings and full reports.

Every difference that could affect fairness (cloud vs local agents, which agents enforce the budget cap, default models, partial automation, sequential runs, excluded uncommitted changes) is listed on the experiment page.

## Agents

| Agent | How it runs | Automation | Progress | Tokens | Cost | Budget cap |
|---|---|---|---|---|---|---|
| Claude Code | `claude -p --output-format stream-json` locally | Full | Live | Reported | Reported (`total_cost_usd`, Claude Code's own estimate) | `--max-budget-usd` |
| Codex CLI | `codex exec --json --sandbox workspace-write` locally | Full | Live | Reported | Not reported | Time limit only |
| Cursor Agent | `agent -p --force --output-format stream-json` locally | Full | Live | Not documented | Not reported | Time limit only |
| BLACKBOX CLI | `blackbox run <brief file>` locally | Partial | Plain text | Not documented | Not reported | Time limit only |
| Devin | v3 REST API, Cognition's cloud | Partial | Polled every 10 s | n/a | ACUs, plus USD if `on_demand_usage` is returned | Time limit only |

Facts were taken from each vendor's official docs on 2026-11-21. Where the docs were silent, the adapter says so in its limitations instead of guessing.

### Install and sign in

Each agent card in **Agents** (Settings) shows install state, auth state, version, capabilities, setup commands and limitations. **Test connection** never spends tokens: it runs local status commands or a read-only API call.

**Claude Code**
```bash
curl -fsSL https://claude.ai/install.sh | bash
claude auth login            # or ANTHROPIC_API_KEY in .env.local
claude auth status
```
Runs with `--permission-mode acceptEdits --permission-prompts none`, Claude Code's own OS sandbox for Bash (`sandbox.enabled`, `autoAllowBashIfSandboxed`), `--setting-sources project` and `--strict-mcp-config`, so your personal settings, hooks, plugins, MCP servers and user CLAUDE.md do not leak into the comparison. The repository's own CLAUDE.md still applies, as it would for any agent reading the repo.

**Codex CLI**
```bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
codex login                  # or CODEX_API_KEY in .env.local
codex login status
```
Runs under `--sandbox workspace-write`: writes are confined to the workspace and network is off by default, so installs inside the run may fail. Your `~/.codex` config and any global AGENTS.md still apply.

**Cursor Agent CLI**
```bash
curl https://cursor.com/install -fsS | bash
agent login                  # or CURSOR_API_KEY in .env.local
agent status
```
Runs with `--force --trust`, so shell commands run without prompts with your user's permissions inside the workspace. Cursor documents no OS sandbox for them. A team admin can disable headless mode.

**BLACKBOX CLI** (partially automated)
```bash
curl -fsSL https://blackbox.ai/install.sh | bash
blackbox configure           # API key and model
blackbox --help              # check what your version supports
```
The only documented non-interactive entry point is `blackbox run <instructions-file>`. Output format, approvals and auth status are undocumented, so output is kept as plain text and, if the CLI stops to wait for input, the run hits the time limit and offers a **manual patch import**.

**Devin** (partially automated)
1. Create a service user API key in Devin.
2. Add `DEVIN_API_KEY` and `DEVIN_ORG_ID` to `.env.local` and restart.
3. To start Devin from a repository, connect it through Devin's Git integration and name it (`owner/repo`) in the composer.

Devin works in its own cloud machine and cannot see the local snapshot. The adapter asks Devin not to open a PR or push, and to return its full unified diff in `structured_output`. That diff is applied to Devin's local workspace so it is evaluated exactly like the others. If no usable diff comes back, the run waits for a manual patch import. The messages pagination parameter name is not spelled out in the docs; the adapter de-duplicates by event id so a wrong guess cannot double-print.

### Manual fallback for any agent

Every partially automated run (and any run that ends in **Needs import**) has **Import a result by hand** in its Summary tab. Paste a unified diff; it is applied to that agent's own workspace, captured, evaluated, and marked as a manual import in the run's conditions.

## Design context

By default every agent receives the same `DESIGN-CONTEXT.md`, assembled when the run starts from your own Claude setup: the Design defaults section (plus standing rules 1, 8 and 9) of `~/.claude/CLAUDE.md` and the UI rule skills you tick in the composer. It is copied into each workspace under `.arena/attachments/` (excluded from diffs), uploaded to Devin like any attachment, and named in the brief. Lines that mention company work (Autumn, spark, Clover, Eden, RayNeo) are removed first, and em dashes are turned into commas. The composer's preview shows the exact file; the experiment records its sources, size and hash. Turn it off to compare agents on the brief alone. Code: `lib/context/design-context.ts`.

## Evaluation

Objective, automated measurements only. Anything that could not be measured is shown as `n/a`, never as zero or a failure.

| Area | Measured |
|---|---|
| Functionality | install, build, tests passed and failed (vitest, jest, node:test, mocha and Playwright output), pass rate, runtime console and page errors, failed requests, axe-core violations, preview reachable |
| Engineering | `tsc --noEmit` errors, lint, explicit `any`, test files, dependencies added, leftover `console.log`, largest file, files and lines changed |
| Design (objective part) | horizontal overflow at 390 px, load time, matching 1440×900 and 390×844 screenshots |
| Efficiency | wall time, tokens and cost exactly as the agent reported them, Devin ACUs, retries |

Subjective design and code quality are **your ratings** (1 to 5, nine dimensions), stored with the experiment and labelled as opinions wherever they appear. There is no LLM judge in this version; the evaluation schema already distinguishes `llm` as a source so one can be added and labelled without mixing it with measurements.

The summary only uses the criteria you pick. It names the leader per criterion, lists trade-offs between every pair, reports missing measurements, and ranks by average position across the picked criteria. Differences smaller than the displayed precision (100 ms, a tenth of a cent) are treated as ties. It never declares an overall winner on criteria you did not choose.

### Evaluation runners

Generated code is untrusted. It never runs with plain host access.

* **Docker** (preferred when Docker Desktop is running): each step runs in a throwaway `node:24-bookworm-slim` container that mounts only the workspace, with memory, CPU and process limits and `no-new-privileges`.
* **macOS sandbox** (`sandbox-exec`): writes are confined to the workspace; every read under your home folder is refused except the workspace itself; the environment is empty apart from `PATH` and a fake `HOME` inside the workspace. Network stays on so installs work. Covered by `tests/unit/sandbox.test.ts`.

Static output (an `index.html`, `dist/`, `build/`) is served by the arena itself and executes nothing. If an app's own `dev` or `start` script does not answer on the `PORT` it is given within 30 seconds and static files exist, the arena serves those instead and records why on the Preview metric. Live previews bind to `127.0.0.1`, stop after 30 minutes and render in an iframe with an opaque origin.

Agents themselves run with your user account (they need your CLI logins). Claude Code and Codex apply their own sandboxes; Cursor and BLACKBOX do not document one. This is listed in each agent's limitations.

## Security model

* Credentials are read from your shell, CLI logins or `.env.local` on the server only. Each agent process receives a short allowlist of harmless variables plus only the credential variables that adapter declares. Logs are redacted for credential values and common token shapes before they are stored or shown.
* The API answers only on `localhost`, and refuses any state-changing request whose `Origin` is not the app itself, so a generated app in a preview cannot start paid runs (`proxy.ts`).
* Starting a run requires an explicit confirmation listing each agent and whether it can be billed.
* Removing an experiment moves its folder to `<data>/trash` instead of deleting it.
* All run data lives in `~/.agent-arena` (or `ARENA_DATA_DIR`), outside this repository, so agents never touch the orchestrator's source.

## Architecture

```
app/                     Next.js App Router pages and API routes
  api/experiments        create (multipart), list, detail, cancel, SSE events
  api/runs/[id]          cancel, diff, file, rating, import, evaluate, preview
  api/agents             status and free connection tests
components/              composer, experiment workspace, dashboard, history, settings
lib/agents/              one adapter per agent behind AgentAdapter (types.ts)
lib/orchestration/       brief freezing, runner (jobs, concurrency, cancel), event bus
lib/sandbox/             git workspaces, process groups, env allowlist, runners, previews
lib/evaluation/          project detection, browser inspection, metric catalog, comparison
lib/storage/             SQLite through a small async Db interface, repositories, paths
tests/unit               Vitest: isolation, orchestration, sandbox, evaluation, comparison
tests/e2e                Playwright: full UI flow, origin guard, a11y and overflow checks
```

* **Adapters** implement `detect`, `testConnection` and `run(ctx)` and emit normalised events (`status`, `message`, `tool`, `log`, `usage`, `link`). To add an agent, write an adapter and list it in `lib/agents/registry.ts`.
* **Jobs** are in-process with state persisted to SQLite. On boot, anything left running by a previous server is marked interrupted. Every child runs in its own process group and is killed on cancel, timeout or server exit.
* **Storage** goes through a four-method async `Db` interface. SQL sticks to syntax PostgreSQL also accepts (`ON CONFLICT` upserts, JSON as text, ISO dates), so a Postgres driver only needs to implement that interface and translate `?` placeholders.

### Data layout

```
~/.agent-arena/
  arena.sqlite                          experiments, runs, events, artifacts, metrics, ratings, jobs
  experiments/<id>/brief.md             the frozen brief
  experiments/<id>/config.json          config, source commit and hash
  experiments/<id>/source/              snapshot every agent cloned from
  experiments/<id>/attachments/
  experiments/<id>/workspaces/<run>/    each agent's private repository
  experiments/<id>/artifacts/<run>/     transcript, changes.patch, screens/, evaluation.json
  trash/
```

## Tests

```bash
pnpm test         # 29 unit and integration tests (Vitest)
pnpm build && pnpm test:e2e   # 9 Playwright tests on a production build, desktop and mobile
pnpm lint && pnpm typecheck
```

The end-to-end tests start their own server on port 6710 with a temporary data folder and use only the scripted fixture, so they never spend money or touch your history.

## Known limitations

* Claude Code (2.1.312), Codex CLI (0.171.0) and Cursor Agent (2026.11.22) have been verified end to end with real paid runs. The BLACKBOX and Devin adapters follow their official docs but have not yet run against the real tools. Expect small parsing fixes on first contact.
* Input tokens are normalised to all prompt tokens including cache reads and writes (Claude Code reports cache traffic separately; Codex includes it), so the two compare like for like.
* Cost is only ever what an agent reports. Codex, Cursor and BLACKBOX report none, and the arena does not estimate prices.
* Claude Code's `total_cost_usd` is its own client-side estimate; on a subscription login it reflects list price, not your bill.
* The budget cap is enforced only by Claude Code. Others are limited by time.
* Devin starts from a remote repository or from nothing, never from the local snapshot.
* Agents themselves run under your user account; only Claude Code and Codex sandbox their own commands.
* The macOS sandbox runner leaves network access on.
* The Next build prints file-tracing warnings about dynamic filesystem paths. They only matter for deploying, which this app is not meant for.
