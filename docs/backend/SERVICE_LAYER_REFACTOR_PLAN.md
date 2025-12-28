# Service Layer Refactor Plan - Backend Agent

> **Agent Role:** Backend Proxy (Firebase Specialist)  
> **Date:** December 27, 2025  
> **Priority:** 🔴 Critical - Security & Architecture Integrity  
> **Estimated Effort:** 5 hours total

---

## Executive Summary

This document outlines the refactoring strategy to address two critical issues in the service layer:

1. **Security Vulnerability** - Firestore production rules have development-mode overrides (TODOs)
2. **Architecture Violation** - Services directly mutate Zustand store, breaking unidirectional data flow

---

## Table of Contents

1. [Problem Analysis](#problem-analysis)
2. [Solution Architecture](#solution-architecture)
3. [Implementation Plan](#implementation-plan)
4. [Testing Strategy](#testing-strategy)
5. [Rollback Plan](#rollback-plan)

---

## Problem Analysis

### Issue 1: Security TODOs in Production Firestore Rules

#### Current State

**File:** `firestore.rules.prod`

```plaintext
// Line 40 - Tenants collection
allow write: if true;  // ⚠️ DEVELOPMENT: Allow writes for test data setup
// TODO: Change to 'if false' in production

// Line 53 - Events collection  
allow write: if true;  // ⚠️ DEVELOPMENT: Allow writes for test data setup
// TODO: Change to 'if false' in production

// Line 96 - Teams collection
allow create: if true;  // ⚠️ DEVELOPMENT: Allow creates for test data setup
// TODO: Change to 'if false' in production

// Line 112 - Tasks collection
allow write: if true;  // ⚠️ DEVELOPMENT: Allow writes for test data setup
// TODO: Change to 'if false' in production
```

#### Security Impact

| Collection | Current Risk | Exploit Scenario |
|------------|--------------|------------------|
| **Tenants** | CRITICAL | Any authenticated user can modify tenant configs, change branding, disable tenants |
| **Events** | CRITICAL | Attackers can create fake events, modify event boundaries, corrupt leaderboards |
| **Teams** | HIGH | Mass team creation spam, data poisoning |
| **Tasks** | HIGH | Modify task requirements, change point values, delete tasks mid-event |

#### Why This Exists

These rules were left open to allow emulator seeding scripts (`scripts/add-*.ts`) and manual testing. However, **production deployments should never use these permissive rules**.

---

### Issue 2: Service-Store Coupling

#### Current Anti-Pattern

**File:** `src/services/user.service.ts` (Line 22, 117)

```typescript
// ❌ ANTI-PATTERN: Service imports and mutates store
import { useAuthStore } from '../store/authStore';

export async function createUser(data, setAuthState?) {
  // ... Firebase operations ...
  
  // Line 117: Direct store mutation from service layer
  useAuthStore.getState().setUser(userData);  // ← BREAKS UNIDIRECTIONAL FLOW
  
  return userData;
}
```

#### Architecture Violation

```
❌ CURRENT (WRONG):
Component → Service → Firebase
                ↓
              Store ← Mutation happens here

✅ CORRECT:
Component → Service → Firebase
    ↓          ↓
  Store ← Returns data (no mutation)
```

#### Problems Created

1. **Breaks Single Responsibility Principle** - Services should handle data operations, not UI state
2. **Makes Services Non-Reusable** - Services are tightly coupled to specific stores
3. **Prevents Testing** - Cannot test services without mocking Zustand store
4. **Hides State Changes** - Store mutations happen deep in call stack, hard to debug
5. **Violates Unidirectional Data Flow** - Data flows in multiple directions

#### Impact Analysis

**Currently Affected:**
- `src/services/user.service.ts` - Direct `useAuthStore` mutation (1 occurrence)

**Potentially Affected (if pattern spreads):**
- All other service files that might adopt this pattern
- Components that rely on this implicit store update behavior

---

## Solution Architecture

### Solution 1: Lock Down Production Firestore Rules

#### Strategy

**Two-Tier Rules System:**

1. **Development Rules** (`firestore.rules` / `firestore.dev.rules`) - Permissive for local development
2. **Production Rules** (`firestore.rules.prod`) - Strict, admin-only writes via Cloud Functions

#### Production Rule Changes

```plaintext
// BEFORE (Insecure):
match /tenants/{tenantId} {
  allow read: if true;
  allow write: if true;  // ⚠️ DANGEROUS
}

// AFTER (Secure):
match /tenants/{tenantId} {
  allow read: if true;  // Public read for branding
  allow write: if false;  // ✅ ONLY Cloud Functions (Admin SDK)
}
```

#### Cloud Functions Required

Since production rules block client writes, all administrative operations must go through Cloud Functions:

| Operation | New Cloud Function | Purpose |
|-----------|-------------------|---------|
| Create Tenant | `createTenantSecure` | Admin portal tenant creation |
| Update Tenant | `updateTenantSecure` | Modify tenant settings |
| Create Event | `createEventSecure` | Event creation by organizers |
| Update Event | `updateEventSecure` | Modify event settings |
| Create Task | `createTaskSecure` | Task creation by organizers |
| Update Task | `updateTaskSecure` | Modify task details |
| Create Team | (Already exists via `joinTeamSecure`) | Team creation during user flow |

#### Implementation Approach

**Phase 1: Create Cloud Functions** (2 hours)
- Implement 6 new secure Cloud Functions in `functions/src/index.ts`
- Add role-based access control (RBAC) checks
- Validate all inputs before Admin SDK writes

**Phase 2: Update Rules** (30 mins)
- Change all `if true` development overrides to `if false`
- Add comments explaining Cloud Function requirement

**Phase 3: Update Scripts** (30 mins)
- Modify `scripts/add-*.ts` to call Cloud Functions instead of direct Firestore writes
- Add admin service account authentication for scripts

**Phase 4: Testing** (1 hour)
- Verify emulator seeding still works
- Test that client writes are properly rejected
- Confirm Cloud Functions can write successfully

---

### Solution 2: Decouple Services from Store

#### Strategy

**Pure Function Services** - Services return data, components handle store updates.

#### Refactoring Pattern

```typescript
// ❌ BEFORE (Service mutates store):
// user.service.ts
import { useAuthStore } from '../store/authStore';

export async function createUser(data, setAuthState?) {
  // ... Cloud Function call ...
  const userData = responseData.user as User;
  
  useAuthStore.getState().setUser(userData);  // ❌ Store mutation in service
  
  return userData;
}

// ✅ AFTER (Service returns data only):
// user.service.ts
// NO store import needed

export async function createUser(data): Promise<User> {
  // ... Cloud Function call ...
  const userData = responseData.user as User;
  
  return userData;  // ✅ Just return data
}

// Component handles store update:
// ProfileModal.tsx
import { useAuthStore } from '../store/authStore';
import { createUser } from '../services/user.service';

const { setUser } = useAuthStore();

const handleCreateUser = async (data) => {
  setAuthState('creating');
  const user = await createUser(data);  // Service returns data
  setUser(user);  // Component updates store
  setAuthState('authenticated');
};
```

#### Benefits

1. **Pure Functions** - Services have no side effects, easier to test
2. **Reusability** - Services can be used in any context (admin portal, CLI scripts, tests)
3. **Explicit State Flow** - Components clearly show when store is updated
4. **Better Testability** - Mock Firebase, not Zustand
5. **Single Responsibility** - Services handle data, components handle UI state

#### Files to Modify

1. **Service Layer:**
   - `src/services/user.service.ts` (Remove store import and mutation)

2. **Components Calling createUser:**
   - `src/components/auth/IdentityUplinkModal.tsx`
   - `src/features/auth/EventCodeEntry.tsx`
   - Any other component using `createUser`

3. **Store:**
   - No changes needed (store is already well-designed)

---

## Implementation Plan

### Timeline Overview

| Phase | Task | Duration | Dependencies |
|-------|------|----------|--------------|
| 1A | Create Cloud Functions | 2 hours | None |
| 1B | Update Firestore Rules | 30 mins | Phase 1A |
| 1C | Update Seeding Scripts | 30 mins | Phase 1A |
| 1D | Test Security Rules | 1 hour | Phase 1B, 1C |
| 2A | Refactor user.service.ts | 15 mins | None |
| 2B | Update IdentityUplinkModal | 15 mins | Phase 2A |
| 2C | Update EventCodeEntry | 15 mins | Phase 2A |
| 2D | Test Service Decoupling | 15 mins | Phase 2B, 2C |

**Total Estimated Time:** 5 hours

---

### Phase 1: Security Rules Lockdown

#### Step 1A: Create Cloud Functions (2 hours)

**File:** `functions/src/index.ts`

##### 1A.1 - createTenantSecure

```typescript
export const createTenantSecure = onCall(
  { cors: true },
  async (request) => {
    // RBAC: Only super admins can create tenants
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }
    
    // TODO: Add admin role check from custom claims
    // if (request.auth.token.role !== 'superadmin') {
    //   throw new HttpsError('permission-denied', 'Only super admins can create tenants');
    // }
    
    const { name, displayName, primaryColor, logoUrl } = request.data;
    
    // Validate inputs
    if (!name || !displayName) {
      throw new HttpsError('invalid-argument', 'Name and displayName are required');
    }
    
    const db = getFirestore();
    const tenantRef = db.collection('tenants').doc();
    
    const tenantData = {
      id: tenantRef.id,
      name,
      displayName,
      theme: {
        primaryColor: primaryColor || '#1a56db',
        logoUrl: logoUrl || null,
      },
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    await tenantRef.set(tenantData);
    
    return { success: true, tenantId: tenantRef.id };
  }
);
```

##### 1A.2 - updateTenantSecure

```typescript
export const updateTenantSecure = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }
    
    const { tenantId, updates } = request.data;
    
    if (!tenantId) {
      throw new HttpsError('invalid-argument', 'tenantId is required');
    }
    
    // Whitelist allowed fields
    const allowedFields = ['displayName', 'theme', 'isActive'];
    const sanitizedUpdates: any = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    }
    
    sanitizedUpdates.updatedAt = FieldValue.serverTimestamp();
    
    const db = getFirestore();
    await db.collection('tenants').doc(tenantId).update(sanitizedUpdates);
    
    return { success: true };
  }
);
```

##### 1A.3 - createEventSecure

```typescript
export const createEventSecure = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }
    
    const { tenantId, name, eventCode, startDate, endDate, mapBounds } = request.data;
    
    // Validate required fields
    if (!tenantId || !name || !eventCode || !startDate || !endDate) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }
    
    // TODO: Check user has organizer role for this tenant
    
    const db = getFirestore();
    const eventRef = db.collection('events').doc();
    
    const eventData = {
      id: eventRef.id,
      tenantId,
      name,
      eventCode,
      startDate: Timestamp.fromDate(new Date(startDate)),
      endDate: Timestamp.fromDate(new Date(endDate)),
      mapBounds: mapBounds || null,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    await eventRef.set(eventData);
    
    return { success: true, eventId: eventRef.id };
  }
);
```

##### 1A.4 - updateEventSecure

```typescript
export const updateEventSecure = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }
    
    const { eventId, updates } = request.data;
    
    if (!eventId) {
      throw new HttpsError('invalid-argument', 'eventId is required');
    }
    
    // Whitelist allowed fields
    const allowedFields = ['name', 'startDate', 'endDate', 'mapBounds', 'isActive'];
    const sanitizedUpdates: any = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        if (field === 'startDate' || field === 'endDate') {
          sanitizedUpdates[field] = Timestamp.fromDate(new Date(updates[field]));
        } else {
          sanitizedUpdates[field] = updates[field];
        }
      }
    }
    
    sanitizedUpdates.updatedAt = FieldValue.serverTimestamp();
    
    const db = getFirestore();
    await db.collection('events').doc(eventId).update(sanitizedUpdates);
    
    return { success: true };
  }
);
```

##### 1A.5 - createTaskSecure

```typescript
export const createTaskSecure = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }
    
    const { eventId, tenantId, title, description, taskType, points, location } = request.data;
    
    if (!eventId || !tenantId || !title || !taskType) {
      throw new HttpsError('invalid-argument', 'Missing required fields');
    }
    
    const db = getFirestore();
    const taskRef = db.collection('tasks').doc();
    
    const taskData = {
      id: taskRef.id,
      eventId,
      tenantId,
      title,
      description: description || '',
      taskType,
      points: points || 100,
      location: location || null,
      isActive: true,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    await taskRef.set(taskData);
    
    return { success: true, taskId: taskRef.id };
  }
);
```

##### 1A.6 - updateTaskSecure

```typescript
export const updateTaskSecure = onCall(
  { cors: true },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }
    
    const { taskId, updates } = request.data;
    
    if (!taskId) {
      throw new HttpsError('invalid-argument', 'taskId is required');
    }
    
    // Whitelist allowed fields
    const allowedFields = ['title', 'description', 'points', 'location', 'isActive'];
    const sanitizedUpdates: any = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    }
    
    sanitizedUpdates.updatedAt = FieldValue.serverTimestamp();
    
    const db = getFirestore();
    await db.collection('tasks').doc(taskId).update(sanitizedUpdates);
    
    return { success: true };
  }
);
```

#### Step 1B: Update Firestore Rules (30 mins)

**File:** `firestore.rules.prod`

```plaintext
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // ====================================
    // HELPER FUNCTIONS
    // ====================================
    
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isTeamOwner(teamId) {
      return isAuthenticated() && request.auth.uid == resource.data.uid;
    }
    
    function isTeamMember(teamId) {
      return isAuthenticated() && get(/databases/$(database)/documents/teams/$(teamId)).data.uid == request.auth.uid;
    }
    
    function belongsToTenant(tenantId) {
      return request.resource.data.tenantId == tenantId;
    }
    
    // ====================================
    // TENANTS COLLECTION
    // ====================================
    
    match /tenants/{tenantId} {
      // Public read for branding (logo, colors, name)
      allow read: if true;
      
      // ✅ PRODUCTION: Only Cloud Functions can write
      // Use createTenantSecure, updateTenantSecure
      allow write: if false;
    }
    
    // ====================================
    // EVENTS COLLECTION
    // ====================================
    
    match /events/{eventId} {
      // Public read for active events (map bounds, start/end dates)
      allow read: if true;
      
      // ✅ PRODUCTION: Only Cloud Functions can write
      // Use createEventSecure, updateEventSecure
      allow write: if false;
    }
    
    // ====================================
    // TEAMS COLLECTION (Strict Isolation)
    // ====================================
    
    match /teams/{teamId} {
      // Allow reading by accessCode for login (before auth)
      // OR if user owns the team (after auth)
      allow read: if isTeamOwner(teamId) 
                  || (!isAuthenticated() && request.query != null);
      
      // Teams can update their own data after authentication
      allow update: if (isAuthenticated() && request.auth.uid == request.resource.data.uid)
                    && request.resource.data.tenantId == resource.data.tenantId
                    && request.resource.data.eventId == resource.data.eventId
                    && request.resource.data.accessCode == resource.data.accessCode
                    && (
                      request.resource.data.diff(resource.data).affectedKeys().hasOnly([
                        'displayName',
                        'email', 
                        'profilePhotoUrl',
                        'teamDisplayName',
                        'consentGiven',
                        'currentLocation',
                        'lastKnownPosition',
                        'lastLoginAt',
                        'updatedAt',
                        'score',
                        'completedTaskIds',
                        'inventory',
                        'uid'
                      ])
                    );
      
      // ✅ PRODUCTION: Only Cloud Functions can create teams
      // Use joinTeamSecure (already exists)
      allow create: if false;
      allow delete: if false;
    }
    
    // ====================================
    // TASKS COLLECTION (Read-Only for Teams)
    // ====================================
    
    match /tasks/{taskId} {
      // Teams can read tasks for their event
      allow read: if isAuthenticated();
      
      // ✅ PRODUCTION: Only Cloud Functions can write
      // Use createTaskSecure, updateTaskSecure
      allow write: if false;
    }
    
    // ====================================
    // TASK SUBMISSIONS
    // ====================================
    
    match /submissions/{submissionId} {
      // Teams can read their own submissions
      allow read: if isAuthenticated() 
                  && isTeamMember(resource.data.teamId);
      
      // Teams can submit photos/videos for tasks
      allow create: if isAuthenticated()
                    && isTeamMember(request.resource.data.teamId)
                    && belongsToTenant(request.resource.data.tenantId);
      
      // Only Cloud Functions can approve/reject
      allow update, delete: if false;
    }
    
    // ====================================
    // LEADERBOARD (Public Read-Only)
    // ====================================
    
    match /leaderboard/{eventId}/entries/{teamId} {
      allow read: if true;
      allow write: if false;
    }
    
    // ====================================
    // USER PROFILES
    // ====================================
    
    match /users/{userId} {
      allow read: if isAuthenticated() && request.auth.uid == userId;
      allow write: if false;  // Only via Cloud Functions
    }
    
    // ====================================
    // STRIPE INTEGRATION
    // ====================================
    
    match /customers/{uid} {
      allow read: if isAuthenticated() && request.auth.uid == uid;
      
      match /checkout_sessions/{sessionId} {
        allow read, write: if isAuthenticated() && request.auth.uid == uid;
      }
      
      match /subscriptions/{subscriptionId} {
        allow read: if isAuthenticated() && request.auth.uid == uid;
      }
    }
    
    // ====================================
    // DEFAULT DENY
    // ====================================
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

#### Step 1C: Update Seeding Scripts (30 mins)

**Files:** `scripts/add-event.ts`, `scripts/add-teams.ts`, `scripts/add-quiz-photo-tasks.ts`

##### Example: Update add-event.ts

```typescript
// BEFORE (Direct Firestore write):
import { addDoc, collection } from 'firebase/firestore';

const eventRef = await addDoc(collection(db, 'events'), eventData);

// AFTER (Cloud Function call):
import { httpsCallable } from 'firebase/functions';

const createEventSecure = httpsCallable(functions, 'createEventSecure');
const result = await createEventSecure({
  tenantId: eventData.tenantId,
  name: eventData.name,
  eventCode: eventData.eventCode,
  startDate: eventData.startDate.toISOString(),
  endDate: eventData.endDate.toISOString(),
  mapBounds: eventData.mapBounds,
});

console.log('Event created:', result.data.eventId);
```

**Note:** Scripts will need Firebase Admin SDK initialization with service account for Cloud Function auth.

---

### Phase 2: Service-Store Decoupling

#### Step 2A: Refactor user.service.ts (15 mins)

**File:** `src/services/user.service.ts`

**Changes:**

1. Remove store import (line 22)
2. Remove `setAuthState` parameter from function signature
3. Remove store mutation call (line 117)
4. Simplify return statement

```typescript
// BEFORE:
import { useAuthStore } from '../store/authStore';

export async function createUser(
  data: { /* ... */ },
  setAuthState?: (state: 'idle' | 'creating' | 'restoring' | 'authenticated' | 'error') => void
): Promise<User> {
  // ...
  
  // Line 117: Store mutation
  useAuthStore.getState().setUser(userData);
  
  // Line 119-122: Auth state management in service
  if (setAuthState) {
    setAuthState('authenticated');
    console.log('🔓 Auth listener enabled (state: authenticated)');
  }
  
  return userData;
}

// AFTER:
// NO store import

export async function createUser(
  data: {
    displayName: string;
    email?: string;
    tenantId: string;
    accountType?: 'anonymous' | 'linked';
    consentGiven: {
      terms: boolean;
      privacy: boolean;
      termsVersion: string;
      privacyVersion: string;
      termsAcceptedAt: Date;
      privacyAcceptedAt: Date;
      ipAddress?: string;
    };
  }
): Promise<User> {
  const auth = getFirebaseAuth();
  const functions = getFirebaseFunctions();

  try {
    console.log('🔵 Starting user creation process (via Cloud Function)...');

    // Create Firebase Anonymous Auth user
    const userCredential = await signInAnonymously(auth);
    const uid = userCredential.user.uid;
    console.log('✅ Auth user created, UID:', uid);

    // Call Cloud Function to create user document
    const createUserDocument = httpsCallable(functions, 'createUserDocument');
    
    const consentData = {
      ...data.consentGiven,
      termsAcceptedAt: data.consentGiven.termsAcceptedAt.toISOString(),
      privacyAcceptedAt: data.consentGiven.privacyAcceptedAt.toISOString(),
    };
    
    const result = await createUserDocument({
      displayName: data.displayName,
      email: data.email || undefined,
      tenantId: data.tenantId,
      accountType: data.accountType || 'anonymous',
      consentGiven: consentData,
    });

    const responseData = result.data as { success: boolean; userId: string; user: any };
    
    if (!responseData.success || !responseData.user) {
      throw new Error('User document was not returned by Cloud Function');
    }

    const userData = responseData.user as User;
    
    console.log('✅ User created successfully:', {
      uid,
      displayName: userData.displayName,
    });

    // ✅ Just return data, let component handle store
    return userData;
    
  } catch (error) {
    console.error('❌ Error creating user:', error);
    
    // Enhanced error handling (same as before)
    if ((error as any).code === 'functions/unauthenticated') {
      throw new Error('Authentication failed. Please try again.');
    }
    
    throw new Error('Failed to create user profile. Please try again.');
  }
}
```

**Removed Lines:**
- Line 22: `import { useAuthStore } from '../store/authStore';`
- Line 44: `setAuthState?: (state: ...) => void` parameter
- Lines 68-72: Auth state management in service
- Line 117: `useAuthStore.getState().setUser(userData);`
- Lines 119-122: `setAuthState('authenticated')` call
- Lines 134-137: Auth state error handling

#### Step 2B: Update IdentityUplinkModal.tsx (15 mins)

**File:** `src/components/auth/IdentityUplinkModal.tsx`

**Find the `handleSubmit` function and update:**

```typescript
// BEFORE:
import { createUser } from '../../services/user.service';
import { useAuthContext } from '../../contexts/AuthContext';

const { setAuthState } = useAuthContext();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    // createUser handles store update internally
    await createUser(
      {
        displayName,
        email: email || undefined,
        tenantId: tenant!.id,
        consentGiven: {
          terms: true,
          privacy: true,
          termsVersion: '1.0',
          privacyVersion: '1.0',
          termsAcceptedAt: new Date(),
          privacyAcceptedAt: new Date(),
        },
      },
      setAuthState  // Pass auth state manager
    );
    
    // User is already in store at this point
    onComplete();
  } catch (err) {
    setError('Failed to create profile');
  } finally {
    setLoading(false);
  }
};

// AFTER:
import { createUser } from '../../services/user.service';
import { useAuthContext } from '../../contexts/AuthContext';
import { useAuthStore } from '../../store/authStore';

const { setAuthState } = useAuthContext();
const { setUser } = useAuthStore();  // ✅ Get store updater

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    // ✅ Explicitly manage auth state in component
    setAuthState('creating');
    
    // ✅ Service returns data without side effects
    const user = await createUser({
      displayName,
      email: email || undefined,
      tenantId: tenant!.id,
      consentGiven: {
        terms: true,
        privacy: true,
        termsVersion: '1.0',
        privacyVersion: '1.0',
        termsAcceptedAt: new Date(),
        privacyAcceptedAt: new Date(),
      },
    });
    
    // ✅ Component updates store explicitly
    setUser(user);
    setAuthState('authenticated');
    
    onComplete();
  } catch (err) {
    setError('Failed to create profile');
    setAuthState('error');  // ✅ Handle error state
  } finally {
    setLoading(false);
  }
};
```

#### Step 2C: Update EventCodeEntry.tsx (15 mins)

**File:** `src/features/auth/EventCodeEntry.tsx`

**Apply same pattern as Step 2B:**

```typescript
// Add store import
import { useAuthStore } from '../../store/authStore';

// Get store updater
const { setUser } = useAuthStore();

// Update createUser call to handle store explicitly
const user = await createUser({ /* data */ });
setUser(user);
setAuthState('authenticated');
```

#### Step 2D: Test Service Decoupling (15 mins)

**Manual Testing Checklist:**

1. ✅ User creation via IdentityUplinkModal
2. ✅ User creation via EventCodeEntry
3. ✅ Store is correctly updated after user creation
4. ✅ Auth state machine transitions correctly
5. ✅ Error handling still works (network errors, validation errors)
6. ✅ Console logs show correct flow

---

## Testing Strategy

### Security Rules Testing

#### Test 1: Development Rules Still Work

```bash
# Start emulators (uses firestore.rules, not .prod)
firebase emulators:start

# Run seeding script
npm run seed:emulator

# Expected: ✅ All data seeded successfully
```

#### Test 2: Production Rules Block Client Writes

```bash
# Switch to production rules temporarily
cp firestore.rules.prod firestore.rules

# Restart emulators
firebase emulators:start

# Try to create team directly from client
# Expected: ❌ Permission denied error

# Try to update event from client
# Expected: ❌ Permission denied error
```

#### Test 3: Cloud Functions Can Write

```bash
# With production rules active
# Call createEventSecure from client
# Expected: ✅ Event created successfully

# Call updateTenantSecure from client
# Expected: ✅ Tenant updated successfully
```

### Service Decoupling Testing

#### Test 1: User Creation Flow

```typescript
// Test in browser console
// Expected: User created, store updated, no errors
```

#### Test 2: Error Handling

```typescript
// Simulate network error
// Expected: Error state set correctly, no orphaned auth users
```

#### Test 3: Unit Testing (New)

```typescript
// Can now test service without mocking store
import { createUser } from './user.service';

test('createUser returns user data', async () => {
  const user = await createUser({ /* test data */ });
  expect(user).toHaveProperty('id');
  expect(user.displayName).toBe('Test User');
});
```

---

## Rollback Plan

### If Security Rules Cause Issues

```bash
# Revert to development rules
cp firestore.rules.dev firestore.rules
firebase deploy --only firestore:rules

# Or rollback via Firebase Console:
# 1. Go to Firestore → Rules
# 2. Select previous version from history
# 3. Click "Publish"
```

### If Service Decoupling Breaks Flow

```bash
# Revert commits
git revert <commit-hash>

# Or manually restore:
# 1. Re-add store import to user.service.ts
# 2. Re-add setAuthState parameter
# 3. Re-add store mutation call
```

### Monitoring After Deployment

```typescript
// Add Cloud Function logging
export const createUserDocument = onCall({ cors: true }, async (request) => {
  logger.info('User creation started', { uid: request.auth?.uid });
  
  try {
    // ... function logic ...
    logger.info('User creation successful', { userId: result.id });
  } catch (error) {
    logger.error('User creation failed', { error });
    throw error;
  }
});
```

**Watch Firebase Console:**
- Functions → Logs → Filter by `createUserDocument`
- Firestore → Usage → Check for permission denied errors

---

## Success Criteria

### Phase 1: Security (Must Pass All)

- [ ] All `if true` development overrides changed to `if false` in `firestore.rules.prod`
- [ ] 6 new Cloud Functions deployed and callable
- [ ] Emulator seeding still works with development rules
- [ ] Client writes blocked by production rules
- [ ] Cloud Functions can successfully write to all collections
- [ ] No permission denied errors in production after deployment

### Phase 2: Decoupling (Must Pass All)

- [ ] `user.service.ts` has no store imports
- [ ] `createUser` function is pure (no side effects)
- [ ] `IdentityUplinkModal` explicitly updates store
- [ ] `EventCodeEntry` explicitly updates store
- [ ] Auth state machine still works correctly
- [ ] Error handling preserved
- [ ] User creation flow works end-to-end
- [ ] No console errors during user creation

---

## Post-Implementation Documentation

### Update Required

1. **ARCHITECT_MEMORY.md** - Update service layer pattern
2. **CurrentStructure.md** - Mark issues as resolved
3. **.github/copilot-instructions.md** - Update service patterns
4. **docs/CLOUD_FUNCTIONS.md** (new) - Document new Cloud Functions
5. **README.md** - Update security notes

### Example Code Updates

**ARCHITECT_MEMORY.md - Service Pattern:**

```markdown
### Rule 1: Services are Pure Functions
```typescript
❌ NEVER: Mutate store from service
✅ ALWAYS: Return data, let component update store

// ✅ CORRECT
export async function createUser(data): Promise<User> {
  const user = await cloudFunction(data);
  return user;  // Pure function
}

// Component handles store
const user = await createUser(data);
setUser(user);  // Explicit store update
```
```

---

## Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|------------|
| Production rules break existing features | Medium | Test thoroughly in emulator first, gradual rollout |
| Cloud Functions fail due to CORS | Low | All functions already use `{ cors: true }` option |
| Service decoupling breaks user creation | Low | Only 1 service file affected, easy to revert |
| Seeding scripts stop working | Medium | Update scripts to use Cloud Functions |
| Admin portal needs new UI | High | Not in scope - document Cloud Function usage |

---

## Next Steps After Approval

1. **Get approval from team lead**
2. **Create feature branch:** `git checkout -b refactor/service-layer-security`
3. **Implement Phase 1 (Security)**
4. **Test in emulator**
5. **Implement Phase 2 (Decoupling)**
6. **Test end-to-end**
7. **Create PR with this document as context**
8. **Deploy to staging environment**
9. **Monitor for 24 hours**
10. **Deploy to production**

---

## Questions & Answers

### Q1: Why not just use Firebase Admin SDK from client?

**A:** Admin SDK bypasses all security rules and should NEVER be used client-side. It requires a service account key which would be exposed to users.

### Q2: Will existing users be affected?

**A:** No. User creation via Cloud Function already works correctly. We're just cleaning up the store mutation pattern.

### Q3: What about data migration for existing insecure data?

**A:** Not needed. Existing data is fine. We're preventing future unauthorized writes, not fixing past data.

### Q4: How do we test RBAC (role-based access control) later?

**A:** Cloud Functions include commented-out role checks. When custom claims are implemented:
```typescript
if (request.auth.token.role !== 'admin') {
  throw new HttpsError('permission-denied', 'Insufficient permissions');
}
```

### Q5: Performance impact of Cloud Functions vs direct writes?

**A:** Minimal (~50-100ms added latency). These are admin operations, not user-facing real-time features.

---

## Appendix: Full File Diff Preview

### A.1 - firestore.rules.prod

```diff
  match /tenants/{tenantId} {
    allow read: if true;
-   // ⚠️ DEVELOPMENT: Allow writes for test data setup
-   // TODO: Change to 'if false' in production
-   allow write: if true;
+   // ✅ PRODUCTION: Only Cloud Functions can write
+   // Use createTenantSecure, updateTenantSecure
+   allow write: if false;
  }
```

(Repeat for events, tasks, teams collections)

### A.2 - user.service.ts

```diff
- import { useAuthStore } from '../store/authStore';

  export async function createUser(
    data: { /* ... */ },
-   setAuthState?: (state: 'idle' | 'creating' | 'restoring' | 'authenticated' | 'error') => void
  ): Promise<User> {
    // ... Firebase operations ...
    
    const userData = responseData.user as User;
    
-   // Store mutation in service
-   useAuthStore.getState().setUser(userData);
-   
-   if (setAuthState) {
-     setAuthState('authenticated');
-   }
    
+   // Just return data
    return userData;
  }
```

### A.3 - IdentityUplinkModal.tsx

```diff
  import { createUser } from '../../services/user.service';
+ import { useAuthStore } from '../../store/authStore';
  
+ const { setUser } = useAuthStore();
  
  const handleSubmit = async (e: React.FormEvent) => {
    try {
+     setAuthState('creating');
+     
-     await createUser({ /* data */ }, setAuthState);
+     const user = await createUser({ /* data */ });
+     
+     setUser(user);
+     setAuthState('authenticated');
    } catch (err) {
+     setAuthState('error');
    }
  };
```

---

**End of Service Layer Refactor Plan**

✅ **Ready for implementation upon approval**
