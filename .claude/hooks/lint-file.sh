#!/usr/bin/env bash
# PostToolUse hook: after Claude edits a file, lint just that file.
# Exit 2 sends the errors back to Claude so it fixes them right away.
if ! command -v node >/dev/null 2>&1; then
  echo "Lint hook skipped: node not found on PATH." >&2
  exit 1
fi
file=$(node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).tool_input?.file_path ?? ""))')
case "$file" in
  *.ts|*.tsx|*.js|*.jsx) ;;
  *) exit 0 ;;
esac
cd "$CLAUDE_PROJECT_DIR" || exit 0
if ! out=$(npx --no-install eslint "$file" 2>&1); then
  echo "$out" >&2
  exit 2
fi
