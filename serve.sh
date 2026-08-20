#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
PORT="${PORT:-8765}"
if command -v python3 >/dev/null 2>&1; then
  python3 ./refresh-games.py
fi
echo "DorukStation PS4 Web v0.25"
echo "Open: http://127.0.0.1:${PORT}"
python3 -m http.server "$PORT" --bind 127.0.0.1
