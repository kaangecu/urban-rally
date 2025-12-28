# User Schema Refactoring Analysis (REVISED)

**Date:** 28 December 2025  
**Status:** Analysis Revised - New Recommendation  
**Priority:** Medium (Code Quality / Developer Experience)

## Executive Summary

The codebase currently uses two similar interfaces for representing users:
- **`User`** (src/types/schema.ts:86-127) - Player accounts, stored in `users` collection
- **`UserProfile`** (src/types/schema.ts:369-382) - Admin accounts, stored in `userProfiles` collection

**CRITICAL NEW CONTEXT:**
- ✅ **Owners (admins/organizers) can ALSO play the game as regular players**
- ✅ App is **NOT in production** yet - migration concerns are minimal
- ✅ `accountType` already supports anonymous → linked email/password conversion
- ✅ Firebase Custom Claims already implemented for role management

**REVISED RECOMMENDATION:** **Option A (Unified User Type)** is now the correct choice given that admins need player capabilities.

---

## Current State Analysis

### Type Definitions

#### User Interface (Players)
```typescript
export interface User extends MultiTenantEntity {
  id: string;                    // Firebase Auth UID
  displayName: string;
  email?: string;
  profilePhotoUrl?: string;      // ⚠️ Note: profilePhotoUrl
  accountType?: 'anonymous' | 'linked';
  linkedAccountId?: string;
  recoveryCode?: string;
  recoveryCodeExpiresAt?: Date;
  consentGiven: {
    terms: boolean;
    privacy: boolean;
    termsVersion: string;
    privacyVersion: string;
    termsAcceptedAt: Date;
    privacyAcceptedAt: Date;
    ipAddress?: string;
  };
  totalScore: number;
  totalSubmissions: number;
  eventsParticipated: number;
  lastLoginAt?: Date;
}
```

**Usage:**
- **Collection:** `users`
- **References:** 20+ locations across codebase
- **Purpose:** Player game accounts (anonymous or linked email)
- **Key Operations:**
  - `createUser()` - user.service.ts:37
  - `getUserById()` - user.service.ts:174
  - `updateUser()` - user.service.ts:195
  - `deleteUser()` - user.service.ts:238
- **Store:** `authStore.ts` (`user: User | null`)
- **Components:** IdentityUplinkModal, TeamCodeLogin, Dashboard

#### UserProfile Interface (Admins)
```typescript
export interface UserProfile extends MultiTenantEntity {
  uid: string;                   // ⚠️ Note: uid (not id)
  email: string;
  displayName?: string;
  photoURL?: string;             // ⚠️ Note: photoURL (not profilePhotoUrl)
  role: 'superadmin' | 'admin' | 'organizer' | 'moderator';
  managedTenantIds: string[];
  isActive: boolean;
}
```

**Usage:**
- **Collection:** `userProfiles`
- **References:** 9 locations (admin-only components)
- **Purpose:** Admin portal authentication and permissions
- **Key Operations:**
  - `setUserRole()` - functions/src/index.ts:1048 (Cloud Function)
  - Created via Cloud Function only (no client CRUD)
- **Store:** `adminStore.ts` (`adminProfile: UserProfile | null`)
- **Components:** AdminLogin, AdminDashboard, AdminRoute, useAdminAuth hook

### Field Comparison Table

| Purpose | User (Player) | UserProfile (Admin) | Overlap? |
|---------|---------------|---------------------|----------|
| **Auth UID** | `id: string` | `uid: string` | ✅ YES - Inconsistent naming |
| **Email** | `email?: string` | `email: string` | ✅ YES - Different optionality |
| **Display Name** | `displayName: string` | `displayName?: string` | ✅ YES - Different optionality |
| **Photo** | `profilePhotoUrl?: string` | `photoURL?: string` | ✅ YES - Inconsistent naming |
| **Permissions** | ❌ None | `role: AdminRole` | ❌ NO - Admin-only |
| **Game Stats** | `totalScore`, `totalSubmissions`, etc. | ❌ None | ❌ NO - Player-only |
| **Account Type** | `accountType: 'anonymous' \| 'linked'` | ❌ None | ❌ NO - Player-only |
| **GDPR** | `consentGiven: ConsentData` | ❌ None | ❌ NO - Player-only |
| **Recovery** | `recoveryCode?: string` | ❌ None | ❌ NO - Player-only |
| **Tenant Access** | ❌ None (via TeamMember) | `managedTenantIds: string[]` | ❌ NO - Admin-only |
| **Status** | ❌ None | `isActive: boolean` | ❌ NO - Admin-only |

### Confusion Points Identified

1. **Inconsistent ID Field Naming**
   - `User.id` vs `UserProfile.uid`
   - Both represent Firebase Auth UID
   - Causes confusion when writing queries

2. **Inconsistent Photo Field Naming**
   - `User.profilePhotoUrl` vs `UserProfile.photoURL`
   - Different naming conventions for same data
   - Harder to remember which type uses which

3. **Different Optionality**
   - `User.displayName` is required, `UserProfile.displayName` is optional
   - `User.email` is optional, `UserProfile.email` is required
   - Unclear why requirements differ

4. **Ambiguous Type Names**
   - "User" could mean player OR admin (generic term)
   - "UserProfile" sounds like extended user data, not admin account
   - Not immediately clear they serve different purposes

5. **Mental Model Mismatch**
   - Developers expect ONE user type
   - Two types suggest inheritance or shared base
   - Actually completely separate concerns

---

## Usage Patterns Analysis

### User Type Usage (20+ references)

**Services:**
- `user.service.ts` - Complete CRUD operations
- `team.service.ts` - User lookups for team operations
- `teamMember.service.ts` - User validation

**Hooks:**
- `useFirebaseAuthListener.ts` - Fetches User on auth state change
- `useProfileGuard.ts` - Validates User profile completion
- `useTeamSync.ts` - References User in team context

**Components:**
- `IdentityUplinkModal.tsx` - Creates/updates User accounts
- `TeamCodeLogin.tsx` - User authentication flow
- `Dashboard.tsx` - Displays User stats

**Cloud Functions:**
- `createUserDocument` - Creates User documents (Admin SDK)
- `joinTeamSecure` - Validates User existence
- Multiple user lookup operations

**Store:**
```typescript
// authStore.ts
interface AuthState {
  user: User | null;  // Current player
  // ...
}
```

### UserProfile Type Usage (9 references)

**Services:**
- None (CRUD handled by Cloud Functions only)

**Hooks:**
- `useAdminAuth.ts` - Loads UserProfile, checks roles

**Components:**
- `AdminLogin.tsx` - Validates UserProfile exists
- `AdminDashboard.tsx` - Displays UserProfile info
- `AdminRoute.tsx` - Guards routes with UserProfile roles

**Cloud Functions:**
- `setUserRole` - Creates/updates UserProfile (Admin SDK)

**Store:**
```typescript
// adminStore.ts
interface AdminState {
  adminProfile: UserProfile | null;  // Current admin
  // ...
}
```

### Key Observations

1. **Clear Functional Separation:**
   - User = Players in game system
   - UserProfile = Admins managing system
   - No code treats them interchangeably

2. **Different Data Flows:**
   - User: Client CRUD via services → Firestore
   - UserProfile: Cloud Functions only → Firestore (no client writes)

3. **Separate Collections:**
   - `users` - 20 references, heavy usage
   - `userProfiles` - 2 references, new collection (Phase 1)

4. **No Shared Base:**
   - Both extend `MultiTenantEntity`
   - No shared user base interface
   - Fields duplicated independently

---

## Refactoring Options

### Option A: Unified User Type with Role Field ✅ NOW RECOMMENDED

```typescript
/**
 * User - Unified type for all users (players, admins, organizers)
 * 
 * ARCHITECTURE:
 * - Role stored in Firebase Custom Claims (authoritative)
 * - Firestore has role field (for queries/display, synced from Custom Claims)
 * - All users can play the game (even admins)
 * - Admin routes protected by Custom Claims check
 * 
 * Collection: users (single collection)
 */
export interface User extends MultiTenantEntity {
  id: string;                    // Firebase Auth UID
  email: string;                 // Required for all users now
  displayName: string;
  photoURL?: string;             // Standardized name
  
  // Account Type & Role
  accountType: 'anonymous' | 'linked';  // How they authenticated
  role: 'player' | 'moderator' | 'organizer' | 'admin' | 'superadmin';
  
  // Admin-Specific Fields (optional, only set for admin roles)
  managedTenantIds?: string[];   // Tenants they can manage (empty for players)
  isActive?: boolean;            // Admin account status (undefined for players)
  
  // Player Fields (all users have these - admins can play!)
  recoveryCode?: string;
  recoveryCodeExpiresAt?: Date;
  consentGiven: {
    terms: boolean;
    privacy: boolean;
    termsVersion: string;
    privacyVersion: string;
    termsAcceptedAt: Date;
    privacyAcceptedAt: Date;
    ipAddress?: string;
  };
  totalScore: number;            // Score earned playing (0 for admins who don't play)
  totalSubmissions: number;
  eventsParticipated: number;
  lastLoginAt?: Date;
}
```

**Pros:**
- ✅ **Admins can play the game** - All player fields available
- ✅ **Single account per person** - No dual identity confusion
- ✅ **Custom Claims authoritative** - Role enforcement at Firebase Auth level
- ✅ **Simple queries** - Single collection, standard where clauses
- ✅ **Zero migration risk** - App not in production
- ✅ **Consistent with accountType pattern** - Already distinguish user types with field
- ✅ **Team participation works** - Admin joins team like any player

**Cons (Addressed):**
- ⚠️ "Large interface" - Actually smaller than original Option A (removed linkedAccountId, made managedTenantIds optional)
- ⚠️ "Mixed concerns" - FALSE: Players and admins share 90% of concerns (they both play!)
- ⚠️ "Complex security rules" - FALSE: Firebase Custom Claims make it simple

**Key Insight:** The original analysis assumed admins and players were separate. They're not - **admins ARE players with extra permissions**.

---

### Option B: Keep Separate Collections ❌ NO LONGER RECOMMENDED

```typescript
// Would require DUAL ACCOUNTS for admin who plays
export interface User extends MultiTenantEntity {
  id: string;
  // ... player fields
}

export interface AdminUser extends MultiTenantEntity {
  id: string;
  // ... admin fields only
}
```

**Problems:**
- ❌ **Admin plays game = needs TWO accounts** (User + AdminUser)
- ❌ **Data duplication** - email, displayName, photoURL stored twice
- ❌ **Complex sync logic** - Update profile → must update both collections
- ❌ **Confusing UX** - "Which account am I using right now?"
- ❌ **Team membership broken** - TeamMember.userId references which collection?

**Verdict:** Violates "owners can play the game" requirement

---

### Option C: Extract Common Base Interface ❌ NOT RECOMMENDED

Same issues as Option B - still requires dual accounts or complex inheritance.

---

## Recommended Solution: Option A (REVISED)

### Decision Rationale (Updated with New Context)

**Why Option A is NOW correct:**
1. ✅ **Admins can play the game** - They need ALL player fields (totalScore, submissions, etc.)
2. ✅ **Not in production** - Migration risk is zero (only emulator data)
3. ✅ **Custom Claims already exist** - Role stored in Firebase Auth, not Firestore
4. ✅ **Single source of truth** - One `users` collection, one `User` type
5. ✅ **accountType pattern exists** - Already have `'anonymous' | 'linked'`, extends naturally to roles
6. ✅ **Simpler architecture** - No need to sync UserProfile + User when admin plays game

**Why NOT Option B anymore:**
- ❌ **Dual accounts problem** - Admin who plays game would need TWO accounts (UserProfile + User)
- ❌ **Data duplication** - Same person's email/displayName stored twice
- ❌ **Complex sync** - Updating profile photo means updating both collections
- ❌ **Confusing UX** - "Am I logged in as admin or player?"

**Why NOT Option C:**
- ❌ Over-engineering remains true
- ❌ PlayerUser rename still breaking change

---

## Migration Plan (REVISED for Option A)

### Overview
Since the app is **not in production**, we can do a **clean migration** without backward compatibility concerns.

**Timeline:** 4-6 hours (all phases can be done consecutively)

---

### Phase 1: Update User Interface ✅

**Goal:** Merge User and UserProfile into single User type

**Steps:**

1. **Update schema.ts**
   ```typescript
   // BEFORE (TWO INTERFACES)
   export interface User extends MultiTenantEntity {
     id: string;
     displayName: string;
     email?: string;
     profilePhotoUrl?: string;
     accountType?: 'anonymous' | 'linked';
     linkedAccountId?: string;
     // ... player fields
   }
   
   export interface UserProfile extends MultiTenantEntity {
     uid: string;
     email: string;
     displayName?: string;
     photoURL?: string;
     role: 'superadmin' | 'admin' | 'organizer' | 'moderator';
     managedTenantIds: string[];
     isActive: boolean;
   }
   
   // AFTER (ONE INTERFACE)
   export interface User extends MultiTenantEntity {
     id: string;                    // Standardized from uid/id
     email: string;                 // Now required
     displayName: string;
     photoURL?: string;             // Standardized from profilePhotoUrl/photoURL
     
     // Account & Role
     accountType: 'anonymous' | 'linked';
     role: 'player' | 'moderator' | 'organizer' | 'admin' | 'superadmin';
     
     // Admin-Specific (optional)
     managedTenantIds?: string[];
     isActive?: boolean;            // Only for admin accounts
     
     // Player Fields (all users)
     recoveryCode?: string;
     recoveryCodeExpiresAt?: Date;
     recoveryCodeGeneratedAt?: Date;
     consentGiven: {
       terms: boolean;
       privacy: boolean;
       termsVersion: string;
       privacyVersion: string;
       termsAcceptedAt: Date;
       privacyAcceptedAt: Date;
       ipAddress?: string;
     };
     totalScore: number;
     totalSubmissions: number;
     eventsParticipated: number;
     lastLoginAt?: Date;
   }
   
   // REMOVE: UserProfile interface completely
   // REMOVE: linkedAccountId field (not needed with unified model)
   ```

2. **Update Type Exports**
   ```typescript
   // schema.ts - Remove UserProfile export
   // Keep only: User, Team, TeamMember, Task, Submission, etc.
   ```

**Testing:**
- ✅ TypeScript compilation fails (expected - Phase 2 will fix)
- ✅ Identify all files with UserProfile references

**Duration:** 30 minutes

---

### Phase 2: Update Code References 🔄

**Goal:** Replace all UserProfile usage with User

**Files to Update (8 total):**

1. **src/store/adminStore.ts**
   ```typescript
   // BEFORE
   import type { UserProfile } from '../types/schema';
   interface AdminState {
     adminProfile: UserProfile | null;
   }
   
   // AFTER
   import type { User } from '../types/schema';
   interface AdminState {
     adminProfile: User | null;  // Now uses unified User type
   }
   ```

2. **src/hooks/useAdminAuth.ts**
   ```typescript
   // BEFORE
   import type { UserProfile } from '../types/schema';
   return {
     adminProfile: UserProfile | null;
   }
   
   // AFTER
   import type { User } from '../types/schema';
   return {
     adminProfile: User | null;
   }
   
   // Update Firestore query
   // BEFORE: doc(db, 'userProfiles', user.uid)
   // AFTER: doc(db, 'users', user.uid)
   ```

3. **src/components/admin/AdminRoute.tsx**
   ```typescript
   // Update type imports
   import type { User } from '../types/schema';
   ```

4. **src/pages/admin/AdminLogin.tsx**
   ```typescript
   // Update type imports and Firestore references
   // BEFORE: const profileDoc = await getDoc(doc(db, 'userProfiles', user.uid));
   // AFTER: const userDoc = await getDoc(doc(db, 'users', user.uid));
   ```

5. **src/pages/admin/AdminDashboard.tsx**
   ```typescript
   // Update type usage
   import type { User } from '../types/schema';
   const adminProfile: User | null = useAdminStore(state => state.adminProfile);
   ```

6. **functions/src/index.ts**
   ```typescript
   // Update setUserRole function
   // BEFORE: db.collection('userProfiles').doc(uid)
   // AFTER: db.collection('users').doc(uid)
   
   // Update fields being set
   await userRef.set({
     id: uid,                      // Not uid
     email,
     displayName,
     photoURL,                     // Not profilePhotoUrl
     role,
     managedTenantIds,
     isActive: true,
     accountType: 'linked',        // NEW: admins are linked accounts
     // Initialize player fields with defaults
     totalScore: 0,
     totalSubmissions: 0,
     eventsParticipated: 0,
     consentGiven: {
       terms: true,
       privacy: true,
       termsVersion: '1.0',
       privacyVersion: '1.0',
       termsAcceptedAt: Timestamp.now(),
       privacyAcceptedAt: Timestamp.now(),
     },
     tenantId: 'global',
     createdAt: Timestamp.now(),
     updatedAt: Timestamp.now(),
   });
   ```

7. **scripts/seed-emulator.ts**
   ```typescript
   // Update admin creation
   // BEFORE: db.collection('userProfiles').doc(adminUser.uid)
   // AFTER: db.collection('users').doc(adminUser.uid)
   
   // Use unified User structure
   await userRef.set({
     id: adminUser.uid,
     email: adminEmail,
     displayName: adminDisplayName,
     role: 'superadmin',
     accountType: 'linked',
     // ... player fields
   });
   ```

8. **firestore.rules** (if needed)
   ```javascript
   // Update any userProfiles collection rules
   // BEFORE:
   match /userProfiles/{uid} {
     allow read: if request.auth != null;
   }
   
   // AFTER: (merged into users rules)
   match /users/{userId} {
     allow read: if request.auth != null;
     allow write: if false; // Still use Cloud Functions
     
     // Admins can query other users
     allow list: if hasAdminRole();
   }
   ```

**Testing:**
- ✅ TypeScript compilation passes
- ✅ No references to UserProfile remain
- ✅ Admin login flow compiles

**Duration:** 2 hours

---

### Phase 3: Database Migration 🔄

**Goal:** Merge userProfiles collection into users collection

**Migration Script:**
```typescript
// scripts/migrate-unified-user.ts
import * as admin from 'firebase-admin';

async function migrateToUnifiedUser() {
  const db = admin.firestore();
  
  console.log('🔄 Starting unified User migration...\n');
  
  // Step 1: Migrate existing userProfiles → users
  console.log('📦 Step 1: Migrating userProfiles to users collection...');
  const profilesSnapshot = await db.collection('userProfiles').get();
  
  for (const profileDoc of profilesSnapshot.docs) {
    const profileData = profileDoc.data();
    
    // Check if user already exists in users collection
    const userRef = db.collection('users').doc(profileDoc.id);
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      // MERGE: User already exists (was playing game), add admin fields
      console.log(`✏️  Merging admin role for existing user: ${profileDoc.id}`);
      await userRef.update({
        role: profileData.role || 'player',
        managedTenantIds: profileData.managedTenantIds || [],
        isActive: profileData.isActive !== false,
        // Keep existing player fields intact
      });
    } else {
      // CREATE: Admin never played, create new user with defaults
      console.log(`➕ Creating user for admin: ${profileDoc.id}`);
      await userRef.set({
        id: profileDoc.id,
        email: profileData.email,
        displayName: profileData.displayName || 'Admin User',
        photoURL: profileData.photoURL,
        accountType: 'linked',
        role: profileData.role || 'admin',
        managedTenantIds: profileData.managedTenantIds || [],
        isActive: profileData.isActive !== false,
        // Initialize player fields with defaults
        totalScore: 0,
        totalSubmissions: 0,
        eventsParticipated: 0,
        consentGiven: {
          terms: true,
          privacy: true,
          termsVersion: '1.0',
          privacyVersion: '1.0',
          termsAcceptedAt: admin.firestore.Timestamp.now(),
          privacyAcceptedAt: admin.firestore.Timestamp.now(),
        },
        tenantId: profileData.tenantId || 'global',
        createdAt: profileData.createdAt || admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
      });
    }
  }
  
  // Step 2: Update existing users (players) with role field
  console.log('\n📦 Step 2: Updating existing users with role field...');
  const usersSnapshot = await db.collection('users').get();
  
  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const updates: any = {};
    
    // Add role if missing (default to player)
    if (!userData.role) {
      updates.role = 'player';
    }
    
    // Ensure accountType is set
    if (!userData.accountType) {
      updates.accountType = userData.email ? 'linked' : 'anonymous';
    }
    
    // Standardize photoURL
    if (userData.profilePhotoUrl && !userData.photoURL) {
      updates.photoURL = userData.profilePhotoUrl;
    }
    
    // Remove deprecated fields
    if (userData.linkedAccountId) {
      updates.linkedAccountId = admin.firestore.FieldValue.delete();
    }
    
    if (Object.keys(updates).length > 0) {
      await userDoc.ref.update(updates);
      console.log(`✅ Updated user ${userDoc.id}`);
    }
  }
  
  // Step 3: Verify migration
  console.log('\n🔍 Step 3: Verifying migration...');
  const finalUsersSnapshot = await db.collection('users').get();
  const adminUsers = finalUsersSnapshot.docs.filter(d => 
    ['admin', 'superadmin', 'organizer', 'moderator'].includes(d.data().role)
  );
  
  console.log(`✅ Total users: ${finalUsersSnapshot.size}`);
  console.log(`✅ Admin users: ${adminUsers.length}`);
  console.log(`✅ Player users: ${finalUsersSnapshot.size - adminUsers.length}`);
  
  // Step 4: Delete userProfiles collection (EMULATOR ONLY)
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log('\n🗑️  Step 4: Deleting userProfiles collection (emulator only)...');
    for (const doc of profilesSnapshot.docs) {
      await doc.ref.delete();
      console.log(`🗑️  Deleted userProfile: ${doc.id}`);
    }
  } else {
    console.log('\n⚠️  Skipping userProfiles deletion in production');
    console.log('   Run manual cleanup after verifying migration');
  }
  
  console.log('\n✅ Migration complete!');
}

// Run migration
admin.initializeApp();
migrateToUnifiedUser().catch(console.error);
```

**Execution:**
```bash
# Dev (Emulator) - Safe to run immediately
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
ts-node scripts/migrate-unified-user.ts

# Production (if ever needed)
# 1. Take full backup first
firebase firestore:export gs://backup-bucket/pre-unified-migration

# 2. Run migration (modify script to skip deletion)
ts-node scripts/migrate-unified-user.ts

# 3. Verify in Firebase Console
# 4. Manually delete userProfiles after 30 days
```

**Testing:**
- ✅ All users have `role` field
- ✅ Admins have `managedTenantIds`, `isActive`
- ✅ All users have player fields (totalScore, etc.)
- ✅ No userProfiles collection remains (emulator)
- ✅ Custom Claims still work

**Duration:** 1 hour (including testing)

---

### Phase 4: Update Security Rules 🔒

**Goal:** Consolidate security rules for unified users collection

**Changes:**

```javascript
// firestore.rules

// HELPER: Check if user has admin role (from Custom Claims)
function hasAdminRole() {
  return request.auth != null && 
         request.auth.token != null &&
         request.auth.token.role != null &&
         request.auth.token.role in ['admin', 'superadmin', 'organizer', 'moderator'];
}

// Users collection (unified)
match /users/{userId} {
  // Anyone can read their own profile
  allow read: if request.auth != null && request.auth.uid == userId;
  
  // Admins can list/query users
  allow list: if hasAdminRole();
  
  // NO CLIENT WRITES - use Cloud Functions only
  allow create, update, delete: if false;
}

// REMOVE: userProfiles collection rules (no longer exists)
```

**Testing:**
- ✅ Players can read own profile
- ✅ Admins can query all users
- ✅ Client writes blocked
- ✅ Cloud Functions can still write (Admin SDK)

**Duration:** 30 minutes

---

### Phase 5: Update Admin UI 🎨

**Goal:** Update admin dashboard to show unified user data

**Changes:**

1. **Admin Dashboard**
   ```typescript
   // Show role badge
   const roleBadge = {
     superadmin: 'bg-red-600',
     admin: 'bg-blue-600',
     organizer: 'bg-purple-600',
     moderator: 'bg-green-600',
     player: 'bg-gray-600',
   }[adminProfile.role];
   
   // Show game stats (if admin has played)
   {adminProfile.eventsParticipated > 0 && (
     <div className="mt-4 p-4 bg-slate-700 rounded">
       <h3>Your Game Stats</h3>
       <p>Events: {adminProfile.eventsParticipated}</p>
       <p>Score: {adminProfile.totalScore}</p>
       <p>Submissions: {adminProfile.totalSubmissions}</p>
     </div>
   )}
   ```

2. **Admin Routes**
   ```typescript
   // AdminRoute component already checks Custom Claims
   // No changes needed - role check still works
   ```

**Testing:**
- ✅ Admin can see their role
- ✅ Admin can see game stats (if they've played)
- ✅ Route guards still work

**Duration:** 1 hour

---

## Implementation Timeline (REVISED)

| Phase | Duration | Risk | Rollback |
|-------|----------|------|----------|
| **Phase 1: Update Schema** | 30 min | Low | ✅ Git revert |
| **Phase 2: Update Code** | 2 hours | Medium | ✅ Git revert |
| **Phase 3: Database Migration** | 1 hour | Low | ✅ Re-import emulator data |
| **Phase 4: Security Rules** | 30 min | Low | ✅ Restore old rules |
| **Phase 5: Admin UI** | 1 hour | Low | ✅ Git revert |

**Total Time:** 5 hours (can be done in one session)

**Risk Level:** ⚠️ LOW (not in production, emulator data only)

---

## Key Architecture Benefits

### 1. Admins Can Play the Game ✅

```typescript
// Admin logs in, joins a team, plays game
const admin: User = {
  id: 'admin123',
  email: 'sarah@esn.org',
  displayName: 'Sarah (ESN Admin)',
  role: 'organizer',
  accountType: 'linked',
  
  // Admin fields
  managedTenantIds: ['esn-munich'],
  isActive: true,
  
  // Player fields (accumulate as they play)
  totalScore: 450,
  totalSubmissions: 12,
  eventsParticipated: 3,
  // ...
};

// Can create TeamMember like any player
const membership: TeamMember = {
  userId: 'admin123',  // ← Same User document
  teamId: 'team-explorers',
  eventId: 'oktoberfest-2025',
  role: 'member',
  // ...
};
```

**Before (Broken):** Admin would need TWO accounts
**After (Fixed):** Single account, plays game naturally

---

### 2. Firebase Custom Claims as Source of Truth

```typescript
// Role stored in TWO places:
// 1. Firebase Custom Claims (authoritative, enforced at auth level)
// 2. Firestore User.role (for queries/display, synced from Claims)

// Cloud Function sets both
await admin.auth().setCustomUserClaims(uid, { 
  role: 'organizer',
  tenantIds: ['esn-munich']
});

await db.collection('users').doc(uid).update({
  role: 'organizer',  // Synced for convenience
  managedTenantIds: ['esn-munich']
});

// Client checks Custom Claims for route guards
const idToken = await user.getIdTokenResult();
if (['admin', 'superadmin'].includes(idToken.claims.role)) {
  // Allow access to admin routes
}

// Firestore rules check Custom Claims
function hasAdminRole() {
  return request.auth.token.role in ['admin', 'superadmin', 'organizer', 'moderator'];
}
```

**Benefit:** Security enforced at Firebase Auth level, not just Firestore rules

---

### 3. Simplified Data Model

**Before (Two Collections):**
```
users/
  user123 → { id, displayName, email, totalScore: 100 }  // Player

userProfiles/
  admin456 → { uid, email, displayName, role: 'admin' }  // Admin

// Problem: Admin wants to play game → needs ANOTHER document in users/
users/
  admin456 → { id, displayName, email, totalScore: 50 }  // Same person!
```

**After (One Collection):**
```
users/
  user123 → { id, role: 'player', totalScore: 100 }
  admin456 → { id, role: 'admin', totalScore: 50, managedTenantIds: [...] }
```

**Benefit:** Single source of truth, no duplicate profiles

---

### 4. Account Type Evolution

The `accountType` field already supports user evolution:

```typescript
// Day 1: User creates anonymous account
const user: User = {
  id: 'abc123',
  displayName: 'Player_4729',
  accountType: 'anonymous',  // No email yet
  role: 'player',
  // ...
};

// Day 7: User links email/password
// (via IdentityUplinkModal.tsx)
await updateDoc(userRef, {
  accountType: 'linked',
  email: 'player@email.com',
});

// Day 30: User promoted to moderator
// (via setUserRole Cloud Function)
await admin.auth().setCustomUserClaims(uid, { role: 'moderator' });
await updateDoc(userRef, {
  role: 'moderator',
  managedTenantIds: ['esn-berlin'],
  isActive: true,
});
```

**Benefit:** Natural progression from anonymous → linked → admin, all in one document

---

## Addressing Original Concerns

### Concern: "Large interface with many optional fields"

**Response:** Actually cleaner than before!

**Removed fields:**
- ❌ `linkedAccountId` - Not needed with unified model
- ❌ `recoveryCodeGeneratedAt` - Redundant with expiresAt

**Optional fields breakdown:**
- `photoURL` - Optional for everyone (not all users have photos)
- `managedTenantIds` - Optional (undefined for players, array for admins)
- `isActive` - Optional (undefined for players, boolean for admins)
- `recoveryCode` - Optional (only set when generated)
- `lastLoginAt` - Optional (set after first login)

**Required fields:** Only 8
- id, email, displayName, accountType, role, totalScore, totalSubmissions, eventsParticipated, consentGiven

---

### Concern: "Mixed concerns (player + admin)"

**Response:** FALSE - They're the SAME concern!

**Reality Check:**
- Admins ARE players who can also manage events
- ESN organizers play their own scavenger hunts
- Like GitHub: developers can create repos AND contribute to other repos
- Like Discord: server owners can also chat in channels

**Not mixing concerns:**
✅ User (person) vs Team (group) - DIFFERENT
✅ User (person) vs Event (activity) - DIFFERENT
❌ Player (user role) vs Admin (user role) - SAME PERSON, different permissions

---

### Concern: "Complex security rules"

**Response:** Actually SIMPLER with Custom Claims!

**Before (Two Collections):**
```javascript
match /users/{userId} {
  allow read: if request.auth.uid == userId;
  allow write: if false;
}

match /userProfiles/{uid} {
  allow read: if request.auth != null;
  allow write: if false;
}

// Problem: How to query "all users" for admin dashboard?
// Answer: Can't - need to query TWO collections
```

**After (One Collection):**
```javascript
match /users/{userId} {
  // Players read own profile
  allow read: if request.auth.uid == userId;
  
  // Admins can list all users (for management)
  allow list: if hasAdminRole();  // ← Custom Claims check
  
  allow write: if false;  // Still use Cloud Functions
}

function hasAdminRole() {
  return request.auth.token.role in ['admin', 'superadmin', 'organizer', 'moderator'];
}
```

**Benefit:** Single collection, clear rules, Custom Claims make role checks trivial

---

## Testing Strategy (REVISED)

### Phase 1-2: Code Changes

**Unit Tests:**
```typescript
// src/__tests__/types/schema.test.ts
import { User } from '../../types/schema';

test('User supports both player and admin roles', () => {
  const player: User = {
    id: 'player123',
    email: 'player@test.com',
    displayName: 'Test Player',
    accountType: 'anonymous',
    role: 'player',
    totalScore: 100,
    totalSubmissions: 5,
    eventsParticipated: 1,
    consentGiven: { /* ... */ },
    tenantId: 'tenant1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  expect(player.role).toBe('player');
  expect(player.managedTenantIds).toBeUndefined();
  
  const admin: User = {
    ...player,
    id: 'admin123',
    role: 'admin',
    managedTenantIds: ['tenant1', 'tenant2'],
    isActive: true,
  };
  expect(admin.role).toBe('admin');
  expect(admin.totalScore).toBe(100); // Admin can play!
});
```

**Integration Tests:**
```bash
# Admin login still works
npm run test:e2e -- admin-login.spec.ts

# Admin can join team and play
npm run test:e2e -- admin-gameplay.spec.ts

# Role checks work
npm run test -- useAdminAuth.test.ts
```

---

### Phase 3: Migration Testing

**Pre-Migration Checklist:**
- [ ] Backup emulator data: `firebase emulators:export ./backup`
- [ ] Count users: `users` and `userProfiles` collections
- [ ] Verify Custom Claims: Check Firebase Auth Emulator UI

**Post-Migration Validation:**
```bash
# Run migration
ts-node scripts/migrate-unified-user.ts

# Verify results
firebase firestore:query users --limit 10

# Check counts
# Before: users=50, userProfiles=5
# After: users=55 (merged), userProfiles=0 (deleted)

# Test admin login
npm run dev
# Visit http://localhost:5173/admin/login
# Login with admin@test.com / admin123

# Test admin gameplay
# Visit http://localhost:5173/dashboard
# Verify admin can see teams, join team, submit tasks
```

**Rollback (if needed):**
```bash
# Restore emulator data
firebase emulators:start --import ./backup

# Revert code changes
git revert <commit-hash>
```

---

### Manual Test Checklist

**Player Flows (should still work):**
- [ ] Anonymous user creates account
- [ ] User links email/password (accountType: anonymous → linked)
- [ ] User joins team
- [ ] User submits task
- [ ] User sees dashboard stats

**Admin Flows (should work):**
- [ ] Admin logs in at /admin/login
- [ ] Admin sees dashboard
- [ ] Admin role check works (Custom Claims)
- [ ] Admin can query all users

**New Admin Gameplay Flows (NEW - should work):**
- [ ] Admin visits /dashboard (player dashboard)
- [ ] Admin can see events list
- [ ] Admin can browse teams
- [ ] Admin can join a team
- [ ] Admin can submit tasks
- [ ] Admin stats update (totalScore, submissions)
- [ ] Admin TeamMember document created correctly

---

## Risk Assessment (REVISED)

### Zero Risk ✅
- **Not in production** - No real user data at stake
- **Emulator only** - Can reset anytime
- **Git versioned** - Easy rollback

### Low Risk ✅
- **Type changes** - Caught by TypeScript compiler
- **Migration script** - Tested on emulator first
- **Custom Claims unchanged** - Still work exactly the same

### Medium Risk ⚠️
- **Service layer changes** - Need thorough testing of user.service.ts
- **Firestore queries** - Update all `userProfiles` references

### Mitigation
1. **Run TypeScript compiler** - Catches 90% of issues
2. **Test on emulator** - Before any production consideration
3. **Incremental commits** - Each phase separately
4. **Pair programming** - For migration script execution

---

## Alternative: Do Nothing (REJECTED)

**If we keep dual User/UserProfile:**

**Problems:**
- ❌ **Admin can't play game** - Violates core requirement
- ❌ **Need dual accounts** - Admin creates User + UserProfile
- ❌ **Data duplication** - Email, name, photo stored twice
- ❌ **Complex sync** - Profile updates need two writes
- ❌ **Confusing UX** - "Which account am I using?"
- ❌ **TeamMember broken** - userId references which document?
- ❌ **Technical debt** - Gets worse as features added

**Why we MUST refactor:**
The dual-type system is fundamentally incompatible with "owners can play the game" requirement.

---

## Documentation Updates Needed

After migration:

1. **README.md**
   - Update schema description (single User type)
   - Document role hierarchy
   - Explain that admins can play

2. **.github/copilot-instructions.md**
   - Update User interface documentation
   - Remove UserProfile references
   - Document role field and Custom Claims

3. **src/types/schema.ts**
   - Add comprehensive JSDoc comments
   - Explain optional fields (managedTenantIds, isActive)
   - Document role enum values

4. **ARCHITECT_MEMORY.md**
   - Update user schema section
   - Document unified model benefits
   - Add migration history

**Example JSDoc:**
```typescript
/**
 * User - Unified interface for all users in the system
 * 
 * Represents both players and administrators. All users can participate in
 * events (play the game), while users with admin roles have additional
 * permissions to manage tenants and events.
 * 
 * ROLE HIERARCHY:
 * - player: Can join teams and submit tasks
 * - moderator: Can moderate submissions
 * - organizer: Can create/manage events for assigned tenants
 * - admin: Can manage users and tenants
 * - superadmin: Full system access
 * 
 * AUTHENTICATION:
 * - Role is stored in Firebase Custom Claims (authoritative)
 * - Role is mirrored in Firestore for queries (synced by setUserRole function)
 * - Custom Claims checked by security rules and route guards
 * 
 * ADMIN GAMEPLAY:
 * - Admins can join teams and play like regular players
 * - Player stats (totalScore, eventsParticipated) accumulate normally
 * - managedTenantIds and isActive fields only relevant for admin permissions
 * 
 * @property id - Firebase Auth UID
 * @property role - User's permission level (synced from Custom Claims)
 * @property accountType - How user authenticated (anonymous or email/password)
 * @property managedTenantIds - Tenants this user can manage (empty for players)
 * @property isActive - Whether admin account is active (undefined for players)
 * 
 * @see functions/src/index.ts setUserRole - Sets role via Custom Claims
 * @see firestore.rules - Security rules enforce role-based access
 */
export interface User extends MultiTenantEntity {
  // ...
}
```

---

## Decision Required

**REVISED RECOMMENDATION: Proceed with Option A (Unified User Type)**

### Why This Changed from Original Analysis

| Factor | Original Analysis | With New Context |
|--------|------------------|------------------|
| **Admin gameplay** | Not mentioned | ✅ **CRITICAL REQUIREMENT** |
| **Production status** | Assumed in use | ✅ Not in production (zero risk) |
| **Data model** | Assumed separation needed | ❌ Separation breaks gameplay |
| **Migration complexity** | High (dual collections) | Low (emulator only) |

### What We Now Know

1. ✅ **Admins MUST be able to play** - This is a core feature, not edge case
2. ✅ **App is in development** - No production data to migrate
3. ✅ **Custom Claims exist** - Role management already implemented
4. ✅ **accountType pattern exists** - Framework for user type discrimination

### Recommended Action

**✅ PROCEED WITH OPTION A - Unified User Type**

**Timeline:**
- Phase 1-2: Code changes (2.5 hours)
- Phase 3: Migration (1 hour)
- Phase 4: Security rules (0.5 hour)
- Phase 5: Admin UI updates (1 hour)

**Total: 5 hours** (can complete in one work session)

**Risk: LOW** ✅
- Emulator only
- Git versioned
- TypeScript catches issues
- Easy rollback

---

## Next Steps

### Immediate (After Approval)

1. ✅ **Review this revised analysis**
2. ✅ **Confirm "admins can play" requirement**
3. ✅ **Approve Option A approach**
4. ⏹️ **Create implementation branch**
   ```bash
   git checkout -b refactor/unified-user-schema
   ```

### Phase 1: Schema Update (30 min)

1. ⏹️ Update `src/types/schema.ts`
   - Merge User + UserProfile
   - Add role field
   - Standardize to photoURL
   - Remove linkedAccountId
   
2. ⏹️ Remove UserProfile export
3. ⏹️ Commit changes
   ```bash
   git add src/types/schema.ts
   git commit -m "refactor: merge User and UserProfile into unified User type"
   ```

### Phase 2: Update Code (2 hours)

1. ⏹️ Update all UserProfile imports → User
2. ⏹️ Update adminStore.ts
3. ⏹️ Update useAdminAuth.ts (change collection reference)
4. ⏹️ Update Cloud Functions
5. ⏹️ Update seed-emulator.ts
6. ⏹️ Fix TypeScript errors
7. ⏹️ Commit changes
   ```bash
   git add .
   git commit -m "refactor: update all UserProfile references to User"
   ```

### Phase 3: Migration (1 hour)

1. ⏹️ Create migration script `scripts/migrate-unified-user.ts`
2. ⏹️ Test on emulator
3. ⏹️ Verify results
4. ⏹️ Commit script
   ```bash
   git add scripts/migrate-unified-user.ts
   git commit -m "feat: add migration script for unified user schema"
   ```

### Phase 4: Security Rules (30 min)

1. ⏹️ Update `firestore.rules`
2. ⏹️ Remove userProfiles rules
3. ⏹️ Add admin list permission to users collection
4. ⏹️ Test with emulator
5. ⏹️ Commit changes
   ```bash
   git add firestore.rules
   git commit -m "refactor: update security rules for unified user collection"
   ```

### Phase 5: Admin UI (1 hour)

1. ⏹️ Update AdminDashboard to show game stats
2. ⏹️ Test admin login
3. ⏹️ Test admin gameplay (join team, submit task)
4. ⏹️ Commit changes
   ```bash
   git add src/pages/admin/
   git commit -m "feat: show admin game stats in dashboard"
   ```

### Final Steps

1. ⏹️ Run full test suite
   ```bash
   npm test
   npm run test:e2e
   ```

2. ⏹️ Update documentation
   ```bash
   git add docs/ README.md .github/copilot-instructions.md
   git commit -m "docs: update for unified user schema"
   ```

3. ⏹️ Create PR
   ```bash
   gh pr create \
     --title "Refactor: Unified User Schema (Admins Can Play)" \
     --body "Merges User and UserProfile into single User type. Enables admins to play game while maintaining role-based permissions via Custom Claims."
   ```

4. ⏹️ Merge to main (after review)
5. ⏹️ Re-seed emulator with new schema
   ```bash
   firebase emulators:start --import=./backup
   npm run seed:emulator
   ```

---

## Appendix: File Impact Summary (REVISED)

### Files Modified (All Phases)

| File | Change Type | Lines Changed | Risk |
|------|-------------|---------------|------|
| `src/types/schema.ts` | **Major** | ~50 lines | Low (TypeScript catches) |
| `src/store/adminStore.ts` | Minor | ~5 lines | Low |
| `src/hooks/useAdminAuth.ts` | Minor | ~10 lines | Low |
| `src/components/admin/AdminRoute.tsx` | Import only | ~2 lines | Low |
| `src/pages/admin/AdminLogin.tsx` | Minor | ~8 lines | Low |
| `src/pages/admin/AdminDashboard.tsx` | Medium | ~20 lines | Low |
| `functions/src/index.ts` | Medium | ~30 lines | Medium |
| `scripts/seed-emulator.ts` | Minor | ~15 lines | Low |
| `firestore.rules` | Minor | ~10 lines | Low |

**Total Files:** 9  
**Total Changes:** ~150 lines  
**Estimated Time:** 5 hours

### New Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `scripts/migrate-unified-user.ts` | Migration script | ~150 |
| `docs/USER_SCHEMA_REFACTORING_ANALYSIS.md` | This document | ~1500 |

### Files Removed

| File | Reason |
|------|--------|
| None | UserProfile removed from schema.ts only |

### Collections Affected

| Collection | Change | Risk |
|------------|--------|------|
| `users` | Add role, managedTenantIds, isActive fields | Low |
| `userProfiles` | **Deleted** (merged into users) | Low (emulator only) |

---

**Document Version:** 2.0 (Revised)  
**Last Updated:** 28 December 2025  
**Author:** Development Team  
**Status:** ✅ READY FOR IMPLEMENTATION - Option A Recommended  
**Approval Required:** Yes (confirm "admins can play" requirement)
