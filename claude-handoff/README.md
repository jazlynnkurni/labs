# Claude account handoff kit

Moves Jaz's working context from the company Claude account to the personal one without losing anything and without carrying company material across by accident. Nothing here switches accounts or changes the current setup on its own.

| File | What it is |
|---|---|
| `HANDOFF.md` | What exists, why, what is unfinished, how to resume. Read first after switching. |
| `APPROVALS.md` | Every piece of company material found, and the decision each one needs. |
| `INVENTORY.md` | Generated list of skills, plugins, MCP servers, memory folders and repos. `./handoff inventory` rebuilds it. |
| `handoff.config.json` | What counts as company (org, GitHub orgs, paths, skills). Edit to change the rules. |
| `handoff` | The script. |

## Commands

```bash
cd ~/Desktop/labs/claude-handoff
./handoff                     # check: is everything ready? Changes nothing.
./handoff inventory           # rebuild INVENTORY.md
./handoff quarantine          # list company skills and notes that load in every session (dry run)
./handoff quarantine --apply  # move them to ~/.claude/handoff-quarantine/<time>/
./handoff restore --apply     # put the newest quarantine back
./handoff init                # after switching: confirm the account, check, print the resume prompt
./handoff init ~/Desktop/labs/agent-arena --launch   # same, then start Claude Code there with that prompt
```

## Before switching

1. Answer the decisions in `APPROVALS.md` (mostly: quarantine the company skills or not).
2. Commit or stash company work that needs sharing, while still on the company account.
3. `./handoff inventory`, then `./handoff`. Fix anything marked **fix**.
4. If you chose to quarantine: `./handoff quarantine --apply`.

## Switch

Sign out of Claude Code and sign in with the personal account: in a terminal `claude auth logout` then `claude auth login`, or use the desktop app's account menu. `claude auth status` shows which organisation is active.

## After switching

1. `./handoff init ~/Desktop/labs/agent-arena --launch` (or without `--launch` to just print the first message to paste).
2. Reconnect the claude.ai connectors you use (Google Drive, Docs, Sheets, Figma, Vercel) in the personal account.
3. Check which account-synced skills the personal account provides; `./handoff inventory` lists them.

## Going back to the company account

Sign back in with the company account and run `./handoff restore --apply` if you quarantined anything.
