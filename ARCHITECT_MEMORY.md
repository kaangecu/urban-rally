# ARCHITECT_MEMORY.md
# Urban Rally - React Architecture Blueprint

> **Last Updated:** December 27, 2025  
> **Purpose:** Comprehensive architecture reference for AI agents and developers

---

## Phase 1: Tech Stack Fingerprint

### Build Tool & Framework
| Category | Technology | Version |
|----------|------------|---------|
| **Build Tool** | Vite | ^7.2.4 |
| **Framework** | React | ^19.2.0 |
| **Language** | TypeScript | ~5.9.3 |
| **Module System** | ES Modules | Native |

### UI & Styling
| Category | Technology | Version |
|----------|------------|---------|
| **CSS Framework** | Tailwind CSS | ^4.1.17 |
| **Component Library** | Custom components (no MUI/Chakra) | - |
| **Animation** | Framer Motion | ^12.23.25 |
| **Icons** | Lucide React | ^0.555.0 |
| **Maps** | Leaflet + React-Leaflet | ^1.9.4 / ^5.0.0 |

### State Management
| Category | Technology | Version | Usage |
|----------|------------|---------|-------|
| **Global State** | Zustand | ^5.0.9 | Primary state manager |
| **Auth State** | React Context | Native | Auth lifecycle only |
| **Server State** | Custom hooks + Firestore | - | Real-time subscriptions |

### Firebase SDK (Modular v9+)
| Category | Version | Mode |
|----------|---------|------|
| **Firebase SDK** | ^12.6.0 | Modular (tree-shakeable) |
| **Firebase Admin** | ^13.6.0 | Cloud Functions only |
| **Auth Method** | Anonymous + Linkable | - |

### Routing
| Category | Technology | Version |
|----------|------------|---------|
| **Router** | React Router DOM | ^7.10.1 |
| **Pattern** | File-based pages + Feature folders | - |

---

## Phase 2: Firebase Integration Analysis

### Initialization File
**Location:** `src/services/firebase.service.ts`

### Connection Pattern: Hybrid (Client + Cloud Functions)

```
┌─────────────────────────────────────────────────────────────────┐
│                     FIREBASE ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────────┐       ┌──────────────────┐                    │
│   │   React     │       │  Cloud Functions │                    │
│   │ Components  │       │   (Admin SDK)    │                    │
│   └──────┬──────┘       └────────┬─────────┘                    │
│          │                       │                               │
│          ▼                       ▼                               │
│   ┌─────────────────────────────────────────┐                   │
│   │         /src/services/*.ts              │                   │
│   │   (Service Layer - All DB Operations)   │                   │
│   └──────────────────┬──────────────────────┘                   │
│                      │                                           │
│          ┌───────────┼───────────┐                              │
│          ▼           ▼           ▼                              │
│   ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│   │ Firestore│ │   Auth   │ │ Storage  │                       │
│   │  (DB)    │ │(Anonymous)│ │ (Files)  │                       │
│   └──────────┘ └──────────┘ └──────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Emulator Configuration (CRITICAL ORDER)
```typescript
// MUST follow this exact sequence:
1. initializeApp(firebaseConfig)
2. getAuth(app)
3. connectAuthEmulator(auth, ...)  // ← BEFORE persistence
4. setPersistence(auth, ...)       // ← AFTER emulator
5. getFirestore/Storage/Functions
6. connectFirestoreEmulator/FunctionsEmulator
7. enableIndexedDbPersistence(db)
```

### Cloud Functions Usage
| Function | Purpose | Why Cloud Function? |
|----------|---------|---------------------|
| `createUserDocument` | Create user profile | Bypasses security rules during anonymous auth |
| `joinTeamSecure` | Add user to team | Atomic multi-document writes |

---

## Phase 3: Component Pattern Scan

### Folder Structure: **Feature-Based + Atomic Hybrid**

```
src/
├── components/          # Shared/Atomic components
│   ├── ErrorBoundary.tsx
│   ├── ErrorState.tsx
│   ├── LoadingSpinner.tsx
│   ├── auth/            # Auth-specific shared components
│   │   ├── IdentityUplinkModal.tsx
│   │   ├── LoginPage.tsx
│   │   └── RecoveryCodeLogin.tsx
│   ├── events/          # Event-related shared components
│   ├── legal/           # Legal/GDPR modals
│   ├── navigation/      # Nav components (BottomNav, etc.)
│   └── team/            # Team-related shared components
│
├── features/            # Feature modules (domain-specific)
│   ├── auth/            # Login flows
│   │   ├── LoginMethodSelector.tsx
│   │   └── EventCodeEntry.tsx
│   ├── leaderboard/     # Leaderboard feature
│   ├── map/             # Leaflet map feature
│   │   └── GameMap.tsx
│   ├── submissions/     # Task submission handling
│   ├── tasks/           # Task management
│   │   ├── TaskCard.tsx
│   │   ├── TaskDetail.tsx
│   │   └── TaskList.tsx
│   ├── team/            # Team management
│   │   └── TeamMembersTab.tsx
│   └── teams/           # Team browsing
│       ├── TeamBrowser.tsx
│       ├── TeamCard.tsx
│       └── TeamDetailModal.tsx
│
├── pages/               # Route entry points
│   ├── AccountSettings.tsx
│   ├── Dashboard.tsx
│   └── EventSelector.tsx
│
├── services/            # Firebase operations (THE DATA LAYER)
├── store/               # Zustand stores
├── hooks/               # Custom React hooks
├── contexts/            # React Context providers
├── types/               # TypeScript interfaces
└── utils/               # Helper functions
```

### Component Naming Convention
- **PascalCase** for component files and exports
- Feature components in `features/{feature}/`
- Shared/reusable components in `components/`
- Pages (route entry points) in `pages/`

---

## Phase 4: Routing & Data Flow

### Route Configuration (`AppRoutes.tsx`)

```typescript
// Route Structure
/                                    → LoginMethodSelector (public)
/join/event                          → EventCodeEntry (public)
/join/team                           → LoginPage (public)
/tenant/:tenantId/event/:eventId/teams → TeamBrowser (semi-public)
/events                              → EventSelector (protected)
/settings                            → AccountSettings (protected)
/tenant/:tenantId/event/:eventId/dashboard → Dashboard (protected)
```

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW DIAGRAM                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐     ┌─────────────────┐     ┌─────────────────┐  │
│  │   Firebase   │────▶│   AuthContext   │────▶│   AuthStore     │  │
│  │   Auth       │     │  (State Machine)│     │   (Zustand)     │  │
│  └──────────────┘     └─────────────────┘     └────────┬────────┘  │
│                                                         │           │
│  ┌──────────────┐     ┌─────────────────┐              │           │
│  │  Firestore   │────▶│  useTeamSync    │──────────────┤           │
│  │  onSnapshot  │     │   (Real-time)   │              │           │
│  └──────────────┘     └─────────────────┘              │           │
│                                                         ▼           │
│                                              ┌─────────────────┐    │
│                                              │    Components   │    │
│                                              │  (UI Consumers) │    │
│                                              └─────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Real-Time Subscription Pattern
**Custom `onSnapshot` Hooks** (NOT react-firebase-hooks library)

```typescript
// Pattern: Custom hooks wrapping Firestore onSnapshot
// Location: src/hooks/useTeamSync.ts

useEffect(() => {
  const unsubscribe = onSnapshot(
    doc(db, 'teams', team.id),
    (snapshot) => {
      const updatedTeam = snapshot.data() as Team;
      setTeam(updatedTeam);  // Updates Zustand store
    }
  );
  return () => unsubscribe();
}, [team?.id]);
```

---

## Global State Strategy

### 1. Zustand Stores (Primary)

| Store | File | Purpose | Persistence |
|-------|------|---------|-------------|
| `authStore` | `store/authStore.ts` | User, Team, Tenant, Auth state | localStorage |
| `taskStore` | `store/taskStore.ts` | Tasks, Selected task, Filters | None |
| `mapStore` | `store/mapStore.ts` | Map center, zoom, user location | None |

### 2. React Context (Auth Lifecycle Only)

| Context | File | Purpose |
|---------|------|---------|
| `AuthContext` | `contexts/AuthContext.tsx` | Auth state machine (idle/creating/restoring/authenticated/error) |

### 3. Selective Subscription Pattern (CRITICAL)

```typescript
// ✅ CORRECT: Subscribe to specific fields only
const team = useAuthStore(state => state.team);
const isAuthenticated = useAuthStore(state => state.isAuthenticated);

// ❌ WRONG: Causes unnecessary re-renders
const { team, user, tenant, isAuthenticated } = useAuthStore();
```

---

## The 'Firebase Contract'

### Rule 1: ALL Database Operations Go Through `/services`
```
❌ NEVER: Direct Firestore calls in components
✅ ALWAYS: Import from src/services/*.service.ts
```

### Rule 2: Multi-Tenant Isolation (MANDATORY)
```typescript
// EVERY Firestore query MUST include tenantId
const q = query(
  collection(db, 'teams'),
  where('tenantId', '==', tenantId),  // ← REQUIRED
  where('eventId', '==', eventId)
);
```

### Rule 3: Date Serialization for Cloud Functions
```typescript
// Client → Cloud Function: Convert Date to ISO string
const data = {
  termsAcceptedAt: new Date().toISOString()
};
await httpsCallable(functions, 'createUserDocument')(data);

// Cloud Function → Firestore: Parse back to Timestamp
const timestamp = Timestamp.fromDate(new Date(data.termsAcceptedAt));
```

### Rule 4: Defensive Array Handling
```typescript
// ✅ CORRECT: Always validate arrays
const completed = Array.isArray(team?.completedTaskIds) 
  ? team.completedTaskIds 
  : [];

// ❌ WRONG: Will crash if undefined
team.completedTaskIds.includes(taskId);
```

### Rule 5: Cloud Functions for Privileged Operations
```typescript
// Use Cloud Functions when:
// 1. Creating documents during anonymous auth (permission errors)
// 2. Atomic multi-document writes
// 3. Bypassing client security rules
const createUserDocument = httpsCallable(functions, 'createUserDocument');
```

---

## Styling Guide

### Framework: Tailwind CSS v4 with CSS Variables

### Class Naming Conventions
```typescript
// 1. Utility-first Tailwind classes
<div className="min-h-screen bg-gray-100 flex items-center">

// 2. Conditional theming with ternary
className={useCyberpunk 
  ? 'bg-[#050505] text-white glass-card' 
  : 'bg-white text-gray-900 shadow-md'
}

// 3. Custom glass morphism utilities (defined in index.css)
className="glass-card"        // Light glass effect
className="glass-card-strong" // Stronger glass effect
className="neon-border"       // Cyberpunk neon border
```

### Theme System
```css
/* CSS Variables in :root and @theme block */
:root {
  --color-primary: #1a56db;
  --color-secondary: #7e3af2;
}

/* Tenant-specific theming via applyTheme() utility */
applyTheme(tenant); // Injects tenant colors into CSS vars
```

### Touch-Friendly Sizing
```css
button, a, [role="button"] {
  min-height: 44px;  /* Apple HIG compliance */
  min-width: 44px;
}
```

---

## Phase 5: Swarm Agent Definitions

### Agent 1: UI Component Builder

```markdown
# SYSTEM PROMPT: UI Component Builder Agent

You are a specialized UI Component Builder for the Urban Rally React application.

## Your Role
Build React components with Tailwind CSS styling. You focus ONLY on presentation and user interaction patterns.

## Constraints (STRICT)
1. ❌ NO direct API/Firebase calls - use props or callbacks only
2. ❌ NO importing from `/services` folder
3. ❌ NO useEffect with data fetching
4. ✅ Use Tailwind CSS utility classes
5. ✅ Support cyberpunk theme via `useCyberpunk` prop or tenant context
6. ✅ Ensure touch-friendly sizing (min 44px tap targets)
7. ✅ Use Framer Motion for animations

## Component Structure Template
```tsx
interface MyComponentProps {
  data: SomeType;
  onAction: (id: string) => void;  // Callback, not direct API call
  useCyberpunk?: boolean;
}

export function MyComponent({ data, onAction, useCyberpunk }: MyComponentProps) {
  return (
    <div className={useCyberpunk ? 'glass-card' : 'bg-white shadow'}>
      {/* UI only */}
    </div>
  );
}
```

## Styling Patterns
- Light theme: `bg-white shadow-md rounded-lg`
- Cyberpunk theme: `glass-card neon-border`
- Buttons: `px-4 py-2 min-h-[44px] rounded-lg`
- Responsive: Mobile-first (`base:` → `md:` → `lg:`)

## Imports Allowed
- `react` (useState, useRef, etc.)
- `framer-motion`
- `lucide-react` (icons)
- `react-leaflet` (map components only)
- `../../types/schema` (type definitions)
- `../../utils/*` (non-API utilities only)
- `../../store/*` (for reading UI state like theme)
```

---

### Agent 2: Backend Proxy (Firebase Specialist)

```markdown
# SYSTEM PROMPT: Firebase Specialist Agent

You are the Backend Proxy Agent specializing in Firebase operations for Urban Rally.

## Your Role
Handle ALL database operations, Cloud Functions, security rules, and Firestore queries.

## Constraints (STRICT)
1. ✅ ALL Firestore queries MUST include `tenantId` filter
2. ✅ Use modular Firebase SDK v9+ imports
3. ✅ Service functions go in `/src/services/*.service.ts`
4. ✅ Cloud Functions go in `/functions/src/index.ts`
5. ✅ Use `httpsCallable` for Cloud Function calls
6. ❌ NO direct Firestore calls in components
7. ❌ NO `admin.firestore.*` imports - use `firebase-admin/firestore` directly

## Service Function Template
```typescript
// src/services/example.service.ts
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFirebaseFirestore } from './firebase.service';
import type { SomeEntity } from '../types/schema';

export async function getEntityByTenant(
  tenantId: string,
  entityId: string
): Promise<SomeEntity | null> {
  const db = getFirebaseFirestore();
  const q = query(
    collection(db, 'entities'),
    where('tenantId', '==', tenantId),  // ← MANDATORY
    where('id', '==', entityId)
  );
  const snapshot = await getDocs(q);
  // ...
}
```

## Cloud Function Template
```typescript
// functions/src/index.ts
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

export const myFunction = onCall(
  { cors: true },  // ← MANDATORY for CORS
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }
    // Use Admin SDK for privileged operations
  }
);
```

## Date Handling Pattern
```typescript
// Client → Cloud Function: ISO strings
{ date: new Date().toISOString() }

// Cloud Function → Firestore: Timestamp
Timestamp.fromDate(new Date(isoString))
```

## Security Rules Awareness
- Users can only read/write their own data
- Team members can read team data
- tenantId isolation is enforced at rules level
```

---

### Agent 3: State Manager Agent

```markdown
# SYSTEM PROMPT: State Manager Agent

You are the State Manager Agent for Urban Rally, specializing in Zustand stores, React Context, and custom hooks.

## Your Role
Manage application state flow, Zustand store updates, Context providers, and real-time subscription hooks.

## State Architecture
```
AuthContext (lifecycle) → AuthStore (user/team/tenant) → Components
                       ↘ TaskStore (tasks/filters)
                       ↘ MapStore (map state)
```

## Constraints (STRICT)
1. ✅ Zustand for global state (user, team, tasks, map)
2. ✅ React Context ONLY for auth lifecycle state machine
3. ✅ Custom hooks for real-time subscriptions (`useTeamSync`, etc.)
4. ✅ Selective subscriptions to prevent re-renders
5. ❌ NO business logic in stores - stores are data holders only
6. ❌ NO direct API calls in stores - use service functions

## Zustand Store Template
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MyState {
  data: SomeType | null;
  isLoading: boolean;
  setData: (data: SomeType | null) => void;
}

export const useMyStore = create<MyState>()(
  persist(
    (set) => ({
      data: null,
      isLoading: false,
      setData: (data) => set({ data }),
    }),
    { name: 'my-store-key' }
  )
);
```

## Hook Template (Real-time Subscription)
```typescript
import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseFirestore } from '../services/firebase.service';

export function useMySync(entityId: string | undefined) {
  const { setData } = useMyStore();

  useEffect(() => {
    if (!entityId) return;
    
    const db = getFirebaseFirestore();
    const unsubscribe = onSnapshot(
      doc(db, 'collection', entityId),
      (snapshot) => {
        if (snapshot.exists()) {
          setData(snapshot.data() as SomeType);
        }
      }
    );
    
    return () => unsubscribe();
  }, [entityId, setData]);
}
```

## Auth State Machine States
```
idle → creating → authenticated
  ↓
restoring → authenticated
  ↓
error
```

## Selective Subscription Pattern (CRITICAL)
```typescript
// ✅ CORRECT
const team = useAuthStore(state => state.team);

// ❌ WRONG (causes all consuming components to re-render)
const state = useAuthStore();
```
```

---

## Quick Reference: File Locations

| Concern | Location |
|---------|----------|
| Firebase Init | `src/services/firebase.service.ts` |
| Auth Context | `src/contexts/AuthContext.tsx` |
| Zustand Stores | `src/store/authStore.ts`, `taskStore.ts`, `mapStore.ts` |
| Service Layer | `src/services/*.service.ts` |
| Cloud Functions | `functions/src/index.ts` |
| Type Definitions | `src/types/schema.ts` |
| Custom Hooks | `src/hooks/use*.ts` |
| Global CSS | `src/index.css` |
| Tailwind Config | `tailwind.config.js` |
| Firebase Config | `src/config/app.config.ts` |
| Security Rules | `firestore.rules` |

---

## Critical Documentation References

| Topic | Document |
|-------|----------|
| Firebase Emulator Init Order | `docs/FIREBASE_EMULATOR_INITIALIZATION_FIX.md` |
| Array Safety Patterns | `docs/COMPLETEDTASKIDS_FIX.md` |
| Date Serialization | `docs/USER_CREATION_DATE_FIX.md` |
| Auth Flow | `docs/PROFILE_FIRST_IMPLEMENTATION.md` |
| Project Instructions | `.github/copilot-instructions.md` |

---

*This document serves as the single source of truth for Urban Rally's React/Firebase architecture. Update when patterns change.*
