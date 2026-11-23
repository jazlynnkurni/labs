#!/bin/zsh
# One-time setup for RobP: you sign in to X yourself, then the schedule is loaded.
#   ./setup.sh            sign in and schedule
#   ./setup.sh --unload   stop the schedule
set -e
DIR="${0:A:h}"
AGENTS="$HOME/Library/LaunchAgents"
SCOUT="com.jaz.robp.scout"
DIGEST="com.jaz.robp.digest"

if [[ "$1" == "--unload" ]]; then
  launchctl bootout "gui/$(id -u)/$SCOUT" 2>/dev/null || true
  launchctl bootout "gui/$(id -u)/$DIGEST" 2>/dev/null || true
  rm -f "$AGENTS/$SCOUT.plist" "$AGENTS/$DIGEST.plist"
  echo "RobP is off."
  exit 0
fi

cd "$DIR"
[[ -d node_modules ]] || npm install --silent
node robp.mjs login

HOURS=$(node -e 'const c=require("./config.json");console.log(c.scoutHours.map(h=>`<dict><key>Hour</key><integer>${h}</integer><key>Minute</key><integer>0</integer></dict>`).join(""))')
DH=$(node -e 'console.log(require("./config.json").digestTime.hour)')
DM=$(node -e 'console.log(require("./config.json").digestTime.minute)')

mkdir -p "$AGENTS"
cat > "$AGENTS/$SCOUT.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$SCOUT</string>
  <key>ProgramArguments</key><array><string>$DIR/run.sh</string><string>scout</string></array>
  <key>StartCalendarInterval</key><array>$HOURS</array>
</dict></plist>
PLIST
cat > "$AGENTS/$DIGEST.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$DIGEST</string>
  <key>ProgramArguments</key><array><string>$DIR/run.sh</string><string>digest</string></array>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>$DH</integer><key>Minute</key><integer>$DM</integer></dict>
</dict></plist>
PLIST

for L in $SCOUT $DIGEST; do
  launchctl bootout "gui/$(id -u)/$L" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$AGENTS/$L.plist"
done
echo "RobP is on: reads X at $(node -e 'console.log(require("./config.json").scoutHours.join(", "))'):00, asks you at $DH:$(printf %02d $DM)."
