# Urban Rally

A mobile-first scavenger-hunt web app for student organisations. Teams join with an access code, follow a map, and complete photo, video and quiz tasks at locations around the city.

Built with React 19, Vite 7, TypeScript, Tailwind 4, Zustand and Leaflet, on Firebase (anonymous auth, Firestore, Storage).

## Status

Work in progress. The Firestore and Storage security rules were locked down, so the client can no longer write team logins or scores directly. Joining with a code and scoring stay broken until that logic moves into Cloud Functions.

## Getting started

You need Node 22 (see `.nvmrc`) and, for the emulators, Java 21.

```sh
npm ci && npm ci --prefix functions
cp .env.example .env   # fill in your Firebase web app config
npm run dev
```

To play locally without a real project, set `VITE_USE_EMULATOR=true` in `.env`, run `npm run emulators` in a second terminal and `npm run seed:emulator` in a third. The app then uses the emulators as the `demo-urban-rally` project, and the seed script prints a join link per team.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run check` | Lint, type-check, tests and production build. CI runs the same command |
| `npm run test:rules` | Rules and Cloud Functions tests against the emulators |
| `npm run emulators` | Start the Auth, Functions, Firestore and Storage emulators |
| `npm run seed:emulator` | Reset the emulators to one playable game and print the join links |

## Project layout

- `src/features/`: one folder per feature (`auth`, `map`, `submissions`, `tasks`)
- `src/services/`: Firebase reads and writes
- `src/store/`: Zustand stores
- `firestore.rules`, `storage.rules`: security rules, tested in `tests/rules/`
- `scripts/`: seed scripts, using the Firebase Admin SDK
- `docs/archive/`: old notes, kept for history. They no longer match the code

## Repository settings

Branch protection for `main` lives in `.github/rulesets/main.json`: pull requests only, no force pushes or deletion, and every CI check must pass. To apply it to a new repository, run this once with the [GitHub CLI](https://cli.github.com/) as a repo admin:

```sh
gh api --method POST repos/OWNER/REPO/rulesets --input .github/rulesets/main.json
```

Running it again creates a second ruleset. To change an existing one, use `--method PUT repos/OWNER/REPO/rulesets/RULESET_ID` instead.
