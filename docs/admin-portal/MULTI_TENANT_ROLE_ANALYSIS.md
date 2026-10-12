# Multi-Tenant Role Management System: Critical Analysis & Recommendations

**Date:** December 30, 2025  
**Analysis Type:** System Architecture Review  
**Status:** Critical Issues Identified  
**Priority:** High - Immediate Action Required

---

## Executive Summary

After analyzing the current multi-tenant role structure, schema design, and implementation patterns, **critical architectural inconsistencies have been identified** that pose security, data integrity, and user experience risks.

### Key Findings

🔴 **CRITICAL ISSUES:**
1. **Dual Schema Implementation** - System uses BOTH `managedTenantIds` (legacy) AND `tenantRoles` (new) simultaneously
2. **Inconsistent Data Access Patterns** - Some pages use old schema, others use new schema
3. **Missing Tenant Context Validation** - Operations can occur without valid activeTenantId
4. **User.tenantId Ambiguity** - "Home tenant" concept conflicts with multi-tenant role system

🟡 **MODERATE ISSUES:**
5. **Full Page Reload on Context Switch** - Poor UX, loses application state
6. **Anonymous User Role Assignment Prevention** - Good security, but no upgrade path documented
7. **No Role Conflict Resolution** - What happens when user is admin in Tenant A but player in Tenant B?

✅ **STRENGTHS:**
- Hybrid Expanded User schema is conceptually sound
- Cloud Functions properly update `tenantRoles`
- Firestore security rules correctly check Custom Claims
- Audit logging is comprehensive

---

## 1. System Architecture Overview

### Current Implementation Status

```
┌─────────────────────────────────────────────────────────────┐
│              MULTI-TENANT ROLE SYSTEM                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User Document (Hybrid Schema)                             │
│  ├─ tenantId: string ← "Home tenant" (AMBIGUOUS)          │
│  ├─ role: Role ← Highest global role (CACHED)             │
│  ├─ managedTenantIds: string[] ← LEGACY FIELD ⚠️          │
│  ├─ tenantRoles: {                                         │
│  │    [tenantId]: TenantRoleAssignment ← NEW FIELD ✅      │
│  │    }                                                    │
│  ├─ highestRole: Role ← CACHED ✅                          │
│  └─ isSuperadmin: boolean ← Global flag ✅                 │
│                                                             │
│  Firebase Custom Claims (Authoritative)                    │
│  ├─ role: string ← Highest role ✅                         │
│  ├─ tenantIds: string[] ← Active tenants ✅                │
│  ├─ tr: { [tenantId]: role } ← Per-tenant map ✅          │
│  └─ sa: boolean ← Superadmin flag ✅                       │
│                                                             │
│  AdminStore (Client State)                                 │
│  ├─ activeTenantId: string | null ← Context ✅            │
│  ├─ availableTenants: TenantContext[] ← List ✅           │
│  └─ adminProfile: User | null ← Cached user ✅             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Login → Cloud Function → Firestore Update → Custom Claims Update
     ↓              ↓                ↓                    ↓
  Firebase      assignRole/      User.tenantRoles    auth.token.tr
   Auth         revokeRole       [tenantId]          [tenantId]
     ↓              ↓                ↓                    ↓
  Frontend    useAdminAuth      AdminStore.set    Security Rules
  receives    fetches User      activeTenantId    check claims
```

---

## 2. Critical Issue #1: Dual Schema Implementation

### Problem Description

The system implements BOTH the old schema (`managedTenantIds`) AND the new schema (`tenantRoles`) simultaneously, leading to **data inconsistency and confusion**.

### Evidence

#### User Interface (schema.ts lines 132-141)
```typescript
export interface User extends MultiTenantEntity {
  // ... other fields ...
  
  // Admin-Specific Fields (optional, only set for admin roles)
  managedTenantIds?: string[]; // ⚠️ LEGACY - still in schema
  isActive?: boolean;
  
  // Multi-Tenant Role Management
  tenantRoles?: {                // ✅ NEW - the intended approach
    [tenantId: string]: TenantRoleAssignment;
  };
  
  highestRole?: 'superadmin' | 'admin' | 'organizer' | 'moderator' | 'player';
  isSuperadmin?: boolean;
}
```

#### Admin Pages STILL USE Legacy Schema

**EventList.tsx (lines 38-41):**
```typescript
} else if (adminProfile.managedTenantIds && adminProfile.managedTenantIds.length > 0) {
  eventQuery = query(
    collection(db, 'events'),
    where('tenantId', 'in', adminProfile.managedTenantIds), // ⚠️ USING OLD FIELD
    orderBy('startDate', 'desc')
  );
```

**AdminDashboard.tsx (lines 37-40, 93-94):**
```typescript
} else if (adminProfile.managedTenantIds && adminProfile.managedTenantIds.length > 0) {
  eventsQuery = query(
    collection(db, 'events'),
    where('tenantId', 'in', adminProfile.managedTenantIds) // ⚠️ USING OLD FIELD
  );
}

// Display count:
{adminProfile.managedTenantIds && adminProfile.managedTenantIds.length > 0
  ? `Managing ${adminProfile.managedTenantIds.length} tenant(s)` // ⚠️ USING OLD FIELD
  : 'No tenants assigned'}
```

**TaskForm.tsx (lines 191, 289):**
```typescript
const tenantId = adminProfile.managedTenantIds?.[0]; // ⚠️ USING OLD FIELD

if (!adminProfile.managedTenantIds || adminProfile.managedTenantIds.length === 0) {
  // Error handling
}
```

#### Cloud Functions USE New Schema Correctly

**assignRole.ts (lines 106-129):**
```typescript
// 7. Update tenantRoles[tenantId]
const tenantRoles = userData.tenantRoles || {}; // ✅ CORRECT
const previousRole = tenantRoles[tenantId]?.role || null;

tenantRoles[tenantId] = roleAssignment;

// 8. Recalculate highestRole
const highestRole = calculateHighestRole(tenantRoles, userData.isSuperadmin || false);

// 9. Update Firestore
await userRef.update({
  tenantRoles: tenantRoles, // ✅ WRITES TO NEW FIELD
  highestRole: highestRole,
  updatedAt: FieldValue.serverTimestamp(),
});
```

### Impact

| Impact Area | Severity | Description |
|------------|----------|-------------|
| **Data Integrity** | 🔴 Critical | `managedTenantIds` may not reflect actual role assignments |
| **Query Accuracy** | 🔴 Critical | EventList/Dashboard show wrong events if `managedTenantIds` is stale |
| **Developer Confusion** | 🟡 High | Which field is the source of truth? |
| **Migration Risk** | 🟡 High | Can't safely remove `managedTenantIds` without breaking UI |
| **Security** | 🟠 Medium | If fields diverge, access control may fail |

### Reproduction Steps

1. Create user via Cloud Function (writes to `tenantRoles`)
2. User assigned admin role in Tenant A via `assignRole` function
3. `tenantRoles['tenant-a'] = { role: 'admin', ... }` ✅ Updated
4. `managedTenantIds = []` ⚠️ **NOT updated**
5. Admin opens EventList page
6. Query uses `managedTenantIds` → returns 0 events ❌

### Root Cause

**Migration incomplete** - Cloud Functions migrated to new schema, but frontend UI still uses old schema.

---

## 3. Critical Issue #2: Missing Tenant Context Validation

### Problem Description

Operations can be performed without a valid `activeTenantId`, leading to undefined behavior and potential cross-tenant data access.

### Evidence

#### AdminStore Initial State (adminStore.ts line 68)
```typescript
export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      // Initial State
      adminProfile: null,
      isAdminMode: false,
      activeTenantId: null, // ⚠️ CAN BE NULL even when user has tenants
      availableTenants: [],
```

#### setAdminProfile Logic (adminStore.ts lines 73-91)
```typescript
setAdminProfile: (profile) => {
  if (!profile) {
    set({ 
      adminProfile: null,
      activeTenantId: null,
      availableTenants: [],
    });
    return;
  }
  
  // Auto-select first tenant if admin has any active roles
  const tenantRoles = profile.tenantRoles || {};
  const activeTenantIds = Object.keys(tenantRoles).filter(
    tid => tenantRoles[tid].isActive
  );
  
  set({ 
    adminProfile: profile,
    activeTenantId: activeTenantIds[0] || null, // ⚠️ What if activeTenantIds is empty?
  });
},
```

#### No Validation Before Operations

**EventList.tsx query construction:**
```typescript
const { adminProfile } = useAdminAuth();

// ⚠️ NO CHECK if activeTenantId is valid or set
let eventQuery;
if (adminProfile?.role === 'superadmin') {
  // Show all events
} else if (adminProfile.managedTenantIds && adminProfile.managedTenantIds.length > 0) {
  eventQuery = query(
    collection(db, 'events'),
    where('tenantId', 'in', adminProfile.managedTenantIds),
    // ⚠️ What if managedTenantIds is empty but tenantRoles has data?
  );
}
```

### Impact

| Scenario | Current Behavior | Expected Behavior |
|----------|------------------|-------------------|
| **User has no tenants** | `activeTenantId = null` → pages may crash or show empty state | Show "No tenants assigned" error page |
| **User has expired roles** | `activeTenantId = null` → appears like they have access | Show "All roles expired" message |
| **User switches tenant** | Page reloads → activeTenantId persisted, but may not validate | Validate tenant access before allowing switch |
| **User promoted to first tenant** | May not auto-select tenant → stuck in limbo | Auto-select and redirect to dashboard |

### Recommendation

Add validation layer:

```typescript
// NEW: AdminGuard component
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { adminProfile, activeTenantId, availableTenants } = useAdminStore();
  
  // Check 1: User has admin profile
  if (!adminProfile) {
    return <Navigate to="/login" />;
  }
  
  // Check 2: User has at least one active tenant (unless superadmin)
  if (!adminProfile.isSuperadmin && availableTenants.length === 0) {
    return (
      <div className="text-center p-8">
        <h2>No Active Tenants</h2>
        <p>You don't have access to any organizations yet.</p>
        <p>Contact your administrator to get assigned.</p>
      </div>
    );
  }
  
  // Check 3: activeTenantId is set (or superadmin viewing global dashboard)
  if (!adminProfile.isSuperadmin && !activeTenantId) {
    return (
      <div className="text-center p-8">
        <h2>No Tenant Selected</h2>
        <p>Please select an organization from the dropdown.</p>
      </div>
    );
  }
  
  return <>{children}</>;
}
```

---

## 4. Critical Issue #3: User.tenantId Ambiguity

### Problem Description

The `User.tenantId` field (inherited from `MultiTenantEntity`) represents the "home tenant" (first tenant user joined), but this conflicts with the multi-tenant role system where users can have different roles in different tenants.

### Evidence

#### Schema Definition (schema.ts lines 7-12)
```typescript
/**
 * Base interface for all multi-tenant entities
 * Every document MUST include tenantId for data isolation
 */
export interface MultiTenantEntity {
  tenantId: string; // ⚠️ What does this mean for User documents?
  createdAt: Date;
  updatedAt: Date;
}
```

#### User Interface (schema.ts line 118)
```typescript
export interface User extends MultiTenantEntity {
  id: string; // Firebase Auth UID
  // ... other fields ...
  tenantId: string; // ← From MultiTenantEntity (HOME TENANT?)
}
```

#### Conceptual Conflict

```
Scenario: Alice joins ESN Berlin as a player
├─ User.tenantId = 'tenant-berlin' ← "Home tenant"
├─ User.role = 'player'
└─ User.tenantRoles = {} ← Empty (she's just a player)

Later: Alice promoted to admin in ESN Munich
├─ User.tenantId = 'tenant-berlin' ← STILL Berlin (doesn't change)
├─ User.tenantRoles = {
│    'tenant-munich': { role: 'admin', ... }
│  }
└─ User.highestRole = 'admin'

Question: What does User.tenantId represent now?
- Her "home" tenant? (Berlin)
- Her current active tenant? (Munich)
- The first tenant where she was a player? (Berlin)
- The tenant that "owns" her data? (Unclear)
```

### Impact

| Issue | Description | Risk Level |
|-------|-------------|-----------|
| **Firestore Rules Confusion** | Rules may check `tenantId` field thinking it's the active tenant | 🔴 Critical |
| **Data Isolation Violation** | If `tenantId` is used for filtering, may show wrong data | 🔴 Critical |
| **Query Inconsistency** | Some queries filter by `tenantId`, others by `tenantRoles` keys | 🟡 High |
| **Team Assignment Logic** | When user joins team, which tenantId to use? | 🟡 High |
| **Player vs Admin Context** | User playing in Berlin but admin in Munich - which tenant is "theirs"? | 🟠 Medium |

### Firestore Rules Concern

**Current rule (firestore.rules lines 26-28):**
```javascript
function belongsToTenant(tenantId) {
  return request.resource.data.tenantId == tenantId;
}
```

**Question:** When checking `belongsToTenant()` for a User document:
- Should it check `User.tenantId` (home tenant)?
- Or should it check if `tenantId` exists in `User.tenantRoles`?
- Or should User documents NOT have `tenantId` at all?

### Recommendation

**Option A: Remove User.tenantId** (Breaking Change)
```typescript
// User does NOT extend MultiTenantEntity
export interface User {
  id: string;
  // ... all other fields ...
  // NO tenantId field
  
  tenantRoles?: {
    [tenantId: string]: TenantRoleAssignment;
  };
}
```

**Pros:**
- ✅ Clear semantics - User is a global entity
- ✅ No confusion about "home tenant" concept
- ✅ Security rules become clearer

**Cons:**
- ❌ Breaking change - requires migration
- ❌ Violates MultiTenantEntity pattern used everywhere else
- ❌ Complicates "List all users in tenant" queries

**Option B: Redefine User.tenantId as "Primary Tenant"** (Recommended)
```typescript
export interface User extends MultiTenantEntity {
  id: string;
  // ... fields ...
  
  tenantId: string; // ← PRIMARY tenant (first joined, or most active)
  
  tenantRoles?: {
    [tenantId: string]: TenantRoleAssignment;
  };
}
```

**Semantics:**
- `User.tenantId` = Primary tenant for billing/ownership purposes
- Used for admin dashboard default view (if user has no roles elsewhere)
- Used for player gameplay context
- NOT used for role-based access control (use `tenantRoles` instead)

**Update Firestore Rules:**
```javascript
// User access: Owner OR admin in ANY tenant user has role in
match /users/{userId} {
  allow read: if isUserOwner(userId) 
              || isSuperadmin()
              || hasAdminRoleInAnyUserTenant(userId);
  
  allow write: if isUserOwner(userId)
               || isSuperadmin()
               || canManageTenant(resource.data.tenantId); // Primary tenant admin can edit
}
```

**Option C: Separate User and AdminUser** (Most Radical)
```typescript
// Player users
collection: users
- tenantId: string (home tenant for gameplay)
- role: 'player' only
- No tenantRoles field

// Admin users
collection: adminUsers
- NO tenantId (global entity)
- tenantRoles: { [tenantId]: TenantRoleAssignment }
- Can also have player account in users collection (linked via linkedAccountId)
```

**Verdict:** **Option B** - Least disruptive, maintains consistency, clear documentation.

---

## 5. Moderate Issue #4: Full Page Reload on Tenant Switch

### Problem Description

When admin switches tenant context, the entire page reloads (`window.location.reload()`), causing poor UX and loss of application state.

### Evidence

**adminStore.ts (lines 117-127):**
```typescript
switchTenant: (tenantId) => {
  const { canManageTenant } = get();
  
  if (!canManageTenant(tenantId)) {
    console.error(`Cannot switch to tenant ${tenantId} - access denied`);
    return;
  }
  
  // Update state
  set({ activeTenantId: tenantId });
  
  // Reload page to prevent state leakage between tenants
  // This ensures clean slate for the new tenant context
  window.location.reload(); // ⚠️ FULL PAGE RELOAD
},
```

### Impact

| UX Issue | User Experience | Business Impact |
|----------|----------------|-----------------|
| **Slow switching** | 2-3 second delay (full page load) | Frustrating for multi-tenant admins |
| **Lost form data** | User filling out event form → switches tenant → form cleared | Data loss |
| **Lost scroll position** | User browsing submissions → switches → back to top | Inefficient workflow |
| **No loading feedback** | Page just refreshes without explanation | Confusing |
| **Network overhead** | Re-downloads all assets | Wastes bandwidth |

### User Story Examples

#### Story 1: ESN International Coordinator
```
Alice manages 5 ESN chapters (Berlin, Munich, Hamburg, Cologne, Frankfurt)

Workflow:
1. Open EventList in Berlin (50 events)
2. Scroll to event #35 "Summer Welcome Week"
3. Switch to Munich tenant ← RELOAD ← Back to top
4. Scroll to find equivalent event
5. Switch to Hamburg ← RELOAD ← Back to top
6. Repeat...

Result: Spends 60% of time scrolling, 40% working
```

#### Story 2: Moderator Reviewing Submissions
```
Bob reviews photo submissions across 2 tenants

Workflow:
1. Open Submissions page (Berlin tenant)
2. Review 10 photos, approve 7
3. Switch to Munich tenant ← RELOAD ← Loses context
4. Sees 15 new submissions
5. Can't remember which photos he already reviewed
6. Has to check audit log to avoid duplicate work

Result: Inefficient, cognitive overhead
```

### Root Cause

**Intentional design decision** to prevent "state leakage" between tenants. Comment says:
> "Reload page to prevent state leakage between tenants. This ensures clean slate for the new tenant context."

### Why This Is Problematic

**Modern SPAs handle context switching without reload:**
- React state is already isolated per component
- Firestore queries include `tenantId` filters
- Custom Claims contain tenant-specific roles
- adminStore already tracks `activeTenantId`

**The reload is unnecessary** if:
1. All queries use `activeTenantId` from store
2. Components re-render when `activeTenantId` changes
3. Firestore listeners properly unsubscribe/resubscribe

### Recommendation

**Replace reload with reactive state management:**

```typescript
// adminStore.ts - REMOVE reload
switchTenant: (tenantId) => {
  const { canManageTenant, availableTenants } = get();
  
  if (!canManageTenant(tenantId)) {
    console.error(`Cannot switch to tenant ${tenantId} - access denied`);
    return;
  }
  
  const tenant = availableTenants.find(t => t.id === tenantId);
  if (!tenant) {
    console.error(`Tenant ${tenantId} not found in available tenants`);
    return;
  }
  
  // Update state (triggers re-render in all components)
  set({ activeTenantId: tenantId });
  
  // Optional: Navigate to dashboard for clean context
  // (user can use browser back to return)
  // window.location.href = '/admin/dashboard';
},
```

**Update components to react to activeTenantId changes:**

```typescript
// EventList.tsx - Add dependency
function EventList() {
  const { adminProfile, activeTenantId } = useAdminStore(); // ← Add activeTenantId
  const [events, setEvents] = useState<Event[]>([]);
  
  useEffect(() => {
    if (!adminProfile || !activeTenantId) return;
    
    const eventsQuery = query(
      collection(db, 'events'),
      where('tenantId', '==', activeTenantId), // ← Use activeTenantId
      orderBy('startDate', 'desc')
    );
    
    const unsubscribe = onSnapshot(eventsQuery, (snapshot) => {
      const eventData = snapshot.docs.map(doc => ({...}));
      setEvents(eventData);
    });
    
    return () => unsubscribe();
  }, [adminProfile, activeTenantId]); // ← Re-run when activeTenantId changes
  
  return <div>...</div>;
}
```

**Benefits:**
- ✅ Instant tenant switching (50ms vs 2000ms)
- ✅ No data loss
- ✅ Smoother UX
- ✅ Lower bandwidth usage
- ✅ Better mobile experience

**Implementation Effort:** 2-3 hours to update all admin pages

---

## 6. Moderate Issue #5: No Role Conflict Resolution

### Problem Description

System doesn't define behavior when user has conflicting roles across tenants (e.g., admin in Tenant A, player in Tenant B).

### Scenarios

#### Scenario 1: Admin Creates Event in Wrong Tenant
```
Alice: Admin in Berlin, Player in Munich (joined a team)

Context: activeTenantId = 'tenant-berlin'
Action: Creates event "Summer Party 2025"
Question: Which tenant should event belong to?

Current Behavior: Event.tenantId = 'tenant-berlin' (from context)
Problem: What if Alice accidentally switched to Munich context first?
```

#### Scenario 2: Player Joins Team While in Admin Mode
```
Bob: Admin in Munich

Context: activeTenantId = 'tenant-munich', isAdminMode = true
Action: Scans QR code to join team in Berlin event (different tenant!)
Question: Should join be allowed? Which tenant context to use?

Current Behavior: Unclear - may fail or create cross-tenant reference
```

#### Scenario 3: User Has Admin Role in Tenant But No Player Profile
```
Carol: Promoted to admin in Berlin (never joined a team)

Context: No TeamMember records, no player history
Action: Opens admin dashboard
Question: Can she access player features? Can she play?

Current Behavior: AdminRoute allows access, but may crash on player pages
```

### Missing Validation

**No check in Cloud Functions:**
```typescript
// assignRole.ts - Should validate user's existing tenant relationships
export const assignRole = onCall<AssignRoleRequest>(
  {cors: true, region: "europe-west3"},
  async (request) => {
    // ... authentication ...
    
    const {targetUserId, tenantId, role} = request.data;
    
    // ⚠️ MISSING: Check if user already has role in different tenant
    // ⚠️ MISSING: Check if user has active teams in conflicting tenants
    // ⚠️ MISSING: Validate tenant compatibility
    
    // Directly updates tenantRoles[tenantId]...
  }
);
```

**No UI warning:**
```tsx
// ContextSwitcher.tsx - Should warn on conflicts
<button onClick={() => handleSwitch(tenant.id)}>
  {/* ⚠️ NO WARNING: "You have unsaved work in other tenant" */}
  {/* ⚠️ NO WARNING: "You're currently playing in Team Alpha (Munich)" */}
  {tenant.name}
</button>
```

### Recommendation

**Add Conflict Detection:**

```typescript
// NEW: utils/roleConflictDetector.ts
export interface RoleConflict {
  type: 'admin-player' | 'cross-tenant-team' | 'permission-escalation';
  description: string;
  affectedTenants: string[];
  severity: 'warning' | 'error';
}

export async function detectRoleConflicts(
  userId: string,
  newTenantId: string,
  newRole: 'admin' | 'organizer' | 'moderator'
): Promise<RoleConflict[]> {
  const conflicts: RoleConflict[] = [];
  
  // Check 1: User has active teams in other tenants
  const activeTeams = await getActiveTeamMemberships(userId);
  const teamTenants = new Set(activeTeams.map(tm => tm.team.tenantId));
  
  if (teamTenants.size > 0 && !teamTenants.has(newTenantId)) {
    conflicts.push({
      type: 'cross-tenant-team',
      description: `User is playing in ${teamTenants.size} other tenant(s)`,
      affectedTenants: Array.from(teamTenants),
      severity: 'warning',
    });
  }
  
  // Check 2: User already has admin role in different tenant
  const user = await getUserById(userId);
  const existingAdminTenants = Object.keys(user.tenantRoles || {}).filter(
    tid => user.tenantRoles![tid].role === 'admin' && tid !== newTenantId
  );
  
  if (existingAdminTenants.length > 0) {
    conflicts.push({
      type: 'permission-escalation',
      description: `User already admin in ${existingAdminTenants.length} tenant(s)`,
      affectedTenants: existingAdminTenants,
      severity: 'warning',
    });
  }
  
  return conflicts;
}
```

**Update assignRole Cloud Function:**
```typescript
export const assignRole = onCall<AssignRoleRequest>(
  {cors: true, region: "europe-west3"},
  async (request) => {
    // ... existing validation ...
    
    // NEW: Check for conflicts
    const conflicts = await detectRoleConflicts(targetUserId, tenantId, role);
    
    // Log conflicts for audit
    if (conflicts.length > 0) {
      console.warn(`Role assignment conflicts detected for ${targetUserId}:`, conflicts);
      
      // Optional: Block assignment if severe conflicts
      const hasErrors = conflicts.some(c => c.severity === 'error');
      if (hasErrors) {
        throw new HttpsError(
          'failed-precondition',
          `Cannot assign role due to conflicts: ${conflicts.map(c => c.description).join(', ')}`
        );
      }
    }
    
    // Continue with assignment...
  }
);
```

---

## 7. User Story Analysis

### Story 1: International ESN Coordinator (Multi-Tenant Admin)

**Persona:** Alice  
**Role:** Admin in ESN Berlin, Munich, Hamburg  
**Goal:** Manage 3 city chapters efficiently

#### Current Experience

```
Timeline of Alice's Day:

09:00 - Login to admin portal
      ├─ Lands on Berlin dashboard (first tenant)
      ├─ Sees 50 events, 200 teams, 30 pending submissions
      └─ ✅ Good

09:15 - Needs to approve submission in Munich
      ├─ Clicks ContextSwitcher dropdown
      ├─ Selects "ESN Munich"
      ├─ ⚠️ FULL PAGE RELOAD (3 seconds)
      ├─ Loses scroll position
      ├─ Has to navigate to Submissions page again
      └─ ❌ Frustrating

09:20 - Reviews submission, approves
      └─ ✅ Works

09:25 - Needs to create event in Hamburg
      ├─ Switches to Hamburg ← RELOAD AGAIN
      ├─ Navigates to Events → Create Event
      ├─ Fills out form (5 minutes of work)
      └─ ✅ Form works

09:30 - Realizes event should be in Munich, not Hamburg
      ├─ Can't change tenantId in form (locked)
      ├─ Has to delete event
      ├─ Switch to Munich ← RELOAD
      ├─ Re-fill entire form
      └─ ❌ Wasted 10 minutes

10:00 - Wants to compare events across all 3 cities
      ├─ EventList only shows one tenant at a time
      ├─ Has to switch between tenants, reload, screenshot, compare
      └─ ❌ No multi-tenant view

11:00 - Checking staff assignments
      ├─ Who are moderators in each city?
      ├─ Has to switch between tenants to see StaffList
      ├─ No consolidated view
      └─ ❌ Inefficient
```

#### Pain Points

| Pain Point | Impact | Frequency |
|-----------|---------|-----------|
| Full page reload | Loses context, slow | Every tenant switch (10-20x/day) |
| No multi-tenant views | Can't compare data | Daily |
| Can't change event tenantId | Data duplication | 2-3x/week |
| No cross-tenant search | Manual checking | Daily |

#### Recommendations

1. **Remove page reload** (see Issue #4)
2. **Add "All Tenants" view** for superadmins
   ```tsx
   <Tabs>
     <Tab>ESN Berlin</Tab>
     <Tab>ESN Munich</Tab>
     <Tab>ESN Hamburg</Tab>
     <Tab>All Tenants ⭐</Tab> {/* NEW */}
   </Tabs>
   ```
3. **Allow tenant transfer** for events/tasks (with confirmation)
4. **Add global search** (searches across all managed tenants)

---

### Story 2: Weekend Event Organizer (Temporary Role)

**Persona:** Bob  
**Role:** Player normally, promoted to Organizer for one weekend  
**Goal:** Create event, manage it, then return to player role

#### Current Experience

```
Friday 18:00 - Bob promoted to Organizer in Berlin
            ├─ Admin sends invite link via WhatsApp
            ├─ Bob clicks link → acceptInvitation
            ├─ Role granted: Organizer, expires in 48 hours
            ├─ Custom Claims updated
            └─ ✅ Good

Friday 18:05 - Bob opens app
            ├─ Still sees player UI (Dashboard, Teams)
            ├─ No indication he's now an organizer
            ├─ Has to manually navigate to /admin/dashboard
            └─ ⚠️ Confusing

Friday 18:10 - Bob creates event "Friday Night Pub Crawl"
            ├─ EventForm loads
            ├─ tenantId auto-filled (Berlin)
            ├─ Creates event successfully
            └─ ✅ Works

Friday 19:00 - Event starts, players join teams
            └─ ✅ Good

Saturday 12:00 - Bob switches back to player mode
              ├─ Wants to join a team himself (different event)
              ├─ No easy way to toggle player/admin mode
              ├─ Has to logout and login as different user?
              └─ ❌ Blocked

Sunday 18:00 - Bob's role expires
             ├─ Background job (expireRoles) runs at 02:00 Monday
             ├─ Bob still has organizer access for 8 extra hours
             └─ ⚠️ Security risk

Monday 09:00 - Bob opens app
             ├─ Role expired (isActive = false)
             ├─ Redirected to player dashboard
             ├─ Can no longer see event analytics
             └─ ✅ Correct behavior
```

#### Pain Points

| Pain Point | Impact | Recommendation |
|-----------|---------|----------------|
| No role promotion notification | User confused about new permissions | Show banner: "You're now an Organizer!" |
| Can't toggle player/admin modes | Forced to use admin UI only | Add toggle in navbar |
| Role expiration delay (8 hours) | Security risk | Run expireRoles every hour, or on-demand |
| No "role expiring soon" warning | Unexpected access loss | Show countdown: "Access expires in 12h" |

---

### Story 3: First-Time Admin Setup (Onboarding)

**Persona:** Carol  
**Role:** Just promoted from player to admin in Berlin  
**Goal:** Learn admin portal, set up first event

#### Current Experience

```
Day 1 - Carol promoted to admin
      ├─ Receives email: "You've been promoted to Admin"
      ├─ Email contains /admin/dashboard link
      ├─ Clicks link → AdminRoute → Redirected to login (session expired)
      └─ ⚠️ Broken link

      ├─ Carol logs in manually
      ├─ Lands on player dashboard (default)
      ├─ No indication she's now an admin
      ├─ Has to remember URL: /admin/dashboard
      └─ ❌ Bad onboarding

Day 1 - First time in admin portal
      ├─ Sees empty dashboard (no events created yet)
      ├─ No onboarding tour or tooltips
      ├─ Clicks "Create Event" without understanding tenantId concept
      ├─ Creates event in wrong tenant (her "home" tenant, not Berlin)
      └─ ⚠️ Confusion

Day 2 - Trying to invite first moderator
      ├─ Opens StaffList
      ├─ Clicks "Invite Staff" (if implemented)
      ├─ Enters moderator's email
      ├─ Gets magic link, shares via WhatsApp
      ├─ Moderator accepts → ... wait, nothing happens?
      ├─ Moderator doesn't see admin portal link
      └─ ❌ Unclear flow

Day 3 - Wants to see audit log
      ├─ Where is it?
      ├─ Searches navbar, sidebar... not found
      ├─ Gives up
      └─ ❌ Feature discoverability
```

#### Recommendations

1. **Add onboarding checklist** in admin dashboard:
   ```tsx
   <OnboardingChecklist>
     <Task done={hasCreatedEvent}>Create your first event</Task>
     <Task done={hasInvitedModerator}>Invite a moderator</Task>
     <Task done={hasReviewedSubmission}>Review a submission</Task>
   </OnboardingChecklist>
   ```

2. **Add role promotion notification**:
   ```tsx
   <RolePromotionBanner>
     🎉 You're now an Admin in ESN Berlin!
     <Link to="/admin/dashboard">Go to Admin Portal</Link>
   </RolePromotionBanner>
   ```

3. **Add contextual help tooltips**:
   ```tsx
   <Tooltip content="This is the tenant context. All events you create will belong to this organization.">
     <ContextSwitcher />
   </Tooltip>
   ```

4. **Add navigation breadcrumbs**:
   ```tsx
   <Breadcrumbs>
     <Link to="/admin">Admin</Link>
     <Link to="/admin/events">Events</Link>
     <span>Create Event</span>
   </Breadcrumbs>
   ```

---

## 8. Recommended Improvements (Prioritized)

### Priority 1: Critical Fixes (This Week)

| Issue | Action | Effort | Impact |
|-------|--------|--------|--------|
| **Dual Schema** | Migrate all UI pages from `managedTenantIds` to `tenantRoles` | 4 hours | 🔴 Critical |
| **Tenant Context Validation** | Add AdminGuard component, validate activeTenantId | 2 hours | 🔴 Critical |
| **User.tenantId Semantics** | Document "primary tenant" meaning, update comments | 1 hour | 🟡 High |

#### Fix 1: Migrate UI to New Schema

**Files to Update:**
```
src/pages/admin/EventList.tsx
src/pages/admin/AdminDashboard.tsx
src/pages/admin/TaskForm.tsx
src/pages/admin/EventForm.tsx
```

**Pattern:**

```typescript
// OLD (REMOVE):
if (adminProfile.managedTenantIds && adminProfile.managedTenantIds.length > 0) {
  where('tenantId', 'in', adminProfile.managedTenantIds)
}

// NEW (USE):
const { activeTenantId } = useAdminStore();
if (!adminProfile.isSuperadmin && activeTenantId) {
  where('tenantId', '==', activeTenantId)
}

// Or for multi-tenant view:
const activeTenantIds = Object.keys(adminProfile.tenantRoles || {}).filter(
  tid => adminProfile.tenantRoles![tid].isActive
);
if (activeTenantIds.length > 0) {
  where('tenantId', 'in', activeTenantIds)
}
```

#### Fix 2: Add AdminGuard

**Create:** `src/components/admin/AdminGuard.tsx`

```typescript
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { adminProfile, activeTenantId, availableTenants } = useAdminStore();
  const navigate = useNavigate();
  
  // Validation checks...
  
  return <>{children}</>;
}
```

**Update:** `src/components/admin/AdminRoute.tsx`

```typescript
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthCheck>
      <AdminGuard> {/* ← ADD THIS */}
        {children}
      </AdminGuard>
    </AdminAuthCheck>
  );
}
```

---

### Priority 2: UX Improvements (Next Week)

| Improvement | Action | Effort | Impact |
|------------|--------|--------|--------|
| **Remove Page Reload** | Replace `window.location.reload()` with reactive state | 3 hours | 🟡 High |
| **Role Promotion Notification** | Add banner when user promoted | 2 hours | 🟠 Medium |
| **Onboarding Checklist** | Add first-time admin guidance | 4 hours | 🟠 Medium |

---

### Priority 3: Advanced Features (Future)

| Feature | Description | Effort | Value |
|---------|-------------|--------|-------|
| **Multi-Tenant Dashboard** | View all tenants on one page (superadmin only) | 8 hours | 🟢 High for coordinators |
| **Role Conflict Warnings** | Detect and warn about conflicting roles | 6 hours | 🟡 Medium |
| **Tenant Transfer** | Move events/tasks between tenants | 8 hours | 🟡 Medium |
| **Global Search** | Search across all managed tenants | 12 hours | 🟢 High |
| **Admin Mode Toggle** | Switch between player/admin UI without logout | 4 hours | 🟢 High |
| **Audit Log Viewer** | Dedicated page to view all roleAssignments | 6 hours | 🟡 Medium |

---

## 9. Security Analysis

### Current Security Posture

#### ✅ Strengths

1. **Firebase Custom Claims** - Authoritative source of truth
   - Checked by Firestore security rules
   - Cannot be tampered with client-side
   - Synced by Cloud Functions

2. **Cloud Function Validation**
   - `assignRole` checks caller permissions before assignment
   - Prevents privilege escalation (admin can't assign superadmin)
   - Creates audit log for compliance

3. **Anonymous User Protection**
   - Cannot assign roles to anonymous accounts
   - Forces email-based authentication first

4. **Role Expiration**
   - Background job expires roles automatically
   - Reduces attack surface for compromised accounts

#### ⚠️ Weaknesses

1. **No Rate Limiting**
   - `assignRole` / `revokeRole` can be called unlimited times
   - Risk: Malicious admin spams role changes
   - **Fix:** Add rate limiting (Firebase App Check + Firestore rate limit rules)

2. **No Multi-Factor Auth Requirement**
   - Admins use same auth as players (email/password)
   - Risk: Compromised password = full admin access
   - **Fix:** Require MFA for admin accounts (Firebase Auth MFA)

3. **No Session Expiry for Admins**
   - Admin sessions last indefinitely (until token expires)
   - Risk: Forgotten logout on shared computer
   - **Fix:** Force re-auth after 1 hour of inactivity

4. **Custom Claims Cache**
   - Token refresh only happens on page reload or token expiry (1 hour)
   - Risk: User retains old permissions for up to 1 hour after revocation
   - **Fix:** Call `forceRefresh()` after role changes

5. **No IP Allowlisting**
   - Admins can access from any IP
   - Risk: Compromised credentials used from unexpected location
   - **Fix:** Add IP allowlist for sensitive tenants (enterprise feature)

---

## 10. Migration Plan (Dual Schema → Unified Schema)

### Goal
Remove `managedTenantIds` field entirely, use only `tenantRoles`.

### Phase 1: Preparation (Week 1)

**Tasks:**
1. ✅ Audit all code using `managedTenantIds` (done via grep search)
2. ✅ Document migration strategy (this document)
3. Create migration script: `migrateManagedTenantIds.ts`
4. Test script in emulator environment

**Migration Script:**
```typescript
// scripts/migrateManagedTenantIds.ts
import { db } from './firebase-admin';

async function migrateManagedTenantIds() {
  const usersSnapshot = await db.collection('users')
    .where('managedTenantIds', '!=', null)
    .get();
  
  console.log(`Found ${usersSnapshot.size} users with managedTenantIds`);
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const userId = userDoc.id;
    const managedTenantIds = userData.managedTenantIds || [];
    const existingTenantRoles = userData.tenantRoles || {};
    
    // Backfill tenantRoles if missing
    for (const tenantId of managedTenantIds) {
      if (!existingTenantRoles[tenantId]) {
        existingTenantRoles[tenantId] = {
          role: 'admin', // Assume admin (since they were in managedTenantIds)
          grantedBy: 'system',
          grantedAt: userData.createdAt,
          expiresAt: null,
          isActive: true,
          notes: 'Migrated from managedTenantIds',
        };
      }
    }
    
    // Update user
    await db.collection('users').doc(userId).update({
      tenantRoles: existingTenantRoles,
      highestRole: calculateHighestRole(existingTenantRoles, userData.isSuperadmin || false),
    });
    
    console.log(`✅ Migrated user ${userId}`);
  }
  
  console.log('Migration complete!');
}
```

### Phase 2: Code Migration (Week 1-2)

**Tasks:**
1. Update `EventList.tsx` to use `activeTenantId`
2. Update `AdminDashboard.tsx` to use `tenantRoles`
3. Update `TaskForm.tsx` to use `activeTenantId`
4. Update `EventForm.tsx` to use `activeTenantId`
5. Add TypeScript `@deprecated` annotations to `managedTenantIds`
6. Run full test suite
7. Deploy to staging environment

### Phase 3: Deprecation Notice (Week 2-3)

**Tasks:**
1. Add deprecation warning in schema:
   ```typescript
   export interface User extends MultiTenantEntity {
     /**
      * @deprecated Use tenantRoles instead. Will be removed in v3.0.
      */
     managedTenantIds?: string[];
   }
   ```
2. Add console warning when field is accessed:
   ```typescript
   if (adminProfile.managedTenantIds) {
     console.warn('managedTenantIds is deprecated. Use tenantRoles instead.');
   }
   ```
3. Update documentation
4. Notify team of upcoming removal

### Phase 4: Removal (Week 4+)

**Tasks:**
1. Remove `managedTenantIds` from schema.ts
2. Remove field from all queries
3. Run migration script in production (dry-run first!)
4. Deploy code without `managedTenantIds`
5. Monitor for errors
6. Update Firestore indexes (remove composite indexes using managedTenantIds)

**Rollback Plan:**
- Keep `managedTenantIds` field in Firestore for 1 month after code removal
- If issues arise, re-add field to schema and redeploy
- Data is still in database, just not used by code

---

## 11. Conclusion

### Summary of Findings

The multi-tenant role management system has a **solid architectural foundation** but suffers from **incomplete migration** and **missing validation layers**.

**Critical Issues:**
1. ✅ Fixed: Cloud Functions use new schema
2. ❌ Broken: UI pages use old schema
3. ❌ Missing: Tenant context validation
4. ⚠️ Unclear: User.tenantId semantics

**Quick Wins:**
- Migrate 4 admin pages to new schema (4 hours)
- Add AdminGuard validation (2 hours)
- Remove page reload on context switch (3 hours)

**Total effort:** ~9 hours to fix critical issues

### Recommended Next Steps

1. **Immediate (This Week):**
   - [ ] Migrate EventList.tsx to use `activeTenantId`
   - [ ] Migrate AdminDashboard.tsx to use `tenantRoles`
   - [ ] Migrate TaskForm.tsx to use `activeTenantId`
   - [ ] Migrate EventForm.tsx to use `activeTenantId`
   - [ ] Add AdminGuard component
   - [ ] Document User.tenantId as "primary tenant"

2. **Short-Term (Next Week):**
   - [ ] Remove page reload in switchTenant()
   - [ ] Add role promotion notification banner
   - [ ] Add onboarding checklist for new admins
   - [ ] Update all components to react to activeTenantId changes

3. **Medium-Term (Next Month):**
   - [ ] Implement multi-tenant dashboard view
   - [ ] Add role conflict detection
   - [ ] Add global search across tenants
   - [ ] Build admin mode toggle

4. **Long-Term (Q1 2026):**
   - [ ] Remove managedTenantIds field entirely
   - [ ] Implement IP allowlisting for enterprises
   - [ ] Add MFA requirement for admin accounts
   - [ ] Build comprehensive audit log viewer

---

**Document Status:** ✅ Analysis Complete - Ready for Review  
**Author:** GitHub Copilot (AI Analysis)  
**Review Required:** Product Manager, Lead Developer  
**Next Action:** Stakeholder decision on prioritization
