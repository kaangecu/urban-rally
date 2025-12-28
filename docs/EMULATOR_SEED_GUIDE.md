# Firebase Emulator Seed Script Guide

## Overview

The `seed-emulator.ts` script populates your local Firebase emulator with comprehensive test data for development and testing. This eliminates the need to manually create data through the UI.

## What Gets Created

The script creates a complete test environment:

### 📁 **Collections & Data**

1. **Tenants** (2 organizations)
   - ESN Berlin
   - ESN Munich

2. **Events** (2 active scavenger hunts)
   - Berlin Winter Hunt 2025 (Code: `BERLIN25`)
   - Munich Christmas Rally 2025 (Code: `MUNICH25`)

3. **Users** (5 test players)
   - Alice Anderson (linked account, Berlin)
   - Bob Builder (anonymous, Berlin)
   - Charlie Chen (linked account, Berlin)
   - Diana Davis (linked account, Munich)
   - Emma Evans (anonymous, Munich)

4. **Teams** (3 teams)
   - City Explorers (Berlin, 3 members)
   - Berlin Adventurers (Berlin, 1 member)
   - Bavarian Hunters (Munich, 2 members)

5. **TeamMembers** (6 relationships)
   - Links users to teams with roles and scores

6. **Tasks** (7 challenges)
   - Photo tasks (Brandenburg Gate, TV Tower, Marienplatz)
   - Quiz tasks (Berlin history, Munich culture)
   - Location tasks (Reichstag, Nymphenburg Palace)

7. **Submissions** (5 completed tasks)
   - Mix of approved and pending submissions

---

## Prerequisites

### 1. Firebase Emulators Running

Start the emulators first:

```bash
# Make sure you're in the project root
cd /Users/kaangecu/Desktop/personal/urban-rally

# Start emulators (in a separate terminal)
firebase emulators:start
```

**Wait for this message:**
```
✔  All emulators ready! It is now safe to connect your app.
```

### 2. Environment Setup

The script connects to the emulator at:
- **Host:** `127.0.0.1`
- **Port:** `8080` (Firestore Emulator)

These are hardcoded in the script and match your `firebase.json` configuration.

---

## Usage

### Basic Usage

```bash
# Run from project root
npm run seed:emulator
```

### Expected Output

```
🌱 Starting Firebase Emulator Seed Script

============================================================
Project ID: urban-rally-539bd
Emulator: 127.0.0.1:8080
============================================================

📝 Seeding tenants...
✅ Created 2 tenants

📝 Seeding events...
✅ Created 2 events

📝 Seeding users...
✅ Created 5 users

📝 Seeding teams...
✅ Created 3 teams

📝 Seeding teamMembers...
✅ Created 6 teamMembers

📝 Seeding tasks...
✅ Created 7 tasks

📝 Seeding submissions...
✅ Created 5 submissions

============================================================
✅ SEED COMPLETED SUCCESSFULLY!

📊 Summary:
   • 2 tenants
   • 2 events
   • 5 users
   • 3 teams
   • 6 team members
   • 7 tasks
   • 5 submissions

🎮 Ready for testing!
   • Emulator UI: http://127.0.0.1:4000
   • Your App: http://localhost:5173
============================================================
```

---

## Test Scenarios

### Scenario 1: Multi-User Team (City Explorers)

**Team:** City Explorers  
**Event:** Berlin Winter Hunt 2025  
**Members:**
- Alice (Owner, 450 points)
- Bob (Member, 320 points)
- Charlie (Member, 280 points)

**Test Cases:**
- ✅ View team members list
- ✅ See different scores per member
- ✅ Owner has special permissions
- ✅ Members can contribute independently

### Scenario 2: Solo Team (Berlin Adventurers)

**Team:** Berlin Adventurers  
**Event:** Berlin Winter Hunt 2025  
**Members:**
- Bob (Owner, 320 points)

**Test Cases:**
- ✅ Single-player team works
- ✅ User can be in multiple teams (Bob is in both teams)
- ✅ Scores tracked separately per team

### Scenario 3: Multi-Tenant Setup

**Berlin:**
- 1 event, 2 teams, 3 users

**Munich:**
- 1 event, 1 team, 2 users

**Test Cases:**
- ✅ Data isolation between tenants
- ✅ Different events per tenant
- ✅ Users scoped to their tenant

### Scenario 4: Task Types

**Photo Tasks:**
- Brandenburg Gate (100 pts, easy)
- TV Tower Challenge (200 pts, hard)
- Marienplatz Market (100 pts, easy)

**Quiz Tasks:**
- Berlin History (50 pts, easy)
- Munich Culture (50 pts, easy)

**Location Tasks:**
- Reichstag Visit (150 pts, medium)
- Nymphenburg Palace (150 pts, medium)

**Test Cases:**
- ✅ Different task types render correctly
- ✅ Points awarded correctly
- ✅ Difficulty levels displayed

### Scenario 5: Submission States

**Submissions Created:**
- 3 approved (points awarded)
- 2 pending (no points yet)

**Test Cases:**
- ✅ Approved submissions show in team score
- ✅ Pending submissions don't affect score
- ✅ Submission history visible per user

---

## Accessing Test Data

### Via Emulator UI

1. Open: http://127.0.0.1:4000
2. Click "Firestore" in the left menu
3. Browse collections:
   - `tenants` → See organizations
   - `events` → See active hunts
   - `users` → See player profiles
   - `teams` → See team details
   - `teamMembers` → See membership relationships
   - `tasks` → See challenges
   - `submissions` → See completed tasks

### Via Your App

1. Start dev server: `npm run dev`
2. Open: http://localhost:5173
3. Use test access codes:
   - `BER-EXP-001` → City Explorers (3 members)
   - `BER-ADV-002` → Berlin Adventurers (1 member)
   - `MUN-BAV-001` → Bavarian Hunters (2 members)

### Via Event Codes

Join events using:
- `BERLIN25` → Berlin Winter Hunt 2025
- `MUNICH25` → Munich Christmas Rally 2025

---

## Resetting Data

The emulator data is **ephemeral** - it's lost when you stop the emulator.

### Quick Reset

```bash
# Stop emulators
Ctrl+C

# Start emulators again
firebase emulators:start

# Re-seed data
npm run seed:emulator
```

### Keep Data Between Sessions

Add the `--export-on-exit` flag:

```bash
# Export data on shutdown
firebase emulators:start --export-on-exit=./emulator-data

# Import data on startup
firebase emulators:start --import=./emulator-data
```

---

## Customizing Test Data

### Edit the Script

Open `scripts/seed-emulator.ts` and modify:

```typescript
// Add more users
const USERS: SeedUser[] = [
  {
    id: 'user-frank',
    tenantId: 'esn-berlin',
    displayName: 'Frank Foster',
    // ... more fields
  },
  // ... existing users
];

// Add more teams
const TEAMS: SeedTeam[] = [
  {
    id: 'team-newteam',
    teamName: 'New Team',
    // ... more fields
  },
  // ... existing teams
];
```

### Re-run After Changes

```bash
npm run seed:emulator
```

The script uses **batched writes**, so it's safe to run multiple times (will overwrite existing data).

---

## Troubleshooting

### ❌ "Connection refused" Error

**Problem:** Emulators not running

**Solution:**
```bash
# Start emulators first
firebase emulators:start

# Then in another terminal
npm run seed:emulator
```

### ❌ "Document already exists" Error

**Problem:** Data already seeded

**Solution:**  
This shouldn't happen (script uses `set()` not `add()`), but if it does:
```bash
# Restart emulators to clear data
Ctrl+C
firebase emulators:start
npm run seed:emulator
```

### ❌ TypeScript Compilation Error

**Problem:** Missing dependencies

**Solution:**
```bash
npm install tsx --save-dev
```

### ⚠️ "Outdated firebase-functions" Warning

**Problem:** Functions package needs update

**Solution:**
```bash
cd functions
npm install --save firebase-functions@latest
cd ..
```

---

## Integration with Development Workflow

### Recommended Workflow

1. **Start Emulators**
   ```bash
   firebase emulators:start
   ```

2. **Seed Test Data** (first time only)
   ```bash
   npm run seed:emulator
   ```

3. **Start Dev Server**
   ```bash
   npm run dev
   ```

4. **Develop & Test**
   - Changes to frontend: Auto-reload via Vite
   - Changes to functions: Auto-reload via emulator
   - Data persists during development session

5. **Reset If Needed**
   - Stop emulators (Ctrl+C)
   - Restart and re-seed

---

## Next Steps

After seeding:

1. **Test Team Members Feature**
   ```
   http://localhost:5173
   → Join team with: BER-EXP-001
   → View team members list
   → See multiple members with scores
   ```

2. **Test Cloud Functions**
   - `getTeamMembersSecure` should work without CORS errors
   - Check emulator terminal for function logs

3. **View Emulator UI**
   ```
   http://127.0.0.1:4000
   → See all data in Firestore tab
   → Monitor function calls in Functions tab
   ```

4. **Test Multi-Event Scenarios**
   - Join multiple teams with same user
   - Switch between events
   - Verify data isolation

---

## Additional Resources

- **Firebase Emulator Docs:** https://firebase.google.com/docs/emulator-suite
- **Emulator UI Guide:** `docs/FIREBASE_EMULATOR_SETUP.md`
- **Schema Reference:** `src/types/schema.ts`
- **Main Seed Script:** `scripts/seed-emulator.ts`

---

## Summary

✅ **Quick Start:**
```bash
firebase emulators:start    # Terminal 1
npm run seed:emulator       # Terminal 2 (once)
npm run dev                 # Terminal 3
```

🎮 **Test with:**
- Event codes: `BERLIN25`, `MUNICH25`
- Team codes: `BER-EXP-001`, `BER-ADV-002`, `MUN-BAV-001`
- Emulator UI: http://127.0.0.1:4000
- Your app: http://localhost:5173

🔄 **Reset:**
```bash
Ctrl+C (stop emulators)
firebase emulators:start
npm run seed:emulator
```

Happy testing! 🚀
