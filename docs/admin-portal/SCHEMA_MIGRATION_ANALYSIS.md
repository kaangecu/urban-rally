# Database Schema Migration Analysis: Current vs. Scoped RBAC

> **Document Type:** Technical Analysis & Migration Strategy  
> **Date:** December 30, 2025  
> **Status:** Recommendation for Decision  
> **Related:** `ROLE_MANAGEMENT_ARCHITECTURE.md`

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Schema Analysis](#current-schema-analysis)
3. [Proposed "Scoped RBAC" Schema](#proposed-scoped-rbac-schema)
4. [Comparison Matrix](#comparison-matrix)
5. [Migration Strategies](#migration-strategies)
6. [Recommendation](#recommendation)

---

## Executive Summary

**Question:** Should we expand the current `User` schema or adopt the proposed `memberships` join-table pattern?

**Current State:** 
- Unified `User` interface with `role` field and `managedTenantIds[]`
- Simple, but limited to single role per user globally
- Already supports admin roles: `player | moderator | organizer | admin | superadmin`

**Proposed State:**
- Separate `memberships` join table linking `User` → `Tenant` with per-tenant roles
- Complex, but supports different roles in different tenants
- Enables "Alice is Admin in ESN Berlin, Organizer in ESN Munich"

**Recommendation:** **Expand Current Schema (Modified Approach)** - Add `tenantRoles` map to existing `User` interface instead of creating separate join table. This provides 80% of the benefits with 40% of the complexity.

---

## Current Schema Analysis

### Current `User` Interface (schema.ts lines 108-152)

```typescript
export interface User extends MultiTenantEntity {
  id: string; // Firebase Auth UID
  
  // Profile
  displayName: string;
  email: string;
  photoURL?: string;
  
  // Account Type & Role
  accountType: 'anonymous' | 'linked';
  role: 'player' | 'moderator' | 'organizer' | 'admin' | 'superadmin';
  
  // Admin-Specific Fields
  managedTenantIds?: string[]; // ← Array of tenant IDs admin can manage
  isActive?: boolean;
  
  // Recovery
  recoveryCode?: string;
  recoveryCodeExpiresAt?: Date;
  
  // GDPR Consent
  consentGiven: { ... };
  
  // Player Stats
  totalScore: number;
  totalSubmissions: number;
  eventsParticipated: number;
  
  // Timestamps
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string; // ← "Home tenant" (MultiTenantEntity)
}
```

### Current Tenant Structure

```typescript
export interface Tenant extends MultiTenantEntity {
  id: string;
  name: string;
  slug: string;
  
  // Branding
  primaryColor: string;
  logoUrl?: string;
  
  // Contact
  contactEmail?: string;
  website?: string;
  
  // Status
  isActive: boolean;
  subscriptionTier?: 'free' | 'basic' | 'premium';
}
```

### Current Role System

**How it works:**
1. `User.role` stores **highest global role** (player, moderator, organizer, admin, superadmin)
2. `User.managedTenantIds[]` lists which tenants an admin can manage
3. `User.tenantId` indicates "home tenant" (first tenant they joined)
4. **Firebase Custom Claims** mirror `role` for security rules

**Example:**
```typescript
{
  id: "user123",
  email: "alice@example.com",
  role: "admin", // ← Global highest role
  managedTenantIds: ["tenant_berlin", "tenant_munich"], // ← Can manage both
  tenantId: "tenant_berlin", // ← Home tenant
}
```

### Limitations of Current Schema

| Issue | Impact | Severity |
|-------|--------|----------|
| **Single Global Role** | Alice can't be "Admin in Berlin, Organizer in Munich" | 🔴 High |
| **No Per-Tenant Role History** | Can't audit "Who promoted Alice to Admin in Berlin?" | 🟡 Medium |
| **No Role Expiration** | Weekend volunteers retain access forever | 🔴 High |
| **Implicit Role Inheritance** | If Alice is admin in Berlin, is she admin in Munich too? | 🟠 Medium |
| **No Invitation Tracking** | Can't see "Pending invitations" | 🟡 Medium |

---

## Proposed "Scoped RBAC" Schema

### Proposed `memberships` Collection (New)

```typescript
interface Membership {
  id: string;
  userId: string; // ← Foreign key to User
  tenantId: string; // ← Foreign key to Tenant
  role: 'admin' | 'organizer' | 'moderator'; // ← Per-tenant role
  
  // Metadata
  grantedBy: string; // userId who assigned this role
  grantedAt: Timestamp;
  expiresAt: Timestamp | null; // null = never expires
  isActive: boolean;
  
  // Audit
  lastModifiedBy: string;
  lastModifiedAt: Timestamp;
  
  // Invitation tracking
  invitationToken?: string; // If invited but not accepted
  invitationAcceptedAt?: Timestamp;
}
```

### Proposed `User` Changes (Simplified)

```typescript
interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  
  // Global role (superadmin only)
  isSuperadmin: boolean;
  
  // Cached highest role (computed from memberships)
  highestRole: 'superadmin' | 'admin' | 'organizer' | 'moderator' | 'player';
  
  // Player stats (all users can play)
  accountType: 'anonymous' | 'linked';
  totalScore?: number;
  totalSubmissions?: number;
  eventsParticipated?: number;
  consentGiven?: ConsentData;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### How Proposed System Works

**Query Pattern:**
```typescript
// Get Alice's role in ESN Berlin
const membership = await db.collection('memberships')
  .where('userId', '==', 'alice123')
  .where('tenantId', '==', 'berlin')
  .where('isActive', '==', true)
  .limit(1)
  .get();

const role = membership.docs[0]?.data().role; // 'admin'
```

**Example Data:**
```typescript
// User document (slim)
{
  id: "alice123",
  email: "alice@example.com",
  isSuperadmin: false,
  highestRole: "admin", // ← Cached from memberships
}

// Membership 1: Berlin
{
  userId: "alice123",
  tenantId: "berlin",
  role: "admin",
  grantedBy: "superadmin123",
  expiresAt: null,
}

// Membership 2: Munich
{
  userId: "alice123",
  tenantId: "munich",
  role: "organizer",
  grantedBy: "admin_munich",
  expiresAt: Timestamp(2025-12-31),
}
```

---

## Comparison Matrix

### Feature Comparison

| Feature | Current Schema | Proposed (Join Table) | Hybrid (Expanded User) |
|---------|----------------|------------------------|------------------------|
| **Different roles in different tenants** | ❌ No | ✅ Yes | ✅ Yes |
| **Role expiration** | ❌ No | ✅ Yes | ✅ Yes |
| **Audit trail (who granted role)** | ❌ No | ✅ Yes | ✅ Yes |
| **Invitation tracking** | ❌ No | ✅ Yes | ✅ Yes |
| **Query complexity** | Simple | Complex | Medium |
| **Data duplication** | Low | Medium | Low |
| **Migration effort** | N/A | High (new collection) | Low (add fields) |
| **Firestore reads per permission check** | 1 read | 2 reads | 1 read |
| **Custom Claims size** | Small | Medium | Medium |

### Performance Comparison

| Operation | Current | Proposed (Join Table) | Hybrid (Expanded User) |
|-----------|---------|------------------------|------------------------|
| **Check if user is admin in tenant** | 1 read (User doc) | 2 reads (User + Membership) | 1 read (User doc) |
| **Get user's role in tenant** | O(1) lookup in `managedTenantIds` | 1 query (memberships) | O(1) lookup in `tenantRoles` |
| **List all admins in tenant** | Query users where `managedTenantIds` contains tenantId | Query memberships where `tenantId==X` | Query users where `tenantRoles[tenantId]` exists |
| **List all tenants user has access to** | 1 read (`managedTenantIds` array) | 1 query (memberships by userId) | 1 read (`tenantRoles` keys) |
| **Update user role** | 1 write (User doc) | 2 writes (User + Membership) | 1 write (User doc) |
| **Expire weekend volunteers** | Manual query + update | Background job (simple query) | Background job (nested field update) |

### Code Complexity Comparison

#### Current Schema (Permission Check)
```typescript
function canManageTenant(user: User, tenantId: string): boolean {
  if (user.role === 'superadmin') return true;
  if (user.role === 'admin' && user.managedTenantIds?.includes(tenantId)) {
    return true;
  }
  return false;
}
```

#### Proposed Join Table (Permission Check)
```typescript
async function canManageTenant(userId: string, tenantId: string): Promise<boolean> {
  // Check custom claims first (cached)
  const claims = await auth.getCustomClaims(userId);
  if (claims.sa) return true; // superadmin
  
  // Query membership
  const membership = await db.collection('memberships')
    .where('userId', '==', userId)
    .where('tenantId', '==', tenantId)
    .where('isActive', '==', true)
    .limit(1)
    .get();
  
  if (membership.empty) return false;
  const role = membership.docs[0].data().role;
  return role === 'admin';
}
```

#### Hybrid Expanded User (Permission Check)
```typescript
function canManageTenant(user: User, tenantId: string): boolean {
  if (user.isSuperadmin) return true;
  
  const tenantRole = user.tenantRoles?.[tenantId];
  if (!tenantRole) return false;
  
  return tenantRole.role === 'admin' && tenantRole.isActive;
}
```

---

## Migration Strategies

### Option A: Keep Current Schema + Minor Enhancements

**Changes:**
```typescript
interface User extends MultiTenantEntity {
  // ... existing fields ...
  
  // NEW: Track role level instead of just array
  managedTenants?: {
    [tenantId: string]: {
      role: 'admin' | 'organizer' | 'moderator';
      grantedBy: string;
      grantedAt: Date;
      expiresAt?: Date; // NEW: Expiration support
    };
  };
  
  // DEPRECATED: managedTenantIds (keep for backward compatibility)
  managedTenantIds?: string[];
}
```

**Pros:**
- ✅ Minimal migration (add one field)
- ✅ Backward compatible (keep `managedTenantIds`)
- ✅ Single document read for permission checks
- ✅ Existing code mostly works

**Cons:**
- ❌ Still limited: user can only have ONE role per tenant
- ❌ User document grows larger (Firebase limit: 1MB)
- ❌ Complex nested field updates

**Migration Steps:**
1. Add `managedTenants` field to User interface
2. Write migration script to backfill from `managedTenantIds`
3. Update Cloud Functions to write both fields
4. Gradually migrate queries to use `managedTenants`
5. Deprecate `managedTenantIds` after 6 months

**Effort:** 1 week

---

### Option B: Full "Scoped RBAC" with Join Table

**Changes:**
```typescript
// NEW Collection
interface Membership {
  id: string;
  userId: string;
  tenantId: string;
  role: 'admin' | 'organizer' | 'moderator';
  grantedBy: string;
  grantedAt: Timestamp;
  expiresAt: Timestamp | null;
  isActive: boolean;
  invitationToken?: string;
  invitationAcceptedAt?: Timestamp;
}

// UPDATED: User (remove admin-specific fields)
interface User {
  // ... keep profile fields ...
  isSuperadmin: boolean; // Only global superadmin flag
  highestRole: string; // Cached from memberships
  
  // REMOVED: managedTenantIds, isActive
}
```

**Pros:**
- ✅ Ultimate flexibility (different roles per tenant)
- ✅ Clean separation of concerns
- ✅ Easy to query "all admins in tenant X"
- ✅ Role expiration built-in
- ✅ Audit trail per membership

**Cons:**
- ❌ Complex migration (new collection + data restructuring)
- ❌ 2 reads per permission check (User + Membership)
- ❌ More Firestore queries (higher cost)
- ❌ Requires rewriting auth logic throughout app

**Migration Steps:**
1. Create `memberships` collection
2. Write migration script:
   - For each User with `managedTenantIds`
   - Create Membership document per tenantId
   - Set `role: 'admin'`, `grantedBy: 'system'`
3. Deploy Cloud Functions for membership management
4. Update all permission checks to query memberships
5. Update Firestore security rules
6. Deploy frontend changes (context switcher, etc.)
7. Run E2E tests with both schemas (parallel)
8. Cutover: disable old code, enable new code
9. After 1 month: remove deprecated User fields

**Effort:** 3-4 weeks

---

### Option C: Hybrid - Expanded User Schema (RECOMMENDED)

**Changes:**
```typescript
interface User extends MultiTenantEntity {
  // ... existing fields ...
  
  // NEW: Per-tenant role mapping
  tenantRoles?: {
    [tenantId: string]: {
      role: 'admin' | 'organizer' | 'moderator';
      grantedBy: string;
      grantedAt: Date;
      expiresAt: Date | null; // null = never expires
      isActive: boolean;
      invitationToken?: string; // For pending invitations
    };
  };
  
  // Keep existing fields for backward compatibility
  role: 'player' | 'moderator' | 'organizer' | 'admin' | 'superadmin'; // Highest role
  managedTenantIds?: string[]; // DEPRECATED, but keep for now
  
  // NEW: Superadmin flag
  isSuperadmin?: boolean;
}
```

**Pros:**
- ✅ 80% of join-table benefits, 40% of complexity
- ✅ Single document read for permission checks
- ✅ Different roles in different tenants
- ✅ Role expiration support
- ✅ Audit trail (grantedBy, grantedAt)
- ✅ Backward compatible

**Cons:**
- ⚠️ User document grows (but within 1MB limit for typical use)
- ⚠️ Nested field updates (Firestore supports this)
- ⚠️ Can't easily query "all admins in tenant X" (need composite index)

**Migration Steps:**
1. Add `tenantRoles` field to User interface
2. Write migration script:
   ```typescript
   for (const user of users) {
     if (user.managedTenantIds) {
       const tenantRoles = {};
       for (const tenantId of user.managedTenantIds) {
         tenantRoles[tenantId] = {
           role: user.role === 'admin' ? 'admin' : 'organizer',
           grantedBy: 'system',
           grantedAt: user.createdAt,
           expiresAt: null,
           isActive: true,
         };
       }
       await db.collection('users').doc(user.id).update({ tenantRoles });
     }
   }
   ```
3. Update Cloud Functions to write `tenantRoles` instead of `managedTenantIds`
4. Update permission checks to read from `tenantRoles`
5. Update Firestore security rules
6. Deploy frontend changes
7. Keep `managedTenantIds` for 3 months as fallback

**Effort:** 1-2 weeks

---

## Detailed Pros & Cons Analysis

### Current Schema (No Changes)

#### Pros
| Pro | Explanation |
|-----|-------------|
| ✅ **Zero migration cost** | No code changes needed |
| ✅ **Simple mental model** | "Alice is an admin, she manages Berlin and Munich" |
| ✅ **Fast permission checks** | Single document read, O(1) array lookup |
| ✅ **Low Firestore cost** | Minimal reads/writes |
| ✅ **Existing code works** | No refactoring needed |

#### Cons
| Con | Explanation | Workaround |
|-----|-------------|------------|
| ❌ **Single global role** | Alice can't be Admin in Berlin AND Organizer in Munich | Use highest role globally |
| ❌ **No role expiration** | Weekend volunteers retain access forever | Manual cleanup scripts |
| ❌ **No audit trail** | Can't see who promoted Alice or when | Add `roleAssignments` collection |
| ❌ **No invitation flow** | Can't track pending invitations | Use separate `invitations` collection |
| ❌ **Implicit tenant access** | If Alice is admin, which tenants can she access? | `managedTenantIds` array |

---

### Proposed Join Table (Option B)

#### Pros
| Pro | Explanation |
|-----|-------------|
| ✅ **True multi-tenant RBAC** | Alice = Admin in Berlin, Organizer in Munich |
| ✅ **Clean data model** | Each entity has clear purpose |
| ✅ **Role expiration built-in** | `expiresAt` field per membership |
| ✅ **Full audit trail** | `grantedBy`, `grantedAt` per membership |
| ✅ **Easy tenant queries** | "List all admins in Berlin" = query memberships |
| ✅ **Scalable** | Handles thousands of users per tenant |
| ✅ **Industry standard** | Matches GitHub, Slack, Stripe patterns |

#### Cons
| Con | Explanation | Impact |
|-----|-------------|--------|
| ❌ **High migration cost** | New collection + rewrite auth logic | 3-4 weeks |
| ❌ **2 reads per check** | User doc + Membership query | +$0.03/1000 checks |
| ❌ **Complex queries** | Need joins (not native in Firestore) | Use Algolia/client-side |
| ❌ **Data duplication** | `highestRole` cached in User doc | Sync via Cloud Function |
| ❌ **More moving parts** | Membership lifecycle to manage | Increased bug surface |
| ❌ **Custom Claims sync** | Must update JWT when membership changes | Add `refreshClaims()` |

---

### Hybrid Expanded User (Option C - RECOMMENDED)

#### Pros
| Pro | Explanation |
|-----|-------------|
| ✅ **Multi-tenant roles** | Alice = Admin in Berlin, Organizer in Munich ✓ |
| ✅ **Role expiration** | `tenantRoles[tenantId].expiresAt` ✓ |
| ✅ **Audit trail** | `grantedBy`, `grantedAt` per tenant role ✓ |
| ✅ **Single document read** | Permission check = 1 Firestore read |
| ✅ **Low migration cost** | Add field + backfill script = 1-2 weeks |
| ✅ **Backward compatible** | Keep `managedTenantIds` during transition |
| ✅ **No extra queries** | All data in User document |

#### Cons
| Con | Explanation | Mitigation |
|-----|-------------|------------|
| ⚠️ **Document size growth** | 50 tenants × 100 bytes = +5KB | Max ~200 tenants (well below 1MB limit) |
| ⚠️ **Nested updates** | `db.update({ 'tenantRoles.berlin.role': 'admin' })` | Firestore supports dot notation |
| ⚠️ **Can't query "all admins"** | "List admins in Berlin" needs scan | Create composite index OR denormalize |
| ⚠️ **Cache invalidation** | Custom Claims must sync with `tenantRoles` | Cloud Function on User update |

---

## Document Size Analysis

### Current User Document Size
```typescript
{
  id: "abc123", // 50 bytes
  email: "alice@example.com", // 50 bytes
  displayName: "Alice", // 30 bytes
  role: "admin", // 20 bytes
  managedTenantIds: ["berlin", "munich"], // 50 bytes
  consentGiven: {...}, // 300 bytes
  totalScore: 150, // 20 bytes
  // ... other fields
}
// TOTAL: ~800 bytes per user
```

### Proposed Join Table Size
```typescript
// User document
{
  id: "abc123",
  email: "alice@example.com",
  isSuperadmin: false,
  highestRole: "admin",
  // ... player stats
}
// TOTAL: ~600 bytes

// Membership 1 (Berlin)
{
  userId: "abc123",
  tenantId: "berlin",
  role: "admin",
  grantedBy: "xyz",
  grantedAt: timestamp,
  expiresAt: null,
  isActive: true,
}
// TOTAL: ~200 bytes per membership

// For 5 tenants: 600 + (5 × 200) = 1,600 bytes across 6 documents
```

### Hybrid Expanded User Size
```typescript
{
  id: "abc123",
  email: "alice@example.com",
  role: "admin",
  isSuperadmin: false,
  tenantRoles: {
    berlin: {
      role: "admin",
      grantedBy: "xyz",
      grantedAt: timestamp,
      expiresAt: null,
      isActive: true,
    },
    munich: {
      role: "organizer",
      grantedBy: "abc",
      grantedAt: timestamp,
      expiresAt: null,
      isActive: true,
    },
    // ... 3 more
  },
  // ... other fields
}
// TOTAL: ~800 + (5 × 150) = 1,550 bytes in 1 document
```

**Firestore Limit:** 1MB (1,048,576 bytes) per document

**Max Tenants per User:**
- Current: ~200 tenants (array limit)
- Join Table: Unlimited (separate documents)
- Hybrid: ~6,000 tenants (size limit) - **more than enough**

---

## Firestore Cost Analysis

### Assumptions
- 1,000 permission checks per day
- 100 role changes per month
- 50 users with admin roles

### Current Schema
| Operation | Reads | Writes | Monthly Cost |
|-----------|-------|--------|--------------|
| Permission check (1000/day) | 30,000 | 0 | $0.018 |
| Role change (100/month) | 100 | 100 | $0.00018 |
| **Total** | **30,100** | **100** | **$0.01818/month** |

### Proposed Join Table
| Operation | Reads | Writes | Monthly Cost |
|-----------|-------|--------|--------------|
| Permission check (1000/day) | 60,000 | 0 | $0.036 |
| Role change (100/month) | 200 | 200 | $0.00036 |
| Expire roles (daily job) | 150 | 50 | $0.0003 |
| **Total** | **60,350** | **250** | **$0.03666/month** |

**Cost Increase:** +$0.01848/month (+101% increase, but absolute cost is negligible)

### Hybrid Expanded User
| Operation | Reads | Writes | Monthly Cost |
|-----------|-------|--------|--------------|
| Permission check (1000/day) | 30,000 | 0 | $0.018 |
| Role change (100/month) | 100 | 100 | $0.00018 |
| Expire roles (daily job) | 50 | 50 | $0.00009 |
| **Total** | **30,150** | **150** | **$0.01827/month** |

**Cost Increase:** +$0.00009/month (+0.5% increase)

---

## Recommendation

### 🏆 **Adopt Option C: Hybrid Expanded User Schema**

#### Why This Choice?

1. **Best Cost-Benefit Ratio**
   - ✅ Delivers 80% of join-table benefits
   - ✅ Costs 40% of the implementation effort
   - ✅ Minimal Firestore cost increase (+0.5%)

2. **Pragmatic for Current Scale**
   - Urban Rally has <100 tenants (ESN chapters across Europe)
   - Users typically access 1-3 tenants (not 50+)
   - Document size limit (1MB) allows ~6,000 tenants per user

3. **Low Migration Risk**
   - Backward compatible with existing `role` and `managedTenantIds`
   - Single document read maintains performance
   - Easy rollback if issues arise

4. **Meets All Key Requirements**
   - ✅ Different roles in different tenants
   - ✅ Role expiration (weekend volunteers)
   - ✅ Audit trail (who granted role, when)
   - ✅ Invitation tracking
   - ✅ Mobile-first admin UI support

5. **Future Migration Path**
   - If scale requires (1000+ tenants per user), migrate to join table later
   - Data structure is compatible (just extract `tenantRoles` → `memberships`)

#### When to Reconsider

❗ **Switch to Join Table (Option B) if:**
- Users regularly access 10+ tenants
- Need to query "List all admins in tenant X" frequently (>100/day)
- Enterprise customers require complex audit compliance
- Planning to support 100,000+ users

---

## Implementation Plan (Option C)

### Phase 1: Schema Update (Week 1)

**1.1 Update TypeScript Interface**
```typescript
// src/types/schema.ts
export interface User extends MultiTenantEntity {
  // ... existing fields ...
  
  // NEW: Per-tenant role mapping
  tenantRoles?: {
    [tenantId: string]: {
      role: 'admin' | 'organizer' | 'moderator';
      grantedBy: string; // userId who granted
      grantedAt: Date;
      expiresAt: Date | null; // null = never
      isActive: boolean;
      notes?: string; // Optional reason
    };
  };
  
  // NEW: Superadmin flag
  isSuperadmin?: boolean;
  
  // Keep for backward compatibility (mark deprecated)
  /** @deprecated Use tenantRoles instead */
  managedTenantIds?: string[];
}
```

**1.2 Create Migration Script**
```typescript
// scripts/migrate-to-tenant-roles.ts
import { db } from '../src/services/firebase.service';

async function migrateUsers() {
  const users = await db.collection('users')
    .where('managedTenantIds', '!=', null)
    .get();
  
  for (const doc of users.docs) {
    const user = doc.data();
    const tenantRoles: Record<string, any> = {};
    
    // Convert managedTenantIds array to tenantRoles map
    for (const tenantId of user.managedTenantIds || []) {
      tenantRoles[tenantId] = {
        role: user.role === 'admin' ? 'admin' : 'organizer',
        grantedBy: 'system', // Migration marker
        grantedAt: user.createdAt || new Date(),
        expiresAt: null,
        isActive: true,
      };
    }
    
    await doc.ref.update({
      tenantRoles,
      isSuperadmin: user.role === 'superadmin',
    });
    
    console.log(`Migrated user ${user.email}`);
  }
}
```

### Phase 2: Cloud Functions Update (Week 1-2)

**2.1 Update `assignRole` Function**
```typescript
export const assignRole = onCall(async (request) => {
  const { targetUserId, tenantId, role, expiresIn, reason } = request.data;
  
  // Validate permissions...
  
  const userRef = db.collection('users').doc(targetUserId);
  const tenantRolePath = `tenantRoles.${tenantId}`;
  
  await userRef.update({
    [tenantRolePath]: {
      role,
      grantedBy: request.auth.uid,
      grantedAt: FieldValue.serverTimestamp(),
      expiresAt: expiresIn ? calculateExpiration(expiresIn) : null,
      isActive: true,
      notes: reason || null,
    },
    updatedAt: FieldValue.serverTimestamp(),
  });
  
  // Update custom claims
  await refreshUserClaims(targetUserId);
  
  // Create audit log
  await createAuditLog({ ... });
});
```

**2.2 Create Role Expiration Job**
```typescript
export const expireRoles = schedule({
  schedule: 'every day 02:00',
}, async () => {
  const users = await db.collection('users')
    .where('tenantRoles', '!=', null)
    .get();
  
  for (const userDoc of users.docs) {
    const user = userDoc.data();
    const updates: Record<string, any> = {};
    
    for (const [tenantId, roleData] of Object.entries(user.tenantRoles || {})) {
      if (roleData.expiresAt && roleData.expiresAt.toDate() < new Date()) {
        updates[`tenantRoles.${tenantId}.isActive`] = false;
        updates[`tenantRoles.${tenantId}.deactivatedAt`] = FieldValue.serverTimestamp();
      }
    }
    
    if (Object.keys(updates).length > 0) {
      await userDoc.ref.update(updates);
      await refreshUserClaims(userDoc.id);
    }
  }
});
```

### Phase 3: Security Rules Update (Week 2)

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    function isSuperadmin() {
      return request.auth != null && request.auth.token.sa == true;
    }
    
    function getTenantRole(tenantId) {
      return request.auth != null 
          && request.auth.token.tr != null
          && request.auth.token.tr[tenantId];
    }
    
    function isAdmin(tenantId) {
      return getTenantRole(tenantId) == 'admin';
    }
    
    function isOrganizer(tenantId) {
      let role = getTenantRole(tenantId);
      return role == 'admin' || role == 'organizer';
    }
    
    match /tenants/{tenantId} {
      allow read, write: if isSuperadmin();
      allow read, update: if isAdmin(tenantId);
      allow read: if isOrganizer(tenantId);
    }
  }
}
```

### Phase 4: Frontend Updates (Week 2-3)

**4.1 Update Permission Hooks**
```typescript
// hooks/usePermissions.ts
export function useCanManageTenant(tenantId: string) {
  const user = useAuthStore(state => state.user);
  
  if (!user) return false;
  if (user.isSuperadmin) return true;
  
  const tenantRole = user.tenantRoles?.[tenantId];
  return tenantRole?.role === 'admin' && tenantRole?.isActive === true;
}
```

**4.2 Add Context Switcher**
```typescript
// components/admin/ContextSwitcher.tsx
export function ContextSwitcher() {
  const user = useAuthStore(state => state.user);
  const activeTenant = useAdminStore(state => state.activeTenantId);
  
  const availableTenants = useMemo(() => {
    if (!user?.tenantRoles) return [];
    return Object.entries(user.tenantRoles)
      .filter(([_, role]) => role.isActive)
      .map(([tenantId, role]) => ({
        tenantId,
        role: role.role,
      }));
  }, [user]);
  
  // Render dropdown...
}
```

### Phase 5: Testing & Rollout (Week 3-4)

1. **Unit Tests:** Test permission checks with `tenantRoles`
2. **Integration Tests:** Test role assignment/revocation
3. **E2E Tests:** Test admin UI flows
4. **Staging Deployment:** Deploy to staging with test data
5. **Production Migration:** Run migration script in maintenance window
6. **Monitoring:** Watch for errors, rollback if needed
7. **Deprecation:** Remove `managedTenantIds` after 3 months

---

## Rollback Plan

If critical issues arise:

1. **Immediate:** Deploy previous version (keep `managedTenantIds` unchanged)
2. **Fix Forward:** Patch bugs, redeploy updated code
3. **Full Rollback:** Revert schema changes, remove `tenantRoles` field

**Safety Net:** Keep both `managedTenantIds` and `tenantRoles` for 3 months during transition.

---

## Conclusion

**Final Recommendation:** **Option C - Hybrid Expanded User Schema**

This approach:
- ✅ Solves all identified limitations
- ✅ Maintains performance (single doc read)
- ✅ Keeps migration cost low (1-2 weeks)
- ✅ Provides clear upgrade path if needed
- ✅ Aligns with mobile-first admin UI requirements

**Next Steps:**
1. Review this analysis with stakeholders
2. Approve Option C (or propose alternative)
3. Begin Phase 1 implementation (schema update)
4. Schedule migration window (off-peak hours)

---

**Status:** ✅ Ready for Decision & Implementation
