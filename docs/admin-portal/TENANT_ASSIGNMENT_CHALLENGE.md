# Critical Challenge: Tenant Assignment at Registration

**Date:** December 30, 2025  
**Priority:** 🔴 CRITICAL - Architectural Flaw  
**Status:** Analysis Complete - Decision Required  
**Related:** `MULTI_TENANT_ROLE_ANALYSIS.md`

---

## Executive Summary

**The Problem:** Users register WITHOUT a tenant assignment mechanism, creating "orphaned" users visible to ALL tenants. This violates multi-tenant data isolation and creates severe security and privacy issues.

**Critical User Stories:**
1. **Alice** registers → `tenantId = undefined` → All tenants see Alice → Berlin promotes Alice to admin → **Question: Which tenant does Alice belong to?**
2. **Mark** creates anonymous account → `tenantId = undefined` → All tenants see Mark in user lists → **Privacy violation**

**Root Cause:** Current registration flow (`createUserDocument`) requires `tenantId` parameter, but there's **no mechanism to determine which tenant a user should belong to** at registration time.

---

## Current System Behavior

### Registration Flow Analysis

```typescript
// functions/src/index.ts - createUserDocument (lines 109-245)
export const createUserDocument = onCall({cors: true}, async (request) => {
  const { displayName, email, tenantId, consentGiven, accountType } = data;
  
  // ⚠️ CRITICAL: tenantId is REQUIRED
  if (!tenantId || typeof tenantId !== "string") {
    throw new HttpsError("invalid-argument", "Tenant ID is required.");
  }
  
  // User document created with this tenantId
  const userData = {
    id: uid,
    displayName: displayName,
    tenantId: tenantId, // ← WHERE DOES THIS COME FROM?
    // ...
  };
  
  await userRef.set(userData);
});
```

### Current User Creation Workflow

```
Step 1: User navigates to app
├─ Option A: Enters event code (BERLIN2025)
│   └─ EventCodeEntry validates code
│       └─ Navigates to /tenant/{tenantId}/event/{eventId}/teams
│       └─ ⚠️ User can browse teams WITHOUT registering
│       └─ ⚠️ tenantId known but NOT stored yet
│
└─ Option B: Anonymous browsing
    └─ Lands on homepage
    └─ No tenant context available

Step 2: User clicks "Create Team" or "Join Team"
├─ Triggers auth check (useProfileGuard)
├─ User has no Firebase Auth account
└─ ⚠️ WHERE IS ProfileModal/ProfileCreation component?

Step 3: User creates profile
├─ ⚠️ MISSING: No ProfileModal found in codebase
├─ Calls createUser() from user.service.ts
├─ user.service.ts (line 85) calls createUserDocument({
│     displayName,
│     email,
│     tenantId,  // ← ⚠️ WHERE DOES THIS VALUE COME FROM?
│     accountType,
│     consentGiven
│   })
└─ User document created with tenantId

Step 4: User now exists in system
└─ User.tenantId = ??? (undefined? first event tenant? default tenant?)
```

### Problem: No Profile Creation Component Found

```bash
# Search results show NO ProfileModal component exists
$ grep -r "ProfileModal" src/
# No results

# Profile creation happens via user.service.ts
# But WHO calls it and HOW is tenantId determined?
```

---

## Critical Issues Identified

### Issue 1: Orphaned Users (No Tenant Assignment)

**Scenario:**
```typescript
// User registers WITHOUT tenant context
const newUser = {
  id: "user_alice_123",
  displayName: "Alice",
  email: "alice@example.com",
  tenantId: undefined, // ⚠️ OR null OR some default value?
  accountType: "anonymous",
  role: "player",
};

// Query from ESN Berlin admin dashboard
const berlinUsers = await db.collection('users')
  .where('tenantId', '==', 'tenant-berlin')
  .get();
// ❌ Alice NOT in results (tenantId doesn't match)

// Query from ALL tenant dashboards
const allUsers = await db.collection('users')
  .orderBy('createdAt', 'desc')
  .limit(100)
  .get();
// ✅ Alice IS in results (no tenantId filter)
// 🔴 PROBLEM: ALL TENANTS SEE ALICE
```

**Impact:**
- ❌ **Privacy Violation:** Alice's profile visible to all tenants
- ❌ **Data Isolation Broken:** Multi-tenant security model fails
- ❌ **Ambiguous Ownership:** Who "owns" Alice's data?
- ❌ **GDPR Compliance Risk:** Data controller unclear

### Issue 2: StaffList "All Users" Tab Shows Unaffiliated Users

**Current Implementation:**
```typescript
// StaffList.tsx (lines 98-117)
useEffect(() => {
  setLoading(true);

  // Query ALL users (no tenant filter!)
  const usersQuery = query(
    collection(db, 'users'),
    orderBy('createdAt', 'desc'),
    limit(100) // ⚠️ Shows latest 100 users ACROSS ALL TENANTS
  );

  const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as User));

    setAllUsers(users); // ⚠️ Includes users from OTHER tenants!
    setLoading(false);
  });

  return () => unsubscribe();
}, []);
```

**Result:**
```
ESN Berlin Admin Dashboard → Staff Management → All Users Tab
┌─────────────────────────────────────────────────────────┐
│ All Users (100)                                         │
├─────────────────────────────────────────────────────────┤
│ Alice (alice@example.com) - Player - No tenant         │ ← From nowhere!
│ Mark (Anonymous) - Player - No tenant                  │ ← From nowhere!
│ Bob (ESN Munich) - Player                              │ ← From Munich tenant
│ Carol (ESN Berlin) - Moderator                         │ ← From Berlin tenant
│ ...                                                     │
└─────────────────────────────────────────────────────────┘

Berlin admin clicks "Promote Alice to Moderator"
→ Alice promoted in Berlin tenant
→ tenantRoles['tenant-berlin'] = { role: 'moderator', ... }
→ User.tenantId = undefined (unchanged!)
→ Alice now has admin role but NO "home tenant"
```

### Issue 3: Security Rules Allow Cross-Tenant User Queries

**Firestore Rules (lines 207-213):**
```javascript
match /users/{userId} {
  // Users can read their own profile
  allow read: if isOwner(userId);
  
  // Superadmins can read all users
  allow list: if isSuperadmin();
  
  // Admins can query users in their tenants (for staff management)
  allow list: if isAuthenticated() 
              && hasAdminRole()
              && request.query != null; // ⚠️ NO TENANT FILTER REQUIRED!
}
```

**Problem:** Rule allows ANY admin to query ALL users, not just users in their tenant.

**Should be:**
```javascript
allow list: if isAuthenticated() 
            && hasAdminRole()
            && request.query.where.contains(['tenantId', '==', activeTenantId]);
```

---

## User Story Deep Dive

### Story 1: Alice Registers Without Tenant

**Timeline:**
```
T=0: Alice opens urbanrally.app
     └─ No event code provided
     └─ Lands on homepage

T=1: Alice clicks "Browse Events"
     └─ No authentication required
     └─ Sees public event list (or enters event code)

T=2: Alice enters event code "BERLIN2025"
     └─ EventCodeEntry validates code
     └─ event.tenantId = 'tenant-berlin'
     └─ Redirects to /tenant/tenant-berlin/event/event123/teams

T=3: Alice clicks "Join Team Alpha"
     └─ useProfileGuard checks: needsProfile = true (no auth)
     └─ ⚠️ MISSING: Should show ProfileModal
     └─ ⚠️ UNKNOWN: How does profile creation happen?

T=4: (Assuming profile creation flow exists)
     Alice fills out profile form
     └─ displayName: "Alice"
     └─ email: "alice@example.com"
     └─ Accepts GDPR consent
     └─ ⚠️ QUESTION: What is tenantId?
         Option A: undefined (no tenant assigned)
         Option B: 'tenant-berlin' (from event code context)
         Option C: 'tenant-default' (system default)

T=5: User document created
     └─ User.tenantId = ??? 
     └─ User.role = 'player'
     └─ User.tenantRoles = {} (empty)

T=6: ESN Munich admin searches for "Alice"
     └─ StaffList "All Users" tab
     └─ Query: all users (no tenant filter)
     └─ ✅ Munich admin SEES Alice
     └─ 🔴 PROBLEM: Alice never interacted with Munich!
```

### Story 2: Mark Creates Anonymous Account

**Timeline:**
```
T=0: Mark opens app, no event code
     └─ Browses anonymously

T=1: Mark clicks "Create Team" (without event code)
     └─ Triggers authentication
     └─ Profile creation flow
     └─ ⚠️ No tenant context available
     └─ User.tenantId = undefined

T=2: Mark creates team "Team Rocket"
     └─ Team.tenantId = ??? 
     └─ Team.eventId = ??? 
     └─ 🔴 IMPOSSIBLE: Can't create team without event!

Alternative T=2: Mark forced to enter event code first
                 └─ Then tenantId can be inferred from event
```

### Story 3: Berlin Promotes Orphaned User

**Timeline:**
```
T=0: Alice exists in system
     └─ User.tenantId = undefined
     └─ User.role = 'player'
     └─ User.tenantRoles = {}

T=1: Berlin admin opens StaffList → All Users
     └─ Query returns all users (including Alice)
     └─ Admin sees: "Alice (alice@example.com) - Player"

T=2: Admin clicks "Promote Alice to Moderator"
     └─ Calls assignRole Cloud Function
     └─ assignRole({
           targetUserId: "alice123",
           tenantId: "tenant-berlin",
           role: "moderator"
         })

T=3: User document updated
     └─ User.tenantRoles['tenant-berlin'] = {
           role: 'moderator',
           grantedBy: 'admin_berlin',
           isActive: true
         }
     └─ User.highestRole = 'moderator'
     └─ User.tenantId = undefined (UNCHANGED!)

T=4: Munich admin still sees Alice in "All Users"
     └─ Alice has NO role in Munich
     └─ Alice has NO tenantId
     └─ 🔴 PROBLEM: Cross-tenant visibility without affiliation
```

---

## Root Cause Analysis

### Missing Component: Tenant Context Capture

**The Problem:** User registration does NOT capture tenant context.

**Where it should happen:**
```
User Journey:
1. User enters event code "BERLIN2025"
2. System resolves: event.tenantId = "tenant-berlin"
3. User creates profile
4. ✅ Profile should inherit tenantId from event context
5. User joins team in that event
6. ✅ User now belongs to Berlin tenant
```

**Why it's broken:**
- EventCodeEntry stores event in local state (not persisted)
- No global context provider tracks "intended tenant"
- createUserDocument requires tenantId but caller doesn't provide it
- Profile creation flow (ProfileModal) is MISSING from codebase

---

## Proposed Solutions

### Approach A: Event-First Registration (RECOMMENDED)

**Concept:** Users MUST enter event code BEFORE creating profile. Profile inherits tenant from event.

#### Workflow

```
┌─────────────────────────────────────────────────────────┐
│           EVENT-FIRST REGISTRATION FLOW                  │
└─────────────────────────────────────────────────────────┘

Step 1: User enters event code "BERLIN2025"
├─ EventCodeEntry validates code
├─ event = { id: "evt123", tenantId: "tenant-berlin", ... }
├─ Store in global context: setEventContext(event)
└─ Navigate to /tenant/tenant-berlin/event/evt123/teams

Step 2: User clicks "Join Team" (needs auth)
├─ useProfileGuard: needsProfile = true
├─ ProfileModal opens
├─ User fills: displayName, email, consent
├─ ✅ ProfileModal reads event context
└─ Calls createUser({ tenantId: event.tenantId, ... })

Step 3: User document created
├─ User.tenantId = "tenant-berlin" ✅
├─ User.role = "player"
├─ User.accountType = "anonymous"
└─ User is NOW associated with Berlin tenant

Step 4: User joins team
├─ Team.tenantId = "tenant-berlin"
├─ TeamMember created linking User → Team → Event
└─ ✅ All multi-tenant constraints satisfied
```

#### Implementation

**1. Create EventContext Provider**

```typescript
// src/contexts/EventContext.tsx (NEW FILE)
import { createContext, useContext, useState, ReactNode } from 'react';
import type { Event } from '../types/schema';

interface EventContextType {
  activeEvent: Event | null;
  setActiveEvent: (event: Event | null) => void;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: ReactNode }) {
  const [activeEvent, setActiveEvent] = useState<Event | null>(null);

  return (
    <EventContext.Provider value={{ activeEvent, setActiveEvent }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEventContext() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEventContext must be used within EventProvider');
  }
  return context;
}
```

**2. Update EventCodeEntry to Store Context**

```typescript
// EventCodeEntry.tsx
import { useEventContext } from '../../contexts/EventContext';

export function EventCodeEntry() {
  const { setActiveEvent } = useEventContext();
  
  const handleSubmit = async (e: FormEvent) => {
    // ... validation ...
    
    const eventData = await validateEventCode(eventCode);
    
    if (eventData) {
      setActiveEvent(eventData); // ✅ Store in global context
      navigate(`/tenant/${eventData.tenantId}/event/${eventData.id}/teams`);
    }
  };
  
  // ...
}
```

**3. Create ProfileModal Component**

```typescript
// src/features/auth/ProfileModal.tsx (NEW FILE)
import { useState } from 'react';
import { useEventContext } from '../../contexts/EventContext';
import { createUser } from '../../services/user.service';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { activeEvent } = useEventContext();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  
  if (!activeEvent) {
    return (
      <div className="modal">
        <h2>Event Required</h2>
        <p>Please enter an event code first.</p>
        <button onClick={() => navigate('/event-code')}>
          Enter Event Code
        </button>
      </div>
    );
  }
  
  const handleSubmit = async () => {
    await createUser({
      displayName,
      email,
      tenantId: activeEvent.tenantId, // ✅ Inherit from event context
      accountType: 'anonymous',
      consentGiven: { /* ... */ },
    });
    
    onClose();
  };
  
  return (
    <div className="modal">
      <h2>Create Profile</h2>
      <p>You're joining: {activeEvent.name}</p>
      <input
        type="text"
        placeholder="Display Name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {/* GDPR consent checkboxes */}
      <button onClick={handleSubmit}>Create Profile</button>
    </div>
  );
}
```

**4. Update Security Rules**

```javascript
// firestore.rules
match /users/{userId} {
  // Users can read their own profile
  allow read: if isOwner(userId);
  
  // Superadmins can read all users
  allow list: if isSuperadmin();
  
  // ✅ FIX: Admins can ONLY query users in their tenants
  allow list: if isAuthenticated() 
              && hasAdminRole()
              && request.query != null
              && request.query.where.contains(['tenantId', '==', getTenantIdFromQuery()])
              && canManageTenant(getTenantIdFromQuery());
}
```

**5. Update StaffList to Filter by Tenant**

```typescript
// StaffList.tsx
useEffect(() => {
  if (!activeTenantId) return;
  
  setLoading(true);

  // ✅ FIX: Only query users in this tenant
  const usersQuery = query(
    collection(db, 'users'),
    where('tenantId', '==', activeTenantId), // ← ADD FILTER
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as User));

    setAllUsers(users);
    setLoading(false);
  });

  return () => unsubscribe();
}, [activeTenantId]); // ← Add dependency
```

#### Pros & Cons

| Aspect | Pro/Con | Details |
|--------|---------|---------|
| ✅ **Clear Ownership** | Pro | User always belongs to a tenant |
| ✅ **Data Isolation** | Pro | Firestore rules can enforce tenant boundaries |
| ✅ **GDPR Compliant** | Pro | Clear data controller (tenant organization) |
| ✅ **Security** | Pro | No cross-tenant data leaks |
| ⚠️ **User Flow** | Con | Requires event code BEFORE profile creation |
| ⚠️ **Migration** | Con | Existing users with `tenantId=undefined` need migration |
| ⚠️ **Edge Cases** | Con | What if user wants to join multiple tenants? |

---

### Approach B: Multi-Tenant User with Primary Tenant

**Concept:** Users can exist across multiple tenants. `User.tenantId` represents "primary tenant" (first joined). Multi-tenant access tracked via `tenantRoles`.

#### Workflow

```
┌─────────────────────────────────────────────────────────┐
│        MULTI-TENANT USER (PRIMARY TENANT APPROACH)       │
└─────────────────────────────────────────────────────────┘

Step 1: User registers WITHOUT event code
├─ Profile creation flow
├─ User.tenantId = null (NO primary tenant yet)
├─ User.role = 'player'
└─ User is "orphaned" temporarily

Step 2: User enters event code "BERLIN2025"
├─ Joins team in Berlin event
├─ System detects: User.tenantId = null
├─ ✅ Auto-assign primary tenant: User.tenantId = "tenant-berlin"
└─ User now "belongs" to Berlin (primary tenant)

Step 3: User enters different event code "MUNICH2025"
├─ Joins team in Munich event
├─ User.tenantId = "tenant-berlin" (unchanged - primary tenant)
├─ TeamMember created: { userId, teamId, tenantId: "tenant-munich" }
└─ User now has presence in BOTH tenants

Step 4: Berlin admin promotes user to moderator
├─ User.tenantRoles['tenant-berlin'] = { role: 'moderator', ... }
├─ User appears in Berlin staff list
└─ User.tenantId remains "tenant-berlin"

Step 5: Munich admin searches for user
├─ Query: users where tenantId = "tenant-munich"
├─ ❌ User NOT in results (tenantId = "tenant-berlin")
├─ Alternative query: users with TeamMembers in Munich events
└─ ✅ User found via TeamMember relationship
```

#### Schema Changes

```typescript
export interface User extends MultiTenantEntity {
  id: string;
  displayName: string;
  email: string;
  
  tenantId: string | null; // ← Allow null (no primary tenant yet)
  
  // Multi-tenant presence tracked separately
  tenantRoles?: {
    [tenantId: string]: TenantRoleAssignment; // Admin roles
  };
  
  // Player participation tracked via TeamMember collection
  // Query: teamMembers where userId = X → get all tenant affiliations
}
```

#### Updated Security Rules

```javascript
match /users/{userId} {
  // Users can read their own profile
  allow read: if isOwner(userId);
  
  // Superadmins can read all users
  allow list: if isSuperadmin();
  
  // ✅ Admins can query users in their tenant (primary OR via roles)
  allow list: if isAuthenticated() 
              && hasAdminRole()
              && (
                // Primary tenant match
                request.query.where.contains(['tenantId', '==', getActiveTenantId()])
                ||
                // Has role in this tenant (via tenantRoles)
                request.query.where.contains(['tenantRoles.' + getActiveTenantId() + '.isActive', '==', true])
              );
}
```

#### StaffList Query Update

```typescript
// StaffList.tsx - All Users Tab
useEffect(() => {
  if (!activeTenantId) return;
  
  setLoading(true);

  // Query 1: Users with primary tenant = activeTenantId
  const primaryTenantQuery = query(
    collection(db, 'users'),
    where('tenantId', '==', activeTenantId),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  
  // Query 2: Users who participated in events in this tenant
  // (via TeamMembers join)
  const participantsQuery = query(
    collection(db, 'teamMembers'),
    where('tenantId', '==', activeTenantId),
    orderBy('joinedAt', 'desc'),
    limit(100)
  );
  
  // Merge results and deduplicate by userId
  // ...
}, [activeTenantId]);
```

#### Pros & Cons

| Aspect | Pro/Con | Details |
|--------|---------|---------|
| ✅ **Flexibility** | Pro | Users can participate in multiple tenants |
| ✅ **Real-World Use Case** | Pro | ESN volunteers travel between cities |
| ✅ **No Forced Event Code** | Pro | User can register first, join events later |
| ⚠️ **Complex Queries** | Con | Need joins to find all users in tenant |
| ⚠️ **Orphaned Users** | Con | Users with `tenantId=null` visible to all |
| ⚠️ **GDPR Ambiguity** | Con | Who is data controller for null tenantId users? |
| ❌ **Security Loophole** | Con | Admins can still query orphaned users |

---

### Approach C: Virtual Tenant for Orphaned Users

**Concept:** Create a special "system" tenant for users who haven't joined any real tenant yet.

#### Workflow

```
┌─────────────────────────────────────────────────────────┐
│         VIRTUAL TENANT FOR ORPHANED USERS                │
└─────────────────────────────────────────────────────────┘

Step 1: User registers without event code
├─ User.tenantId = "tenant-system-orphaned" ✅
├─ User.role = 'player'
└─ User exists but NOT affiliated with real tenant

Step 2: User enters event code and joins team
├─ System detects: User.tenantId = "tenant-system-orphaned"
├─ ✅ Migrate user to real tenant
├─ User.tenantId = "tenant-berlin"
├─ TeamMember created
└─ User now belongs to Berlin

Step 3: Berlin admin searches for users
├─ Query: users where tenantId = "tenant-berlin"
├─ ✅ User found
├─ Query: users where tenantId = "tenant-system-orphaned"
├─ ❌ User NOT found (already migrated)
└─ No orphaned users in results
```

#### Implementation

**1. Create System Tenant**

```typescript
// Migration script or seed data
const systemTenant: Tenant = {
  id: 'tenant-system-orphaned',
  name: 'System (Unaffiliated Users)',
  slug: 'system-orphaned',
  isActive: false, // Not a real tenant
  createdAt: new Date(),
  updatedAt: new Date(),
  tenantId: 'tenant-system-orphaned', // Self-referential
  primaryColor: '#gray',
};
```

**2. Update createUserDocument**

```typescript
export const createUserDocument = onCall({cors: true}, async (request) => {
  const { displayName, email, tenantId, consentGiven } = data;
  
  // ✅ If no tenantId provided, assign to system tenant
  const finalTenantId = tenantId || 'tenant-system-orphaned';
  
  const userData = {
    id: uid,
    displayName,
    tenantId: finalTenantId, // ✅ Never null
    // ...
  };
  
  await userRef.set(userData);
});
```

**3. Auto-Migrate on First Team Join**

```typescript
// functions/src/index.ts - joinTeamSecure
export const joinTeamSecure = onCall({cors: true}, async (request) => {
  // ... existing code ...
  
  const userDoc = await transaction.get(userRef);
  const userData = userDoc.data()!;
  
  // ✅ Migrate from system tenant to real tenant
  if (userData.tenantId === 'tenant-system-orphaned') {
    transaction.update(userRef, {
      tenantId: tenantId, // Use team's tenant
      updatedAt: FieldValue.serverTimestamp(),
    });
    
    console.log(`Migrated user ${userId} from system tenant to ${tenantId}`);
  }
  
  // ... continue with team join ...
});
```

**4. Update Security Rules**

```javascript
match /users/{userId} {
  // System tenant users are NOT visible to regular admins
  allow list: if isAuthenticated() 
              && hasAdminRole()
              && request.query.where.contains(['tenantId', '==', getActiveTenantId()])
              && getActiveTenantId() != 'tenant-system-orphaned'; // ✅ Block system tenant queries
}
```

#### Pros & Cons

| Aspect | Pro/Con | Details |
|--------|---------|---------|
| ✅ **No Null TenantId** | Pro | All users have valid tenantId |
| ✅ **Clear Isolation** | Pro | System users not visible to admins |
| ✅ **Auto-Migration** | Pro | Users seamlessly move to real tenant |
| ✅ **Backward Compatible** | Pro | Existing code works (tenantId always string) |
| ⚠️ **Extra Complexity** | Con | System tenant is a special case |
| ⚠️ **Migration Logic** | Con | Need to handle tenant transfer |
| ⚠️ **Edge Cases** | Con | What if user joins multiple tenants? See multi-tenant analysis below |

---

## Multi-Tenant User Journey Analysis: George's Story

### Scenario: User Joins Multiple Events Across Different Tenants

**George's Profile:**
- Real user who travels between cities
- Wants to participate in Berlin event (gets promoted to admin)  
- Later wants to join Munich event as a player

This analysis shows how cross-tenant participation works in **Approach A** vs **Approach D**.

---

### George's Journey in Both Approaches

```
═══════════════════════════════════════════════════════════════
PHASE 1: BERLIN (FIRST TENANT) - IDENTICAL IN BOTH APPROACHES
═══════════════════════════════════════════════════════════════

T=0: George enters "BERLIN2025" event code
     ├─ EventCodeEntry validates → tenantId = "tenant-berlin"
     └─ Navigates to team browser

T=1: George creates profile (first time)
     ├─ ProfileModal opens
     ├─ Fills: displayName="George", email="george@example.com"
     └─ User document created:
         ├─ User.tenantId = "tenant-berlin" ✅
         ├─ User.role = "player"  
         ├─ User.tenantRoles = {}
         └─ User.participatingTenantIds = ["tenant-berlin"] (if using enhancement)

T=2: George joins Team Alpha in Berlin
     └─ TeamMember created: { userId, teamId, tenantId: "tenant-berlin" }

T=3: Berlin admin promotes George to admin
     └─ User.tenantRoles["tenant-berlin"] = { role: "admin", ... }
     └─ Custom Claims: { role: "admin", tr: { "tenant-berlin": "admin" } }

═══════════════════════════════════════════════════════════════
PHASE 2: MUNICH (CROSS-TENANT) - WHERE APPROACHES DIFFER
═══════════════════════════════════════════════════════════════

T=4: George travels to Munich, enters "MUNICH2025"
     ├─ EventCodeEntry validates → tenantId = "tenant-munich"  
     ├─ George already authenticated ✅
     └─ Navigates to Munich team browser

T=5: George clicks "Join Team Omega" in Munich

     ┌─────────────────────────────────────────────┐
     │ APPROACH A: Event-First (Basic)            │
     └─────────────────────────────────────────────┘
     
     Option A1: BLOCK cross-tenant join (strict)
     ├─ joinTeamSecure checks: userData.tenantId !== teamData.tenantId
     ├─ Error: "You belong to Berlin. Can't join Munich."
     └─ ❌ George BLOCKED - must choose one tenant only
     
     Option A2: ALLOW cross-tenant join (flexible) ✅
     ├─ joinTeamSecure allows different tenantId
     ├─ User.tenantId remains "tenant-berlin" (primary, immutable)
     ├─ TeamMember created: { userId, teamId, tenantId: "tenant-munich" }
     └─ ✅ George participates in BOTH tenants
     
     Result:
     ├─ User.tenantId = "tenant-berlin" (unchanged)
     ├─ TeamMembers: Berlin + Munich ✅
     └─ BUT: Munich admin can't find George easily ❌
             (query by tenantId won't find him)
     
     
     ┌─────────────────────────────────────────────┐
     │ APPROACH D: Hybrid (With Enhancements)      │
     └─────────────────────────────────────────────┘
     
     Same as Approach A2, BUT with enhancement:
     ├─ joinTeamSecure detects cross-tenant join
     ├─ Updates: User.participatingTenantIds.push("tenant-munich")
     ├─ User.tenantId remains "tenant-berlin" (primary)
     └─ ✅ Munich admin CAN find George via participatingTenantIds

T=6: Munich admin searches for George

     APPROACH A:
     └─ Query: where('tenantId', '==', 'tenant-munich')  
     └─ ❌ George NOT found (tenantId = "tenant-berlin")
     └─ Must use complex TeamMember join query

     APPROACH D (with enhancement):
     └─ Query: where('participatingTenantIds', 'array-contains', 'tenant-munich')
     └─ ✅ George FOUND immediately!

T=7: Munich admin promotes George to moderator

     BOTH APPROACHES (same):
     ├─ assignRole({ userId: "george_123", tenantId: "tenant-munich", role: "moderator" })
     ├─ User.tenantRoles["tenant-munich"] = { role: "moderator", ... }
     └─ Custom Claims: { role: "admin", tr: { "berlin": "admin", "munich": "moderator" } }

═══════════════════════════════════════════════════════════════
GEORGE'S FINAL STATE
═══════════════════════════════════════════════════════════════

User Document:
├─ User.id = "george_123"
├─ User.tenantId = "tenant-berlin" (primary, first joined)
├─ User.role = "player" (Deprecated field)
├─ User.highestRole = "admin" (Cached from tenantRoles)
├─ User.tenantRoles = {
│     "tenant-berlin": { role: "admin", isActive: true, ... },
│     "tenant-munich": { role: "moderator", isActive: true, ... }
│   }
└─ User.participatingTenantIds = ["tenant-berlin", "tenant-munich"] (Approach D only)

TeamMember Documents:
├─ TeamMember 1: { userId: "george_123", tenantId: "tenant-berlin", teamId: "team-alpha" }
└─ TeamMember 2: { userId: "george_123", tenantId: "tenant-munich", teamId: "team-omega" }

Firebase Custom Claims:
{
  role: "admin",
  tr: {
    "tenant-berlin": "admin",
    "tenant-munich": "moderator"
  },
  tenantIds: ["tenant-berlin", "tenant-munich"],
  sa: false
}
```

---

### Comparison: How Each Approach Handles George

| Feature | Approach A (Basic) | Approach D (Enhanced) | Winner |
|---------|-------------------|----------------------|--------|
| **Initial Berlin Registration** | ✅ Event-based, simple | ✅ Event-based, simple | Tie |
| **Cross-Tenant Join (Munich)** | ⚠️ Allowed but hidden | ✅ Allowed + tracked | D |
| **Munich Admin Finding George** | ❌ Complex join query needed | ✅ Simple array-contains query | D |
| **George has roles in both** | ✅ Via tenantRoles | ✅ Via tenantRoles | Tie |
| **Query Efficiency** | 🔴 3-5 reads per search | 🟢 1 read per search | D |
| **Primary Tenant** | ⚠️ Immutable (Berlin forever) | ✅ Can be migrated | D |
| **GDPR Data Controller** | ⚠️ Ambiguous (Berlin or Munich?) | ✅ Clear (primary tenant) | D |
| **Implementation Complexity** | 🟢 Lower | 🟡 Medium (+1 field) | A |

---

### Critical Issue: StaffList Cannot Find Cross-Tenant Users

**Problem in Approach A:**
```typescript
// Current StaffList.tsx "All Users" query
const usersQuery = query(
  collection(db, 'users'),
  where('tenantId', '==', activeTenantId), // ← ONLY finds primary tenant users!
  orderBy('createdAt', 'desc')
);

// Munich admin searches → George NOT in results ❌
// (George's tenantId = "tenant-berlin", not "tenant-munich")
```

**Solution for Approach D:**
```typescript
// Enhanced User schema
export interface User {
  tenantId: string; // Primary tenant (first joined)
  tenantRoles?: { [tenantId: string]: TenantRoleAssignment };
  participatingTenantIds?: string[]; // NEW: All tenants user joined ✅
}

// Enhanced StaffList query
const usersQuery = query(
  collection(db, 'users'),
  where('participatingTenantIds', 'array-contains', activeTenantId), // ✅ Finds George!
  orderBy('createdAt', 'desc')
);

// Munich admin searches → George FOUND ✅
```

---

### Enhanced Implementation: Approach D + participatingTenantIds

**Schema Addition:**
```typescript
export interface User extends MultiTenantEntity {
  // ... existing fields ...
  
  tenantId: string; // Primary tenant (first joined, can be migrated)
  
  tenantRoles?: {
    [tenantId: string]: TenantRoleAssignment; // Admin roles per tenant
  };
  
  // NEW: Denormalized tenant tracking for efficient queries
  participatingTenantIds?: string[]; // All tenants user has joined events in
  
  // ... other fields ...
}
```

**Update joinTeamSecure Cloud Function:**
```typescript
export const joinTeamSecure = onCall({cors: true}, async (request) => {
  // ... existing validation ...
  
  const { teamId, eventId, tenantId } = request.data;
  const userId = request.auth.uid;
  
  await db.runTransaction(async (transaction) => {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await transaction.get(userRef);
    const userData = userDoc.data()!;
    
    // Check if user is joining a different tenant
    const participatingTenants = userData.participatingTenantIds || [];
    
    if (!participatingTenants.includes(tenantId)) {
      // First time joining this tenant - add to tracking
      transaction.update(userRef, {
        participatingTenantIds: FieldValue.arrayUnion(tenantId), // ✅ Add tenant
        updatedAt: FieldValue.serverTimestamp(),
      });
      
      console.log(`User ${userId} now participating in tenant ${tenantId}`);
    }
    
    // Create TeamMember as usual
    // ...
  });
});
```

**Update StaffList Component:**
```typescript
// StaffList.tsx - "All Users" tab
useEffect(() => {
  if (!activeTenantId) return;
  
  setLoading(true);

  // NEW: Query users who participate in this tenant
  const usersQuery = query(
    collection(db, 'users'),
    where('participatingTenantIds', 'array-contains', activeTenantId), // ✅ Efficient!
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  const unsubscribe = onSnapshot(usersQuery, (snapshot) => {
    const users = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as User));

    setAllUsers(users);
    setLoading(false);
  });

  return () => unsubscribe();
}, [activeTenantId]);

// Result: Munich admin sees George in "All Users" list ✅
```

---

### Optional: Primary Tenant Migration

**Use Case:** George moves permanently from Berlin to Munich

```typescript
// NEW Cloud Function
export const migrateUserPrimaryTenant = onCall({cors: true}, async (request) => {
  const { userId, newTenantId, reason } = request.data;
  const callerId = request.auth?.uid;
  
  // Security: User themselves OR admin in new tenant
  const isUserSelf = callerId === userId;
  const isAdmin = request.auth?.token?.tr?.[newTenantId] === 'admin';
  
  if (!isUserSelf && !isAdmin) {
    throw new HttpsError('permission-denied', 'Cannot migrate user');
  }
  
  // Validate user has presence in new tenant
  const userDoc = await db.collection('users').doc(userId).get();
  const userData = userDoc.data()!;
  
  const participatesInNewTenant = userData.participatingTenantIds?.includes(newTenantId);
  const hasRoleInNewTenant = userData.tenantRoles?.[newTenantId]?.isActive;
  
  if (!participatesInNewTenant && !hasRoleInNewTenant) {
    throw new HttpsError('failed-precondition', 
      'User has no activity in target tenant');
  }
  
  // Perform migration
  await db.collection('users').doc(userId).update({
    tenantId: newTenantId, // ✅ Change primary tenant
    updatedAt: FieldValue.serverTimestamp(),
  });
  
  // Audit log
  await db.collection('tenantMigrations').add({
    userId,
    fromTenantId: userData.tenantId,
    toTenantId: newTenantId,
    reason,
    migratedBy: callerId,
    migratedAt: FieldValue.serverTimestamp(),
  });
  
  return { success: true, newPrimaryTenant: newTenantId };
});
```

**UI Flow:**
```
George opens profile settings
├─ Sees: "Primary Organization: ESN Berlin"
├─ Sees: "Participating Organizations: ESN Berlin, ESN Munich"
├─ Clicks: "Change Primary Organization"
├─ Modal: "Select new primary organization:"
│   ├─ ○ ESN Berlin (current)
│   └─ ● ESN Munich ✅
├─ Confirms migration
└─ User.tenantId updated to "tenant-munich"
```

---

### Recommendations

**For Approach D (Hybrid):**

1. **Add `participatingTenantIds` field** ✅ CRITICAL
   - Solves cross-tenant user discovery
   - Enables efficient StaffList queries
   - Single Firestore read vs 3-query join

2. **Implement primary tenant migration** ⚠️ OPTIONAL
   - Allows users to change "home" tenant
   - Important for GDPR (correct data controller)
   - Use cases: permanent relocation, organizational changes

3. **Update Firestore security rules** ✅ REQUIRED
   ```javascript
   match /users/{userId} {
     allow list: if isAuthenticated() 
                 && hasAdminRole()
                 && (
                   // Primary tenant match
                   request.query.where.contains(['tenantId', '==', getActiveTenantId()])
                   ||
                   // Participating tenant match (NEW)
                   request.query.where.contains(['participatingTenantIds', 'array-contains', getActiveTenantId()])
                 );
   }
   ```

4. **Display cross-tenant participation in UI**
   ```tsx
   // UserCard in StaffList
   <div className="user-card">
     <h3>{user.displayName}</h3>
     <p>Primary: {getTenantName(user.tenantId)}</p>
     {user.participatingTenantIds.length > 1 && (
       <p className="text-sm text-gray-600">
         Also in: {user.participatingTenantIds
           .filter(id => id !== user.tenantId)
           .map(id => getTenantName(id))
           .join(', ')
         }
       </p>
     )}
     <p>Role: {user.tenantRoles[activeTenantId]?.role || 'Player'}</p>
   </div>
   ```

---

### Approach D: Hybrid - Event-First + Virtual Tenant Fallback

**Concept:** Combine Approach A (event-first) with Approach C (virtual tenant) as safety net.

#### Workflow

```
Primary Path (95% of users):
1. User enters event code
2. Profile inherits tenantId from event
3. ✅ User belongs to real tenant from start

Fallback Path (5% of users - edge cases):
1. User somehow registers without event code
2. User.tenantId = "tenant-system-orphaned"
3. User joins event later
4. Auto-migrate to real tenant
5. ✅ User now belongs to real tenant
```

#### Implementation

**ProfileModal Logic:**

```typescript
export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { activeEvent } = useEventContext();
  
  const handleSubmit = async () => {
    // Prefer event tenant, fallback to system tenant
    const tenantId = activeEvent?.tenantId || 'tenant-system-orphaned';
    
    await createUser({
      displayName,
      email,
      tenantId, // ✅ Always has a value
      accountType: 'anonymous',
      consentGiven: { /* ... */ },
    });
    
    if (tenantId === 'tenant-system-orphaned') {
      console.warn('User created in system tenant - will migrate on first event join');
    }
    
    onClose();
  };
  
  return <div>...</div>;
}
```

#### Pros & Cons

| Aspect | Pro/Con | Details |
|--------|---------|---------|
| ✅ **Best of Both Worlds** | Pro | Event-first preferred, fallback for edge cases |
| ✅ **Robust** | Pro | Handles all user flows |
| ✅ **No Orphaned Users** | Pro | System tenant catches stragglers |
| ✅ **GDPR Compliant** | Pro | System tenant controlled by platform |
| ⚠️ **Most Complex** | Con | Two mechanisms to maintain |

---

## Comparison Matrix

| Approach | Data Isolation | User Flexibility | Implementation Effort | GDPR Compliance | Migration Difficulty |
|----------|----------------|------------------|----------------------|-----------------|---------------------|
| **A: Event-First** | ✅ Perfect | ⚠️ Medium | 🟢 Low (2 days) | ✅ Clear | 🟡 Medium |
| **B: Multi-Tenant User** | ⚠️ Complex | ✅ High | 🟡 Medium (4 days) | ⚠️ Ambiguous | 🔴 High |
| **C: Virtual Tenant** | ✅ Good | ⚠️ Medium | 🟡 Medium (3 days) | ✅ Clear | 🟢 Low |
| **D: Hybrid** | ✅ Perfect | ✅ High | 🟡 Medium (3 days) | ✅ Clear | 🟢 Low |

---

## Recommended Solution

### 🏆 **Approach D: Hybrid (Event-First + Virtual Tenant Fallback)**

#### Why This Choice?

1. **Security First**
   - No cross-tenant data leaks
   - Firestore rules can enforce tenant boundaries
   - System tenant provides safety net without exposing users

2. **Real-World User Flow**
   - 95% of users enter event code first (happy path)
   - 5% edge cases handled gracefully (fallback)
   - Auto-migration on first event join

3. **GDPR Compliance**
   - Clear data controller for all users
   - System tenant owned by platform
   - Real tenants own their users after migration

4. **Implementable**
   - Moderate complexity (3 days effort)
   - Low migration risk (backward compatible)
   - Clear rollback path

#### Implementation Plan (3 Days)

**Day 1: Core Infrastructure**
1. Create EventContext provider (2 hours)
2. Update EventCodeEntry to store context (1 hour)
3. Create system tenant in Firestore (30 min)
4. Update createUserDocument to use fallback tenant (1 hour)
5. Create ProfileModal component (3 hours)

**Day 2: Auto-Migration Logic**
1. Update joinTeamSecure to detect system tenant (2 hours)
2. Implement tenant migration logic (2 hours)
3. Add audit logging for migrations (1 hour)
4. Update Firestore security rules (2 hours)

**Day 3: UI Updates & Testing**
1. Update StaffList to filter by tenant (2 hours)
2. Update AdminDashboard queries (1 hour)
3. Add migration for existing orphaned users (2 hours)
4. Integration testing (2 hours)

---

## Migration Strategy for Existing Users

### Current State Assessment

```sql
-- Hypothetical query to find orphaned users
SELECT COUNT(*) FROM users WHERE tenantId IS NULL OR tenantId = '';
-- Result: ? users (need to check in production)
```

### Migration Script

```typescript
// scripts/migrateOrphanedUsers.ts
import { db } from './firebase-admin';

async function migrateOrphanedUsers() {
  const orphanedQuery = db.collection('users')
    .where('tenantId', '==', null)
    .get();
  
  const users = (await orphanedQuery).docs;
  
  console.log(`Found ${users.length} orphaned users`);
  
  for (const userDoc of users) {
    const userId = userDoc.id;
    const userData = userDoc.data();
    
    // Strategy 1: Try to infer tenant from TeamMember records
    const teamMemberships = await db.collection('teamMembers')
      .where('userId', '==', userId)
      .orderBy('joinedAt', 'asc')
      .limit(1)
      .get();
    
    let assignedTenantId = 'tenant-system-orphaned';
    
    if (!teamMemberships.empty) {
      const firstMembership = teamMemberships.docs[0].data();
      assignedTenantId = firstMembership.tenantId;
      console.log(`Inferred tenant ${assignedTenantId} for user ${userId}`);
    } else {
      console.log(`No team history for user ${userId}, assigning to system tenant`);
    }
    
    // Update user
    await db.collection('users').doc(userId).update({
      tenantId: assignedTenantId,
      updatedAt: new Date(),
    });
    
    console.log(`✅ Migrated user ${userId} to ${assignedTenantId}`);
  }
  
  console.log('Migration complete!');
}

// Run migration
migrateOrphanedUsers().catch(console.error);
```

---

## Security Checklist

After implementing Approach D, verify:

- [ ] No user has `tenantId = null` or `tenantId = undefined`
- [ ] All users have `tenantId = 'tenant-system-orphaned'` OR real tenant ID
- [ ] Firestore rules block cross-tenant user queries
- [ ] StaffList "All Users" tab only shows users in active tenant
- [ ] System tenant users are NOT visible to regular admins
- [ ] Superadmins CAN see system tenant users (for cleanup)
- [ ] Auto-migration triggers on first team join
- [ ] Audit log records tenant migrations
- [ ] GDPR data export includes correct tenant affiliation

---

## Open Questions for Stakeholders

1. **User Registration Without Event Code**
   - Should we FORCE users to enter event code before registration?
   - Or allow "orphaned" registration with system tenant fallback?
   - **Recommendation:** Allow fallback (Approach D)

2. **Multi-Tenant User Presence**
   - Can a user belong to multiple tenants simultaneously?
   - If yes, what does `User.tenantId` represent?
   - **Recommendation:** Primary tenant (first joined)

3. **System Tenant Cleanup**
   - Should system tenant users be auto-deleted after 30 days?
   - Or kept indefinitely until they join a real tenant?
   - **Recommendation:** Keep for 90 days, then send reminder email

4. **Admin Cross-Tenant Search**
   - Should superadmins be able to search across ALL tenants?
   - Or only within their assigned tenants?
   - **Recommendation:** Superadmins only (for user support)

5. **Tenant Migration Reversibility**
   - Can users request to change their primary tenant?
   - What happens to their team history in old tenant?
   - **Recommendation:** No reversal, tenantId is immutable after first event join

---

## Conclusion

The current multi-tenant system has a **critical architectural flaw**: users can be created without tenant assignment, violating data isolation principles.

**Immediate Action Required:**
1. Implement **Approach D (Hybrid)**
2. Create system tenant as safety net
3. Add EventContext to capture tenant during registration
4. Update security rules to prevent cross-tenant leaks
5. Migrate existing orphaned users (if any)

**Timeline:** 3 days implementation + 1 day testing = **4 days total**

**Risk Level:** 🔴 **CRITICAL** - Current state allows privacy violations

**Status:** 📊 Analysis Complete - Awaiting approval to proceed with implementation

---

**Document Version:** 1.0  
**Last Updated:** December 30, 2025  
**Author:** GitHub Copilot (AI Analysis)  
**Reviewers:** Product Manager, Lead Developer, Security Engineer
