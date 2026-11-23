# RobP (aka Robert Pattinson)

Reads your X For You feed and a few design engineers' profiles (config.json `people`) every two hours, picks out design engineering tips, finds matching skills on skills.sh and vets each one (no scripts, nothing that runs commands or phones home, nothing that contradicts your rules or taste). Good ones are staged, not installed.

Every new post is screened by Jev first (one request each: is it a concrete design engineering tip, and what kind), and only posts that pass go to Claude, which writes the tip and checks it against your taste. The Jev key is read from the `JEV_` lines of Agent Arena's `.env.local` (`config.json` `jev.envFile`). With no key, or if Jev fails, Claude reads every post as before.

It also watches how you design: your messages in Claude Code sessions and your commits in `designRepos`. It keeps a running taste profile in `data/taste.md` (seeded from the jaz agent's "Her taste") and uses it to judge tips and to suggest skills that fit your habits, plus skills you could write yourself.

At 22:30 it opens the day's digest and asks which staged skills are good. Each yes is installed globally for Claude Code and added to `~/.claude/agents/jaz.md` under "From X, passed on by RobP" (jaz.md is backed up to `data/backups/` first). Each no is dropped. "Later" keeps them for tomorrow.

## Start

    ./setup.sh

Chrome opens on X. Sign in yourself; the window closes once your feed shows. Then the schedule loads.

## Commands

    npm run scout          one pass now
    npm run digest         digest and the yes/no now
    node robp.mjs review   just the yes/no
    node robp.mjs observe  update the taste profile now
    ./setup.sh --unload    turn RobP off

Logs: `data/logs/`. Digests: `data/digests/`. `profile/` holds your X session cookies and is gitignored, as is `data/`.
