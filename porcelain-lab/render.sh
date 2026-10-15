#!/bin/zsh
# render.sh [--quick] [scene]   renders every scene (or one) into renders/
# --quick: 600x900 at 48 samples, a minute each on Apple silicon
set -e
cd "$(dirname "$0")"
B=${BLENDER:-$(command -v blender || echo /Applications/Blender.app/Contents/MacOS/Blender)}
[ -x "$B" ] || { echo "no blender found; brew install --cask blender, or set BLENDER=/path/to/Blender"; exit 1; }
QUICK=""; [ "$1" = "--quick" ] && { QUICK="--quick"; shift; }
if [ -n "$1" ]; then scenes=(scenes/$1*.py); else scenes=(scenes/0*.py); fi
for s in $scenes; do
  echo "== $s"
  "$B" -b -noaudio -P "$s" -- $QUICK 2>&1 | grep -E "rendered|Error|Traceback|line [0-9]+" || true
done
ls -la renders/
