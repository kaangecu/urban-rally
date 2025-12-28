# UrbanRally AI Agent Instructions

## Project Overview
Multi-tenant, offline-first PWA for GPS-based scavenger hunts. Built with React 19 + TypeScript, Firebase (Auth, Firestore, Functions), and Leaflet maps. Designed for student organizations like ESN with strict data isolation between tenants.

## Critical Architecture Patterns

### 1. Multi-Tenant Data Isolation
**Every Firestore operation MUST include `tenantId` filtering**. This is the #1 security requirement.

```typescript
// ✅ CORRECT: Always filter by tenantId
const q = query(
  collection(db, 'teams'),
  where('tenantId', '==', tenantId),
  where('eventId', '==', eventId)
);

// ❌ WRONG: Missing tenantId filter (security violation)
const q = query(collection(db, 'teams'), where('eventId', '==', eventId));
```

**Why:** Users from different organizations must never see each other's data. Firestore rules enforce this at `firestore.rules`, but client code must also filter correctly.

### 2. Firebase Emulator Initialization Order (CRITICAL)
**Emulator connection MUST happen BEFORE persistence configuration**. Common source of `auth/emulator-config-failed` errors on page refresh.

```typescript
// ✅ CORRECT ORDER in firebase.service.ts:
app = initializeApp(firebaseConfig);
auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099'); // ← FIRST
await setPersistence(auth, browserLocalPersistence); // ← THEN
```

See `docs/FIREBASE_EMULATOR_INITIALIZATION_FIX.md` for detailed explanation.

### 3. Auth State Machine (Profile-First Flow)
Authentication uses a 5-state machine to prevent race conditions:
- `idle` - No operation in progress
- `creating` - User creation (skip onAuthStateChanged listener)
- `restoring` - Session restoration in progress
- `authenticated` - User ready
- `error` - Auth failure

**Pattern:** `AuthContext.tsx` manages state transitions. When creating users, set state to `'creating'` to prevent auth listener from firing prematurely.

```typescript
// In useProfileGuard.ts - skip check during creation
if (authState === 'creating') return;
```

### 4. Cloud Functions Pattern (Admin SDK)
Use Cloud Functions to bypass client-side security rules for privileged operations:

```typescript
// functions/src/index.ts
import {Timestamp, FieldValue} from "firebase-admin/firestore"; // ← Import directly

export const createUserDocument = onCall({cors: true}, async (request) => {
  const {data, auth} = request;
  if (!auth) throw new HttpsError("unauthenticated", "...");
  
  // Use Admin SDK to write without permission errors
  await db.collection("users").doc(auth.uid).set({...});
});
```

**Critical:** Import `Timestamp` and `FieldValue` from `firebase-admin/firestore` (NOT from `admin.firestore.*`).

### 5. Defensive Array Handling
Many Firestore fields (e.g., `team.completedTaskIds`) may be undefined or non-arrays. Always use defensive checks:

```typescript
// ✅ CORRECT
const completed = Array.isArray(team?.completedTaskIds) ? team.completedTaskIds : [];
if (completed.includes(taskId)) { /* ... */ }

// ❌ WRONG (crashes if undefined)
if (team.completedTaskIds.includes(taskId)) { /* ... */ }
```

See `docs/COMPLETEDTASKIDS_FIX.md` for comprehensive list of fixed locations.

## Development Workflow

### Starting Development
```bash
# Terminal 1: Start Firebase Emulators
firebase emulators:start

# Terminal 2: Start Vite dev server  
npm run dev

# Terminal 3 (one-time): Seed emulator with test data
npm run seed:emulator
```

**Emulator Ports:**
- Auth: `http://127.0.0.1:9099`
- Firestore: `http://127.0.0.1:8080`
- Functions: `http://127.0.0.1:5001`
- Emulator UI: `http://127.0.0.1:4000`

### Rebuilding Cloud Functions
After modifying `functions/src/index.ts`:
```bash
cd functions && npx tsc
# Emulators auto-reload the changes
```

### Common npm Scripts
- `npm run dev` - Start Vite dev server
- `npm run seed:emulator` - Populate emulator with test data
- `npm run type-check` - Check TypeScript without building
- `npm test` - Run Vitest unit tests
- `npm run test:e2e` - Run Playwright E2E tests

## Key Service Patterns

### Date Serialization (Client → Cloud Function → Firestore)
JavaScript Date objects don't serialize over `httpsCallable()`. Use ISO strings:

```typescript
// Client (user.service.ts):
const consentData = {
  termsAcceptedAt: new Date().toISOString(), // ← Convert to string
};
await createUserDocument({consentGiven: consentData});

// Cloud Function (functions/src/index.ts):
const consentData = {
  termsAcceptedAt: Timestamp.fromDate(new Date(consentGiven.termsAcceptedAt)), // ← Parse back
};
```

### Zustand State Management
Three main stores in `src/store/`:
- `authStore.ts` - User, team, tenant state (persisted to localStorage)
- `taskStore.ts` - Selected task, task list
- `mapStore.ts` - Map viewport, user location

**Pattern:** Use selective subscriptions to prevent unnecessary re-renders:
```typescript
// ✅ CORRECT: Only subscribe to needed fields
const team = useAuthStore(state => state.team);

// ❌ WRONG: Subscribes to entire store
const { team, user, tenant } = useAuthStore();
```

### Real-Time Sync Hook
`useTeamSync.ts` listens to Firestore team document changes. Used in Dashboard to update UI when tasks complete:

```typescript
// Dashboard.tsx
useTeamSync(); // Sets up onSnapshot listener
```

## File Structure Conventions

```
src/
├── components/       # Reusable UI (buttons, modals, cards)
├── features/         # Feature-specific components
│   ├── auth/         # Login, profile modals
│   ├── tasks/        # Task list, task cards, submissions
│   ├── teams/        # Team browser, team detail
│   └── map/          # Leaflet map, markers
├── services/         # Firebase operations (CRUD functions)
│   ├── firebase.service.ts   # Init & config
│   ├── user.service.ts       # User CRUD
│   ├── team.service.ts       # Team CRUD
│   └── teamMember.service.ts # Join/leave operations
├── hooks/            # Custom React hooks
├── store/            # Zustand stores
├── types/            # TypeScript interfaces (schema.ts)
├── utils/            # Helpers (validation, formatting)
└── contexts/         # React contexts (AuthContext)

functions/src/
└── index.ts          # Cloud Functions (createUserDocument, joinTeamSecure)
```

## Testing Patterns

### Unit Tests (Vitest)
Located in `src/__tests__/`. Use MSW for API mocking:

```typescript
import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

test('displays team name', () => {
  render(<TeamCard team={mockTeam} />);
  expect(screen.getByText('City Explorers')).toBeInTheDocument();
});
```

### E2E Tests (Playwright)
Run against emulators. Start emulators before running tests:
```bash
firebase emulators:start &
npm run test:e2e
```

## Common Pitfalls & Solutions

### 1. "Permission Denied" Errors
**Cause:** Client trying to write without proper auth or violating security rules.  
**Solution:** Use Cloud Functions for privileged operations (see `createUserDocument`, `joinTeamSecure` in `functions/src/index.ts`).

### 2. "Cannot read properties of undefined (reading 'includes')"
**Cause:** Firestore field not initialized as array.  
**Solution:** Add defensive checks (see pattern #5 above). Reference: `docs/COMPLETEDTASKIDS_FIX.md`

### 3. CORS Errors with Cloud Functions
**Cause:** Missing `{cors: true}` in function options.  
**Solution:** Always use `onCall({cors: true}, ...)` for callable functions.

### 4. Emulator Connection Failures After Refresh
**Cause:** Auth emulator connected after persistence set.  
**Solution:** See pattern #2 above. Reference: `docs/FIREBASE_EMULATOR_INITIALIZATION_FIX.md`

## Multi-Event Architecture (v2.0)
Users can participate in multiple events across multiple tenants:
- `User` documents: One per Firebase Auth UID, contains `accountType` ('anonymous' or 'linked')
- `TeamMember` documents: One per team membership, links User → Team → Event
- Use `getUserTeamInEvent(userId, eventId)` to check participation

## Documentation Index
Critical docs in `docs/`:
- `PROFILE_FIRST_IMPLEMENTATION.md` - User onboarding flow
- `FIREBASE_EMULATOR_INITIALIZATION_FIX.md` - Emulator setup order
- `COMPLETEDTASKIDS_FIX.md` - Array safety patterns
- `USER_CREATION_DATE_FIX.md` - Date serialization in Cloud Functions
- `EMULATOR_SEED_GUIDE.md` - Test data seeding

## TypeScript Schema
All entities extend `MultiTenantEntity` (see `src/types/schema.ts`):
```typescript
interface MultiTenantEntity {
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Key Types

**User (Unified Schema - Jan 2025)**
All users (players AND admins) use the unified `User` interface:
```typescript
interface User extends MultiTenantEntity {
  id: string;
  email: string;                    // REQUIRED (was optional)
  displayName: string;
  photoURL?: string;                // Renamed from profilePhotoUrl
  accountType: 'anonymous' | 'linked';  // REQUIRED
  role: 'player' | 'moderator' | 'organizer' | 'admin' | 'superadmin'; // NEW
  
  // Admin fields (optional)
  managedTenantIds?: string[];
  isActive?: boolean;
  
  // Player fields (all users - admins can play!)
  totalScore: number;
  totalSubmissions: number;
  eventsParticipated: number;
  consentGiven: { ... };
}
```

**IMPORTANT:**
- ✅ Single `User` type for ALL users (admins can play events!)
- ✅ Firebase Custom Claims = authoritative role (security rules check this)
- ✅ Firestore `role` field = query/display optimization
- ❌ `UserProfile` interface REMOVED (merged into User)
- ❌ `linkedAccountId` field REMOVED (deprecated)
- See: `docs/UNIFIED_USER_REFACTORING_COMPLETE.md`

**Other Key Types:** `Tenant`, `Event`, `Team`, `TeamMember`, `Task`, `Submission`

## Environment Variables
Required in `.env`:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_USE_EMULATOR=true  # Enable emulators in dev
```

## When Making Changes
1. **Adding new Firestore collection:** Update `firestore.rules` with security rules
2. **Modifying Cloud Function:** Run `cd functions && npx tsc` to rebuild
3. **Changing schema:** Update `src/types/schema.ts` TypeScript interfaces
4. **New multi-tenant entity:** Add `tenantId` field + validation in security rules
5. **Date handling:** Use ISO strings for transport, convert to Firestore Timestamp server-side
