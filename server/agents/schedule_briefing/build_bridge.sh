#!/bin/zsh
set -euo pipefail

script_dir=${0:A:h}
app_dir="$script_dir/bin/JARVIS Schedule Briefing.app"
executable="$app_dir/Contents/MacOS/calendar_bridge"

mkdir -p "$app_dir/Contents/MacOS"
mkdir -p "$script_dir/.build/module-cache"

clang -O2 -fobjc-arc -fblocks \
  -fmodules-cache-path="$script_dir/.build/module-cache" \
  -framework Foundation \
  -framework EventKit \
  "$script_dir/bridge/CalendarBridge.m" \
  -Wl,-sectcreate,__TEXT,__info_plist,"$script_dir/bridge/Info.plist" \
  -o "$executable"

cp "$script_dir/bridge/Info.plist" "$app_dir/Contents/Info.plist"
codesign --force --deep --sign - "$app_dir"

echo "Built $app_dir"
