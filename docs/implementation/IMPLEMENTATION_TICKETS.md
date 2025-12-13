# 🎫 Multi-Event Authentication System - Implementation Tickets

**Project:** Multi-Event User Flow & Authentication  
**Sprint Duration:** 6 Weeks  
**Start Date:** December 11, 2025  
**Target Release:** January 22, 2026  
**Status:** 📋 Ready for Development

---

## 📊 Project Overview

### **Epic:** Enable Multi-Event Participation with Anonymous Auth

**Business Goals:**
- Users can join multiple events across different tenants
- Maintain fast onboarding (<10 seconds per user)
- Provide optional account recovery mechanisms
- Enable friend discovery across events

**Technical Goals:**
- Keep anonymous authentication (speed priority)
- Minimal schema changes (backward compatible)
- Build event switcher UI
- Add optional account linking

**Success Metrics:**
- ✅ User can join 3+ events successfully
- ✅ Onboarding time < 10 seconds
- ✅ Event switching < 3 seconds
- ✅ Query performance < 500ms
- ✅ Recovery success rate > 80%

---

## 🗂️ Development Phases

### **Phase 1: Foundation (Week 1)** - Schema & Data Layer
- Tickets #1-4: Update data models, Cloud Functions, indexes

### **Phase 2: Service Layer (Week 2)** - Business Logic
- Tickets #5-8: Update services, add multi-event support

### **Phase 3: Core UI (Week 3-4)** - Essential Components
- Tickets #9-13: Event switcher, browse teams, login flow

### **Phase 4: Enhancement (Week 5)** - Optional Features
- Tickets #14-17: Recovery codes, account linking, validation

### **Phase 5: Testing & Polish (Week 6)** - QA & Deployment
- Tickets #18-20: E2E tests, security audit, deployment

---

## 📝 Ticket List (Sequential Order)

```
PHASE 1: FOUNDATION
├─ [TICKET-1] Update User Schema (Add accountType field)
├─ [TICKET-2] Update Cloud Function (Support new User fields)
├─ [TICKET-3] Create Firestore Composite Indexes
└─ [TICKET-4] Update Security Rules (Multi-event validation)

PHASE 2: SERVICE LAYER
├─ [TICKET-5] Update user.service.ts (Multi-event support)
├─ [TICKET-6] Update team.service.ts (Add helper functions)
├─ [TICKET-7] Create teamMember.service.ts (Participation tracking)
└─ [TICKET-8] Add Validation Logic (1 team per event)

PHASE 3: CORE UI
├─ [TICKET-9] Create EventSwitcher Component
├─ [TICKET-10] Update BrowseTeams Component (URL context)
├─ [TICKET-11] Update LoginPage Component (Detect existing users)
├─ [TICKET-12] Update App Routing (Multi-tenant URLs)
└─ [TICKET-13] Create EventHeader Component (Context indicator)

PHASE 4: ENHANCEMENT
├─ [TICKET-14] Create AccountSettings Component
├─ [TICKET-15] Add Recovery Code System (6-digit codes)
├─ [TICKET-16] Add Email/Password Linking (Optional)
└─ [TICKET-17] Build Friend Search (Across events)

PHASE 5: TESTING & DEPLOYMENT
├─ [TICKET-18] Write E2E Tests (Multi-event flows)
├─ [TICKET-19] Security Audit (Tenant isolation)
└─ [TICKET-20] Production Deployment (Staged rollout)
```

---

# 📋 PHASE 1: FOUNDATION

---

## [TICKET-1] Update User Schema - Add accountType Field

**Priority:** 🔴 Critical  
**Story Points:** 2  
**Assignee:** Backend Developer  
**Dependencies:** None  
**Estimated Time:** 2 hours

### **Description:**
Update the User interface in schema.ts to support multi-event participation and optional account linking. Add new fields for account type and recovery mechanisms.

### **Current State:**
```typescript
// File: src/types/schema.ts
export interface User extends MultiTenantEntity {
  id: string;
  displayName: string;
  email?: string;
  tenantId: string;  // ← Represents single tenant
  totalScore: number;
  totalSubmissions: number;
  eventsParticipated: number;
  consentGiven: {...};
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}
```

### **Expected State:**
```typescript
// File: src/types/schema.ts
export interface User extends MultiTenantEntity {
  id: string;
  displayName: string;
  email?: string;
  tenantId: string;  // ← Now means "home tenant" (first joined)
  
  // NEW: Account type tracking
  accountType: 'anonymous' | 'linked';  // Default: 'anonymous'
  linkedAccountId?: string;  // UID of linked email/password account
  
  // NEW: Recovery mechanism
  recoveryCode?: string;  // 6-digit code for account recovery
  recoveryCodeExpiresAt?: Date;  // 30 days from generation
  recoveryCodeGeneratedAt?: Date;  // Track when code was created
  
  // Stats (unchanged)
  totalScore: number;
  totalSubmissions: number;
  eventsParticipated: number;
  
  // Compliance (unchanged)
  consentGiven: {...};
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}
```

### **Acceptance Criteria:**
- [ ] User interface updated with new fields
- [ ] JSDoc comments added for new fields
- [ ] TypeScript compilation passes
- [ ] No breaking changes to existing code
- [ ] Schema version documented in comments

### **Testing:**
- [ ] TypeScript type checks pass
- [ ] No ESLint warnings
- [ ] Existing User creation still works

### **Files to Modify:**
- `src/types/schema.ts` (User interface)

### **Notes:**
- ⚠️ This is a NON-BREAKING change (all new fields are optional)
- ✅ Existing User documents will continue to work
- ✅ accountType defaults to 'anonymous' if not present
- 📝 Add comment: "Multi-event participation via TeamMember records"

---

## [TICKET-2] Update Cloud Function - Support New User Fields

**Priority:** 🔴 Critical  
**Story Points:** 3  
**Assignee:** Backend Developer  
**Dependencies:** TICKET-1  
**Estimated Time:** 3 hours

### **Description:**
Update the `createUserDocument` Cloud Function to support the new User schema fields. Ensure backward compatibility with existing user creation flow.

### **Current State:**
```typescript
// File: functions/src/index.ts (assumed location)
exports.createUserDocument = functions
  .region('europe-west3')
  .https.onCall(async (data, context) => {
    // Validate auth
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    const uid = context.auth.uid;
    const { displayName, email, tenantId, consentGiven } = data;
    
    // Create user document
    await admin.firestore().collection('users').doc(uid).set({
      id: uid,
      displayName,
      email,
      tenantId,
      totalScore: 0,
      totalSubmissions: 0,
      eventsParticipated: 0,
      consentGiven,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true };
  });
```

### **Expected State:**
```typescript
// File: functions/src/index.ts
exports.createUserDocument = functions
  .region('europe-west3')
  .https.onCall(async (data, context) => {
    // Validate auth
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    
    const uid = context.auth.uid;
    const { 
      displayName, 
      email, 
      tenantId, 
      consentGiven,
      accountType = 'anonymous'  // NEW: Default to anonymous
    } = data;
    
    // Validate required fields
    if (!displayName || !tenantId || !consentGiven) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }
    
    // Check if user already exists
    const existingUser = await admin.firestore().collection('users').doc(uid).get();
    if (existingUser.exists) {
      throw new functions.https.HttpsError('already-exists', 'User already exists');
    }
    
    // Create user document with new fields
    await admin.firestore().collection('users').doc(uid).set({
      id: uid,
      displayName,
      email: email || null,
      tenantId,  // Home tenant
      accountType,  // NEW: 'anonymous' or 'linked'
      linkedAccountId: null,  // NEW: Initially null
      recoveryCode: null,  // NEW: Initially null
      recoveryCodeExpiresAt: null,  // NEW: Initially null
      recoveryCodeGeneratedAt: null,  // NEW: Initially null
      totalScore: 0,
      totalSubmissions: 0,
      eventsParticipated: 0,
      consentGiven,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`✅ User created: ${uid} (${accountType})`);
    return { success: true, userId: uid };
  });
```

### **Acceptance Criteria:**
- [ ] Cloud Function accepts new fields (accountType)
- [ ] Defaults accountType to 'anonymous' if not provided
- [ ] Sets new fields to null initially
- [ ] Validates required fields before creation
- [ ] Returns userId in response
- [ ] Logs user creation with account type
- [ ] Error handling for existing users

### **Testing:**
- [ ] Deploy to Firebase emulator
- [ ] Test with accountType='anonymous'
- [ ] Test with accountType='linked'
- [ ] Test without accountType (should default)
- [ ] Test existing user error handling
- [ ] Test missing required fields error

### **Files to Modify:**
- `functions/src/index.ts` (createUserDocument function)
- `functions/package.json` (ensure dependencies up to date)

### **Deployment:**
```bash
# Deploy Cloud Function
cd functions
npm run build
firebase deploy --only functions:createUserDocument
```

### **Notes:**
- ⚠️ Test in emulator first before production deploy
- 📝 Add logging for debugging
- ✅ Backward compatible (existing calls still work)

---

## [TICKET-3] Create Firestore Composite Indexes

**Priority:** 🔴 Critical  
**Story Points:** 1  
**Assignee:** Backend Developer  
**Dependencies:** None  
**Estimated Time:** 1 hour

### **Description:**
Create Firestore composite indexes required for efficient multi-event queries. These indexes enable fast team browsing, user event lookup, and member search.

### **Current State:**
```json
// File: firestore.indexes.json
{
  "indexes": [],
  "fieldOverrides": []
}
```

### **Expected State:**
```json
// File: firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "teams",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "eventId", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "memberCount", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "teamMembers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "joinedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "teamMembers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "eventId", "order": "ASCENDING" },
        { "fieldPath": "displayName", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "teamMembers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "eventId", "order": "ASCENDING" },
        { "fieldPath": "teamId", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "recoveryCode", "order": "ASCENDING" },
        { "fieldPath": "recoveryCodeExpiresAt", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

### **Index Purpose:**

**Index 1: Browse Teams by Event**
- Query: Get all teams in specific event, ordered by availability
- Use case: Browse Teams screen
- Performance: ~50ms for 15 teams

**Index 2: User's Event Participation**
- Query: Get all events user has joined, most recent first
- Use case: Event Switcher component
- Performance: ~30ms for 5 events

**Index 3: Search Members in Event**
- Query: Find members by name within event
- Use case: Friend search in event
- Performance: ~40ms for prefix match

**Index 4: Team Members by Event**
- Query: Get all members of teams in event
- Use case: Team detail, member counts
- Performance: ~35ms for 50 members

**Index 5: Recovery Code Lookup**
- Query: Find user by recovery code (not expired)
- Use case: Account recovery flow
- Performance: ~20ms (unique lookup)

### **Acceptance Criteria:**
- [ ] firestore.indexes.json file created/updated
- [ ] All 5 indexes defined correctly
- [ ] Indexes deployed to Firebase
- [ ] No error messages in Firebase console
- [ ] Test queries execute without index warnings

### **Testing:**
```typescript
// Test Index 1: Browse teams
const q1 = query(
  collection(db, 'teams'),
  where('tenantId', '==', 'test-tenant'),
  where('eventId', '==', 'test-event'),
  where('isActive', '==', true),
  orderBy('memberCount', 'asc')
);

// Test Index 2: User's events
const q2 = query(
  collection(db, 'teamMembers'),
  where('userId', '==', 'user-123'),
  where('isActive', '==', true),
  orderBy('joinedAt', 'desc')
);

// Test Index 3: Search members
const q3 = query(
  collection(db, 'teamMembers'),
  where('eventId', '==', 'test-event'),
  where('displayName', '>=', 'Ali'),
  where('displayName', '<=', 'Ali\uf8ff'),
  orderBy('displayName', 'asc')
);
```

### **Files to Modify:**
- `firestore.indexes.json` (create if doesn't exist)

### **Deployment:**
```bash
# Deploy indexes
firebase deploy --only firestore:indexes

# Monitor index build status
firebase firestore:indexes

# Expected output:
# teams: (tenantId, eventId, isActive, memberCount) - READY
# teamMembers: (userId, isActive, joinedAt) - READY
# teamMembers: (eventId, displayName) - READY
# teamMembers: (tenantId, eventId, teamId) - READY
# users: (recoveryCode, recoveryCodeExpiresAt) - READY
```

### **Notes:**
- ⏱️ Index building takes 2-5 minutes for small datasets
- ⏱️ Index building takes 30-60 minutes for large datasets (1M+ docs)
- 📝 Firebase will suggest missing indexes via error messages
- ✅ Indexes are built automatically in background

---

## [TICKET-4] Update Security Rules - Multi-Event Validation

**Priority:** 🟡 High  
**Story Points:** 3  
**Assignee:** Backend Developer  
**Dependencies:** TICKET-1, TICKET-3  
**Estimated Time:** 3 hours

### **Description:**
Update Firestore security rules to support multi-event participation while maintaining tenant isolation. Add validation for new User fields and TeamMember creation rules.

### **Current State:**
```javascript
// File: firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow create: if false;  // Only Cloud Function
    }
    
    // Team Members collection
    match /teamMembers/{memberId} {
      allow read: if true;  // Public read for browse teams
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    
    // Teams collection
    match /teams/{teamId} {
      allow read: if true;
      allow update: if request.auth.uid == resource.data.ownerUserId;
    }
  }
}
```

### **Expected State:**
```javascript
// File: firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function isValidEvent(eventId) {
      return exists(/databases/$(database)/documents/events/$(eventId))
          && get(/databases/$(database)/documents/events/$(eventId)).data.isActive == true;
    }
    
    function isValidTenant(tenantId) {
      return exists(/databases/$(database)/documents/tenants/$(tenantId))
          && get(/databases/$(database)/documents/tenants/$(tenantId)).data.isActive == true;
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isOwner(userId);
      
      allow update: if isOwner(userId)
                    && !('tenantId' in request.resource.data.diff(resource.data).affectedKeys())
                    && !('id' in request.resource.data.diff(resource.data).affectedKeys())
                    && !('accountType' in request.resource.data.diff(resource.data).affectedKeys());
      
      allow create: if false;  // Only Cloud Function can create
    }
    
    // Team Members collection
    match /teamMembers/{memberId} {
      // Public read for browse teams (scoped by query)
      allow read: if true;
      
      // User can create membership for themselves
      allow create: if isAuthenticated()
                    && request.auth.uid == request.resource.data.userId
                    && isValidEvent(request.resource.data.eventId)
                    && isValidTenant(request.resource.data.tenantId)
                    && request.resource.data.isActive == true
                    && request.resource.data.personalScore == 0
                    && request.resource.data.role in ['owner', 'member'];
      
      // User can delete their own membership (leave team)
      allow delete: if isOwner(resource.data.userId);
      
      // User can update their own membership (limited fields)
      allow update: if isOwner(resource.data.userId)
                    && !('userId' in request.resource.data.diff(resource.data).affectedKeys())
                    && !('teamId' in request.resource.data.diff(resource.data).affectedKeys())
                    && !('eventId' in request.resource.data.diff(resource.data).affectedKeys())
                    && !('tenantId' in request.resource.data.diff(resource.data).affectedKeys());
    }
    
    // Teams collection
    match /teams/{teamId} {
      // Public read (scoped by query)
      allow read: if true;
      
      // Team owner can update team
      allow update: if isAuthenticated()
                    && request.auth.uid == resource.data.ownerUserId
                    && !('tenantId' in request.resource.data.diff(resource.data).affectedKeys())
                    && !('eventId' in request.resource.data.diff(resource.data).affectedKeys())
                    && !('accessCode' in request.resource.data.diff(resource.data).affectedKeys());
      
      allow create: if false;  // Only admin/organizer can create teams
    }
    
    // Events collection (read-only for users)
    match /events/{eventId} {
      allow read: if resource.data.isActive == true;
      allow write: if false;  // Only admin
    }
    
    // Tenants collection (read-only for users)
    match /tenants/{tenantId} {
      allow read: if resource.data.isActive == true;
      allow write: if false;  // Only admin
    }
  }
}
```

### **Acceptance Criteria:**
- [ ] User can only read/update their own document
- [ ] User cannot change tenantId, id, or accountType
- [ ] TeamMember creation validates eventId and tenantId
- [ ] TeamMember creation requires active event
- [ ] User can only create TeamMember for themselves
- [ ] User can delete their own TeamMember (leave team)
- [ ] Team owner can update team (limited fields)
- [ ] Events and tenants are read-only for users

### **Testing:**
```typescript
// Test 1: User can read own document
await getDoc(doc(db, 'users', myUserId));  // ✅ Should work

// Test 2: User cannot read other's document
await getDoc(doc(db, 'users', otherUserId));  // ❌ Should fail

// Test 3: User can create TeamMember for themselves
await addDoc(collection(db, 'teamMembers'), {
  userId: myUserId,
  teamId: 'team-123',
  eventId: 'event-456',
  tenantId: 'tenant-789',
  isActive: true,
  personalScore: 0,
  role: 'member'
});  // ✅ Should work

// Test 4: User cannot create TeamMember for others
await addDoc(collection(db, 'teamMembers'), {
  userId: otherUserId,  // ❌ Not my UID
  teamId: 'team-123',
  eventId: 'event-456',
  tenantId: 'tenant-789'
});  // ❌ Should fail

// Test 5: User cannot change tenantId
await updateDoc(doc(db, 'users', myUserId), {
  tenantId: 'different-tenant'
});  // ❌ Should fail
```

### **Files to Modify:**
- `firestore.rules` (or `firestore.rules.prod`)

### **Deployment:**
```bash
# Test rules in emulator
firebase emulators:start --only firestore

# Deploy rules to production
firebase deploy --only firestore:rules

# Verify deployment
firebase firestore:rules get
```

### **Notes:**
- ⚠️ Test thoroughly in emulator before production deploy
- 📝 Rules are evaluated per-document (not per-query)
- ✅ Query-level validation happens in application code
- 🔒 Always validate tenant/event context in queries

---

# 📋 PHASE 2: SERVICE LAYER

---

## [TICKET-5] Update user.service.ts - Multi-Event Support

**Priority:** 🔴 Critical  
**Story Points:** 5  
**Assignee:** Full-Stack Developer  
**Dependencies:** TICKET-1, TICKET-2  
**Estimated Time:** 4 hours

### **Description:**
Update user.service.ts to support multi-event participation. Add functions for getting user's events, checking event participation, and generating recovery codes.

### **Current State:**
```typescript
// File: src/services/user.service.ts

export async function createUser(data: {
  displayName: string;
  email?: string;
  tenantId: string;
  consentGiven: {...}
}): Promise<User> {
  // Creates user with Cloud Function
  // Returns User object
}

export async function getUserById(userId: string): Promise<User | null> {
  // Fetches user by ID
}

export async function updateUserProfile(userId: string, data: {...}): Promise<void> {
  // Updates user profile
}
```

### **Expected State:**
```typescript
// File: src/services/user.service.ts

// UPDATED: Add accountType parameter
export async function createUser(data: {
  displayName: string;
  email?: string;
  tenantId: string;
  accountType?: 'anonymous' | 'linked';  // NEW
  consentGiven: {...}
}): Promise<User> {
  const accountType = data.accountType || 'anonymous';
  
  // Call Cloud Function with new field
  await createUserDocument({
    ...data,
    accountType
  });
  
  return user;
}

// NEW: Get all events user participates in
export async function getUserEvents(userId: string): Promise<Event[]> {
  const db = getFirebaseFirestore();
  
  // Step 1: Get all TeamMember records for user
  const q = query(
    collection(db, 'teamMembers'),
    where('userId', '==', userId),
    where('isActive', '==', true),
    orderBy('joinedAt', 'desc')
  );
  
  const memberSnapshot = await getDocs(q);
  
  // Step 2: Extract unique eventIds
  const eventIds = [...new Set(
    memberSnapshot.docs.map(doc => doc.data().eventId)
  )];
  
  // Step 3: Fetch event details
  const events = await Promise.all(
    eventIds.map(async (eventId) => {
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (!eventDoc.exists()) return null;
      return { id: eventDoc.id, ...eventDoc.data() } as Event;
    })
  );
  
  return events.filter(e => e !== null) as Event[];
}

// NEW: Check if user is in specific event
export async function isUserInEvent(
  userId: string, 
  eventId: string
): Promise<boolean> {
  const db = getFirebaseFirestore();
  
  const q = query(
    collection(db, 'teamMembers'),
    where('userId', '==', userId),
    where('eventId', '==', eventId),
    where('isActive', '==', true)
  );
  
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

// NEW: Get user's team in specific event
export async function getUserTeamInEvent(
  userId: string,
  eventId: string
): Promise<{ team: Team; membership: TeamMember } | null> {
  const db = getFirebaseFirestore();
  
  // Get TeamMember record
  const memberQuery = query(
    collection(db, 'teamMembers'),
    where('userId', '==', userId),
    where('eventId', '==', eventId),
    where('isActive', '==', true)
  );
  
  const memberSnapshot = await getDocs(memberQuery);
  if (memberSnapshot.empty) return null;
  
  const membership = memberSnapshot.docs[0].data() as TeamMember;
  
  // Get Team document
  const teamDoc = await getDoc(doc(db, 'teams', membership.teamId));
  if (!teamDoc.exists()) return null;
  
  const team = { id: teamDoc.id, ...teamDoc.data() } as Team;
  
  return { team, membership };
}

// NEW: Generate recovery code
export async function generateRecoveryCode(userId: string): Promise<string> {
  const db = getFirebaseFirestore();
  
  // Generate 6-digit alphanumeric code
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  // Set expiration (30 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  
  // Update user document
  await updateDoc(doc(db, 'users', userId), {
    recoveryCode: code,
    recoveryCodeExpiresAt: expiresAt,
    recoveryCodeGeneratedAt: new Date(),
    updatedAt: serverTimestamp()
  });
  
  console.log(`✅ Recovery code generated for user ${userId}: ${code}`);
  return code;
}

// NEW: Validate recovery code
export async function validateRecoveryCode(
  code: string
): Promise<User | null> {
  const db = getFirebaseFirestore();
  
  // Find user with this recovery code
  const q = query(
    collection(db, 'users'),
    where('recoveryCode', '==', code.toUpperCase()),
    where('recoveryCodeExpiresAt', '>', new Date())
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as User;
}

// NEW: Invalidate recovery code (after use)
export async function invalidateRecoveryCode(userId: string): Promise<void> {
  const db = getFirebaseFirestore();
  
  await updateDoc(doc(db, 'users', userId), {
    recoveryCode: null,
    recoveryCodeExpiresAt: null,
    updatedAt: serverTimestamp()
  });
  
  console.log(`✅ Recovery code invalidated for user ${userId}`);
}

// EXISTING FUNCTIONS (unchanged)
export async function getUserById(userId: string): Promise<User | null> { ... }
export async function updateUserProfile(...): Promise<void> { ... }
export async function updateUserStats(...): Promise<void> { ... }
export async function deleteUser(userId: string): Promise<void> { ... }
```

### **Acceptance Criteria:**
- [ ] createUser accepts accountType parameter
- [ ] getUserEvents returns all events user joined
- [ ] isUserInEvent checks participation correctly
- [ ] getUserTeamInEvent returns team + membership
- [ ] generateRecoveryCode creates 6-digit code
- [ ] validateRecoveryCode finds user by code
- [ ] invalidateRecoveryCode clears code after use
- [ ] All functions have error handling
- [ ] All functions have JSDoc comments

### **Testing:**
```typescript
// Test 1: Create user with accountType
const user = await createUser({
  displayName: 'Alice',
  tenantId: 'test-tenant',
  accountType: 'anonymous',
  consentGiven: {...}
});
expect(user.accountType).toBe('anonymous');

// Test 2: Get user's events
const events = await getUserEvents(userId);
expect(events.length).toBeGreaterThan(0);

// Test 3: Check event participation
const isInEvent = await isUserInEvent(userId, 'event-123');
expect(isInEvent).toBe(true);

// Test 4: Generate recovery code
const code = await generateRecoveryCode(userId);
expect(code).toMatch(/^[A-Z0-9]{6}$/);

// Test 5: Validate recovery code
const user = await validateRecoveryCode(code);
expect(user).not.toBeNull();
expect(user?.id).toBe(userId);
```

### **Files to Modify:**
- `src/services/user.service.ts` (add new functions)

### **Notes:**
- 📝 Recovery codes are 6 characters: uppercase alphanumeric
- ⏱️ Recovery codes expire after 30 days
- ✅ Codes are invalidated after successful recovery
- 🔒 Only one active recovery code per user

---

## [TICKET-6] Update team.service.ts - Add Helper Functions

**Priority:** 🟡 High  
**Story Points:** 3  
**Assignee:** Full-Stack Developer  
**Dependencies:** TICKET-5  
**Estimated Time:** 3 hours

### **Description:**
Add helper functions to team.service.ts for multi-event team management. Functions for joining teams, checking team capacity, and querying teams by event.

### **Current State:**
```typescript
// File: src/services/team.service.ts

export async function getTeamByCode(code: string): Promise<Team | null> {
  // Finds team by access code
}

export async function getTeamById(teamId: string): Promise<Team | null> {
  // Fetches team by ID
}
```

### **Expected State:**
```typescript
// File: src/services/team.service.ts

// EXISTING FUNCTIONS (unchanged)
export async function getTeamByCode(code: string): Promise<Team | null> { ... }
export async function getTeamById(teamId: string): Promise<Team | null> { ... }

// NEW: Get all teams for event (with real-time updates)
export function subscribeToEventTeams(
  tenantId: string,
  eventId: string,
  callback: (teams: Team[]) => void
): () => void {
  const db = getFirebaseFirestore();
  
  const q = query(
    collection(db, 'teams'),
    where('tenantId', '==', tenantId),
    where('eventId', '==', eventId),
    where('isActive', '==', true),
    orderBy('memberCount', 'asc')  // Show teams with space first
  );
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const teams = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Team[];
    
    callback(teams);
  });
  
  return unsubscribe;  // Return cleanup function
}

// NEW: Check if team has space
export async function canJoinTeam(teamId: string): Promise<{
  canJoin: boolean;
  reason?: string;
}> {
  const team = await getTeamById(teamId);
  
  if (!team) {
    return { canJoin: false, reason: 'Team not found' };
  }
  
  if (!team.isActive) {
    return { canJoin: false, reason: 'Team is inactive' };
  }
  
  const currentMembers = team.memberUserIds?.length || 0;
  const maxMembers = team.maxMembers || 50;
  
  if (currentMembers >= maxMembers) {
    return { canJoin: false, reason: 'Team is full' };
  }
  
  return { canJoin: true };
}

// NEW: Get team member count (real-time)
export async function getTeamMemberCount(
  teamId: string,
  eventId: string
): Promise<number> {
  const db = getFirebaseFirestore();
  
  const q = query(
    collection(db, 'teamMembers'),
    where('teamId', '==', teamId),
    where('eventId', '==', eventId),
    where('isActive', '==', true)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.size;
}

// NEW: Update team member count (cached field)
export async function updateTeamMemberCount(
  teamId: string,
  eventId: string
): Promise<void> {
  const db = getFirebaseFirestore();
  const count = await getTeamMemberCount(teamId, eventId);
  
  await updateDoc(doc(db, 'teams', teamId), {
    memberCount: count,
    updatedAt: serverTimestamp()
  });
  
  console.log(`✅ Team ${teamId} member count updated: ${count}`);
}

// NEW: Get team with member details
export async function getTeamWithMembers(
  teamId: string,
  eventId: string
): Promise<{ team: Team; members: TeamMember[] } | null> {
  const db = getFirebaseFirestore();
  
  // Get team
  const team = await getTeamById(teamId);
  if (!team) return null;
  
  // Get members
  const q = query(
    collection(db, 'teamMembers'),
    where('teamId', '==', teamId),
    where('eventId', '==', eventId),
    where('isActive', '==', true),
    orderBy('joinedAt', 'asc')
  );
  
  const memberSnapshot = await getDocs(q);
  const members = memberSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as TeamMember[];
  
  return { team, members };
}

// NEW: Search teams by name
export async function searchTeams(
  tenantId: string,
  eventId: string,
  searchTerm: string
): Promise<Team[]> {
  const db = getFirebaseFirestore();
  
  // Firestore doesn't support full-text search
  // We'll do prefix matching on teamName or teamDisplayName
  const q = query(
    collection(db, 'teams'),
    where('tenantId', '==', tenantId),
    where('eventId', '==', eventId),
    where('isActive', '==', true)
  );
  
  const snapshot = await getDocs(q);
  const allTeams = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Team[];
  
  // Client-side filter (case-insensitive)
  const searchLower = searchTerm.toLowerCase();
  return allTeams.filter(team => 
    team.teamName?.toLowerCase().includes(searchLower) ||
    team.teamDisplayName?.toLowerCase().includes(searchLower) ||
    team.accessCode?.toLowerCase().includes(searchLower)
  );
}
```

### **Acceptance Criteria:**
- [ ] subscribeToEventTeams provides real-time updates
- [ ] canJoinTeam validates team capacity
- [ ] getTeamMemberCount returns accurate count
- [ ] updateTeamMemberCount updates cached field
- [ ] getTeamWithMembers includes member list
- [ ] searchTeams filters by name/code
- [ ] All functions have error handling
- [ ] Unsubscribe functions work correctly

### **Testing:**
```typescript
// Test 1: Subscribe to event teams
const unsubscribe = subscribeToEventTeams(
  'tenant-123',
  'event-456',
  (teams) => {
    console.log('Teams updated:', teams.length);
  }
);
// Later: unsubscribe();

// Test 2: Check if can join team
const result = await canJoinTeam('team-123');
expect(result.canJoin).toBe(true);

// Test 3: Get member count
const count = await getTeamMemberCount('team-123', 'event-456');
expect(count).toBeGreaterThanOrEqual(0);

// Test 4: Search teams
const teams = await searchTeams('tenant-123', 'event-456', 'red');
expect(teams.some(t => t.teamName?.includes('RED'))).toBe(true);
```

### **Files to Modify:**
- `src/services/team.service.ts` (add new functions)

### **Notes:**
- 🔄 Use real-time listeners for Browse Teams screen
- 📊 Cache memberCount in Team document for performance
- 🔍 Client-side search (Firestore has no full-text search)
- 🧹 Remember to unsubscribe from listeners on unmount

---

## [TICKET-7] Create teamMember.service.ts - Participation Tracking

**Priority:** 🟡 High  
**Story Points:** 4  
**Assignee:** Full-Stack Developer  
**Dependencies:** TICKET-5, TICKET-6  
**Estimated Time:** 3 hours

### **Description:**
Create a new service file for managing TeamMember records. This handles joining teams, leaving teams, and querying user participation across events.

### **Current State:**
```
// File does not exist
```

### **Expected State:**
```typescript
// File: src/services/teamMember.service.ts

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { getFirebaseFirestore } from '@/lib/firebase';
import type { TeamMember, User } from '@/types/schema';

/**
 * Create TeamMember record (user joins team)
 */
export async function joinTeam(params: {
  userId: string;
  teamId: string;
  eventId: string;
  tenantId: string;
  role: 'owner' | 'member';
}): Promise<TeamMember> {
  const db = getFirebaseFirestore();
  const { userId, teamId, eventId, tenantId, role } = params;
  
  // Check if user already in this event
  const existing = await getUserParticipationInEvent(userId, eventId);
  if (existing) {
    throw new Error('You are already in a team for this event');
  }
  
  // Check if team has space
  const team = await getDoc(doc(db, 'teams', teamId));
  if (!team.exists()) {
    throw new Error('Team not found');
  }
  
  const teamData = team.data();
  const currentMembers = teamData.memberUserIds?.length || 0;
  const maxMembers = teamData.maxMembers || 50;
  
  if (currentMembers >= maxMembers) {
    throw new Error('Team is full');
  }
  
  // Get user display name
  const userDoc = await getDoc(doc(db, 'users', userId));
  const displayName = userDoc.exists() ? userDoc.data().displayName : 'Unknown';
  
  // Create TeamMember record
  const memberData = {
    userId,
    teamId,
    eventId,
    tenantId,
    displayName,  // Denormalized for search
    role,
    personalScore: 0,
    submissionIds: [],
    tasksCompleted: [],
    isActive: true,
    joinedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const memberRef = await addDoc(collection(db, 'teamMembers'), memberData);
  
  // Update team memberUserIds array
  await updateDoc(doc(db, 'teams', teamId), {
    memberUserIds: [...(teamData.memberUserIds || []), userId],
    memberCount: increment(1),
    updatedAt: serverTimestamp()
  });
  
  // Update user stats
  await updateDoc(doc(db, 'users', userId), {
    eventsParticipated: increment(1),
    updatedAt: serverTimestamp()
  });
  
  console.log(`✅ User ${userId} joined team ${teamId}`);
  
  return {
    id: memberRef.id,
    ...memberData
  } as TeamMember;
}

/**
 * Leave team (soft delete)
 */
export async function leaveTeam(params: {
  userId: string;
  teamId: string;
  eventId: string;
}): Promise<void> {
  const db = getFirebaseFirestore();
  const { userId, teamId, eventId } = params;
  
  // Find TeamMember record
  const q = query(
    collection(db, 'teamMembers'),
    where('userId', '==', userId),
    where('teamId', '==', teamId),
    where('eventId', '==', eventId),
    where('isActive', '==', true)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    throw new Error('Membership not found');
  }
  
  const memberDoc = snapshot.docs[0];
  
  // Soft delete (set isActive = false)
  await updateDoc(memberDoc.ref, {
    isActive: false,
    leftAt: new Date(),
    updatedAt: serverTimestamp()
  });
  
  // Update team memberUserIds array
  const team = await getDoc(doc(db, 'teams', teamId));
  const teamData = team.data();
  const updatedMemberIds = (teamData?.memberUserIds || []).filter(
    (id: string) => id !== userId
  );
  
  await updateDoc(doc(db, 'teams', teamId), {
    memberUserIds: updatedMemberIds,
    memberCount: increment(-1),
    updatedAt: serverTimestamp()
  });
  
  console.log(`✅ User ${userId} left team ${teamId}`);
}

/**
 * Get user's participation in specific event
 */
export async function getUserParticipationInEvent(
  userId: string,
  eventId: string
): Promise<TeamMember | null> {
  const db = getFirebaseFirestore();
  
  const q = query(
    collection(db, 'teamMembers'),
    where('userId', '==', userId),
    where('eventId', '==', eventId),
    where('isActive', '==', true)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  
  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data()
  } as TeamMember;
}

/**
 * Get all team members for event (with user details)
 */
export async function getEventMembers(
  eventId: string
): Promise<Array<TeamMember & { user: User }>> {
  const db = getFirebaseFirestore();
  
  const q = query(
    collection(db, 'teamMembers'),
    where('eventId', '==', eventId),
    where('isActive', '==', true),
    orderBy('joinedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  const members = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as TeamMember[];
  
  // Fetch user details for each member
  const membersWithUsers = await Promise.all(
    members.map(async (member) => {
      const userDoc = await getDoc(doc(db, 'users', member.userId));
      const user = userDoc.exists() ? userDoc.data() as User : null;
      
      return {
        ...member,
        user: user || { displayName: 'Unknown User' }
      };
    })
  );
  
  return membersWithUsers;
}

/**
 * Search members by name in event
 */
export async function searchMembersInEvent(
  eventId: string,
  searchTerm: string
): Promise<TeamMember[]> {
  const db = getFirebaseFirestore();
  
  // Prefix search on displayName
  const searchUpper = searchTerm.toUpperCase();
  
  const q = query(
    collection(db, 'teamMembers'),
    where('eventId', '==', eventId),
    where('displayName', '>=', searchUpper),
    where('displayName', '<=', searchUpper + '\uf8ff'),
    where('isActive', '==', true),
    orderBy('displayName', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as TeamMember[];
}

/**
 * Update member personal score
 */
export async function updateMemberScore(
  memberId: string,
  scoreIncrement: number
): Promise<void> {
  const db = getFirebaseFirestore();
  
  await updateDoc(doc(db, 'teamMembers', memberId), {
    personalScore: increment(scoreIncrement),
    updatedAt: serverTimestamp()
  });
  
  console.log(`✅ Member ${memberId} score updated (+${scoreIncrement})`);
}

/**
 * Get team members (for Team Detail screen)
 */
export async function getTeamMembers(
  teamId: string,
  eventId: string
): Promise<TeamMember[]> {
  const db = getFirebaseFirestore();
  
  const q = query(
    collection(db, 'teamMembers'),
    where('teamId', '==', teamId),
    where('eventId', '==', eventId),
    where('isActive', '==', true),
    orderBy('personalScore', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as TeamMember[];
}
```

### **Acceptance Criteria:**
- [ ] joinTeam creates TeamMember record
- [ ] joinTeam validates event uniqueness (1 team per event)
- [ ] joinTeam checks team capacity
- [ ] joinTeam updates team memberUserIds array
- [ ] leaveTeam soft deletes membership
- [ ] leaveTeam updates team member count
- [ ] getUserParticipationInEvent finds active membership
- [ ] searchMembersInEvent filters by displayName
- [ ] All functions have error handling
- [ ] All functions update timestamps

### **Testing:**
```typescript
// Test 1: Join team
const membership = await joinTeam({
  userId: 'user-123',
  teamId: 'team-456',
  eventId: 'event-789',
  tenantId: 'tenant-abc',
  role: 'member'
});
expect(membership.userId).toBe('user-123');

// Test 2: Check participation
const participation = await getUserParticipationInEvent('user-123', 'event-789');
expect(participation).not.toBeNull();

// Test 3: Try joining same event again
await expect(
  joinTeam({ userId: 'user-123', teamId: 'team-999', eventId: 'event-789', ... })
).rejects.toThrow('already in a team');

// Test 4: Leave team
await leaveTeam({ userId: 'user-123', teamId: 'team-456', eventId: 'event-789' });
const afterLeave = await getUserParticipationInEvent('user-123', 'event-789');
expect(afterLeave).toBeNull();

// Test 5: Search members
const members = await searchMembersInEvent('event-789', 'Ali');
expect(members.length).toBeGreaterThan(0);
```

### **Files to Create:**
- `src/services/teamMember.service.ts` (new file)

### **Notes:**
- ✅ Validates 1 team per event per user
- 🔄 Updates team memberUserIds array atomically
- 📊 Denormalizes displayName for efficient search
- 🗑️ Soft delete (sets isActive = false, keeps data)

---

## [TICKET-8] Add Validation Logic - 1 Team Per Event

**Priority:** 🟡 High  
**Story Points:** 2  
**Assignee:** Full-Stack Developer  
**Dependencies:** TICKET-7  
**Estimated Time:** 2 hours

### **Description:**
Add validation logic to prevent users from joining multiple teams in the same event. Create a reusable validation hook and display user-friendly error messages.

### **Current State:**
```
// No validation exists
// Users can join multiple teams in same event
```

### **Expected State:**
```typescript
// File: src/hooks/useEventParticipation.ts (NEW)

import { useState, useEffect } from 'react';
import { getUserParticipationInEvent } from '@/services/teamMember.service';
import { useAuth } from '@/hooks/useAuth';
import type { TeamMember } from '@/types/schema';

/**
 * Hook to check if user is already in an event
 */
export function useEventParticipation(eventId: string | null) {
  const { user } = useAuth();
  const [participation, setParticipation] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user || !eventId) {
      setIsLoading(false);
      return;
    }
    
    async function checkParticipation() {
      try {
        setIsLoading(true);
        const result = await getUserParticipationInEvent(user.uid, eventId);
        setParticipation(result);
        setError(null);
      } catch (err) {
        console.error('Error checking participation:', err);
        setError('Failed to check event participation');
      } finally {
        setIsLoading(false);
      }
    }
    
    checkParticipation();
  }, [user, eventId]);
  
  return {
    participation,
    isInEvent: participation !== null,
    isLoading,
    error
  };
}

// File: src/components/ParticipationBanner.tsx (NEW)

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { TeamMember } from '@/types/schema';

interface ParticipationBannerProps {
  participation: TeamMember;
  currentEventId: string;
}

export function ParticipationBanner({ 
  participation, 
  currentEventId 
}: ParticipationBannerProps) {
  const navigate = useNavigate();
  
  if (participation.eventId === currentEventId) {
    // User is viewing their current event
    return (
      <Alert className="mb-4 bg-green-50 border-green-200">
        <AlertDescription className="flex items-center justify-between">
          <span>
            ✅ You're in this event (Team: {participation.teamId})
          </span>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/team/${participation.teamId}`)}
          >
            View My Team
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  
  // User is viewing a different event
  return (
    <Alert className="mb-4 bg-yellow-50 border-yellow-200">
      <AlertDescription className="flex items-center justify-between">
        <div>
          <p className="font-medium">⚠️ You're already in another event</p>
          <p className="text-sm text-gray-600">
            You can only be in one team per event. You're currently in: {participation.eventId}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate(`/events/${participation.eventId}`)}
        >
          Go to My Event
        </Button>
      </AlertDescription>
    </Alert>
  );
}

// File: src/services/teamMember.service.ts (UPDATE)

// Add this validation to joinTeam function:
export async function joinTeam(params: { ... }): Promise<TeamMember> {
  // ... existing code ...
  
  // NEW: Check if user already in this event
  const existing = await getUserParticipationInEvent(userId, eventId);
  if (existing) {
    throw new Error(
      `You are already in a team for this event (Team: ${existing.teamId}). ` +
      `You can only join one team per event.`
    );
  }
  
  // ... rest of function ...
}
```

### **Acceptance Criteria:**
- [ ] useEventParticipation hook checks user participation
- [ ] ParticipationBanner shows status to user
- [ ] joinTeam throws error if user already in event
- [ ] Error message is user-friendly
- [ ] Banner shows "View My Team" button
- [ ] Banner shows "Go to My Event" button (if different event)
- [ ] Hook handles loading and error states

### **Testing:**
```typescript
// Test 1: User not in event
const { isInEvent, isLoading } = useEventParticipation('event-123');
expect(isLoading).toBe(false);
expect(isInEvent).toBe(false);

// Test 2: User in event
await joinTeam({ userId: 'user-123', eventId: 'event-123', ... });
const { isInEvent, participation } = useEventParticipation('event-123');
expect(isInEvent).toBe(true);
expect(participation?.eventId).toBe('event-123');

// Test 3: Try joining same event again
await expect(
  joinTeam({ userId: 'user-123', eventId: 'event-123', teamId: 'team-999', ... })
).rejects.toThrow('already in a team');

// Test 4: User can join different event
await joinTeam({ userId: 'user-123', eventId: 'event-456', ... });
// ✅ Should succeed
```

### **Files to Create/Modify:**
- `src/hooks/useEventParticipation.ts` (NEW)
- `src/components/ParticipationBanner.tsx` (NEW)
- `src/services/teamMember.service.ts` (UPDATE joinTeam)

### **Notes:**
- ⚠️ Show banner at top of Browse Teams screen
- ✅ User-friendly error messages
- 🔄 Real-time participation checking
- 📝 Explain 1-team-per-event rule clearly

---

# 📋 PHASE 3: CORE UI

(Would you like me to continue with the remaining tickets? This is getting quite long - I have Tickets 9-20 ready to add, which cover:
- Phase 3: Core UI (EventSwitcher, BrowseTeams, LoginPage, Routing, EventHeader)
- Phase 4: Enhancement (AccountSettings, Recovery Codes, Email Linking, Friend Search)
- Phase 5: Testing & Deployment (E2E tests, Security audit, Production deployment)

Shall I continue with the full document?)
