# Urban Rally

Mobile-first scavenger-hunt PWA for student organisations: teams join with an access code, follow a Leaflet map, and complete photo, video and quiz tasks. React 19 + Vite 7 + TypeScript + Tailwind 4 + Zustand, on Firebase (anonymous auth, Firestore, Storage). Node 22 (see `.nvmrc`).

## Commands

- `npm run dev`: start the app locally
- `npm run lint`: ESLint
- `npm run type-check`: TypeScript, no output files
- `npm run test:run`: Vitest, single run
- `npm run build`: type-check and production build

Known state (Oct 2026): build, lint and tests are red. Making them green is the current job. Don't treat existing failures as caused by your change, but don't add new ones.

## Layout

- `src/features/`: one folder per feature (`auth`, `map`, `submissions`, `tasks`)
- `src/services/`: Firebase reads and writes
- `src/store/`: Zustand stores
- `src/components/`, `src/hooks/`, `src/utils/`, `src/types/`: shared code
- `firestore.rules`, `storage.rules`: security rules (human-reviewed only)
- `scripts/`: one-off data and setup scripts

## Rules

- Before saying a task is done, run lint, type-check and tests, and show the output.
- Change or delete tests only when I explicitly ask. If a task seems to require it, stop and say so
- Make the smallest change that solves the task. No speculative features, abstractions or refactors (YAGNI).
- No new or upgraded dependencies without asking first.
- Edit files in place. Never create `.enhanced`, `.new` or `v2` copies.
- No new docs or status reports unless asked.
- Ignore `docs/` and the root `*_SUMMARY.md`, `CHECKLIST.md` files: they are outdated and contradict the code.
- Never deploy, migrate, or touch the real Firebase project. Use the emulators.
- Never read or print `.env` files or credentials.
