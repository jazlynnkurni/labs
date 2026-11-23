#!/bin/zsh
# launchd entry point for RobP. Gives node, npx and claude a PATH and logs each run.
export PATH="/usr/local/bin:$HOME/.local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
cd "${0:A:h}"
mkdir -p data/logs
node robp.mjs "$@" >> "data/logs/$(date +%F).log" 2>&1
