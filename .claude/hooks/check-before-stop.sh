#!/usr/bin/env bash
# Stop hook: Claude can't finish while npm run check is red.
# - Skips the check when nothing changed since the last commit (plain Q&A).
# - If npm itself is missing, that's your setup, not Claude's code:
#   warn you (exit 1, non-blocking) instead of trapping Claude in a loop.
# - Blocks at most 3 times in a row per session, then lets Claude stop
#   and tells you the check is still red.
input=$(cat)
session=$(printf '%s' "$input" | sed -n 's/.*"session_id" *: *"\([^"]*\)".*/\1/p')
counter="${TMPDIR:-/tmp}/claude-stop-hook-${session:-default}"

cd "$CLAUDE_PROJECT_DIR" || exit 0
if ! command -v npm >/dev/null 2>&1; then
  echo "Stop hook skipped: npm not found on PATH." >&2
  exit 1
fi
if git diff --quiet HEAD && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  rm -f "$counter"
  exit 0
fi
if out=$(npm run check 2>&1); then
  rm -f "$counter"
  exit 0
fi

tries=$(( $(cat "$counter" 2>/dev/null || echo 0) + 1 ))
echo "$tries" > "$counter"
if [ "$tries" -gt 3 ]; then
  rm -f "$counter"
  echo "npm run check is still red after 3 attempts. Stopping so you can take a look." >&2
  exit 1
fi
echo "npm run check failed (attempt $tries of 3). Fix it before you finish:" >&2
echo "$out" | tail -40 >&2
exit 2
