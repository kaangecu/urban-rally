# Urban Rally

Mobile-first scavenger-hunt PWA for student organisations: teams join with an access code, follow a Leaflet map, and complete photo, video and quiz tasks. React 19 + Vite 7 + TypeScript + Tailwind 4 + Zustand, on Firebase (anonymous auth, Firestore, Storage). Node 22 (see `.nvmrc`).

## Commands

- `npm run dev`: start the app locally
- `npm run lint`: ESLint
- `npm run type-check`: TypeScript, no output files
- `npm run test:run`: Vitest, single run
- `npm run build`: type-check and production build
- `npm run check`: all of the above in one go. CI runs the same command
- `npm run test:rules`: Firestore and Storage rules tests against the emulators (needs Java)

## Layout

- `src/features/`: one folder per feature (`auth`, `map`, `submissions`, `tasks`)
- `src/services/`: Firebase reads and writes
- `src/store/`: Zustand stores
- `src/components/`, `src/hooks/`, `src/utils/`, `src/types/`: shared code
- `firestore.rules`, `storage.rules`: security rules (human-reviewed only)
- `scripts/`: one-off data and setup scripts

## UI work

- Load the `ui` skill (`.claude/skills/ui/SKILL.md`) before changing anything visible.
- Tokens live in `src/index.css` (`@theme`) and `src/utils/theme.ts`. Reuse the existing `glass-*` and `neon-*` classes and `themeClasses` before writing new styles.
- No new raw palette classes (`bg-gray-500`), hex values or arbitrary `[...]` classes in new code.
- Touch targets at least 44px; text at least 14px; inputs 16px.
- Every screen needs its empty, loading and error states, a 390px phone layout, and both the light and cyberpunk themes.
- Check UI changes with a 390×844 screenshot and the `ui-reviewer` subagent (at most 2 rounds). Its review is advice, not a gate.
- Never run `--update-snapshots` unless I ask.

## Rules

- Before saying a task is done, run `npm run check` and show the output. If you touched `firestore.rules` or `storage.rules`, also run `npm run test:rules`.
- Change or delete tests only when I explicitly ask. If a task seems to require it, stop and say so
- Make the smallest change that solves the task. No speculative features, abstractions or refactors (YAGNI).
- No new or upgraded dependencies without asking first.
- Edit files in place. Never create `.enhanced`, `.new` or `v2` copies.
- No new docs or status reports unless asked.
- Ignore `docs/archive/`: old notes that are outdated and contradict the code.
- Never deploy, migrate, or touch the real Firebase project. Use the emulators.
- Never read or print `.env` files or credentials.
