#!/bin/bash
# Patrick Star Toolbox launcher — serves the Desktop locally so tool links work in any browser (incl. Chrome).
cd "$(dirname "$0")/.." || exit 1      # -> ~/Desktop (parent of the toolbox folder)
PORT=8765
# reuse a running server if present, else start one in the background
if ! curl -s "http://localhost:$PORT/" >/dev/null 2>&1; then
  (python3 -m http.server $PORT >/dev/null 2>&1 &)
  sleep 1
fi
open "http://localhost:$PORT/Patrick%20Star%20Toolbox/index.html"
