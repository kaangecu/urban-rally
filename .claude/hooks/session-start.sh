#!/usr/bin/env bash
# SessionStart hook: cloud sessions start from a fresh clone, so install
# dependencies there so npm run check works. Does nothing on your laptop.
[ "$CLAUDE_CODE_REMOTE" = "true" ] || exit 0
cd "$CLAUDE_PROJECT_DIR" || exit 0
[ -d node_modules ] && exit 0
npm ci --no-audit --no-fund >&2
