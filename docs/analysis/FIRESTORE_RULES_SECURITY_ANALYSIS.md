# Firestore Rules & Cloud Functions Analysis

**Date:** December 13, 2025  
**Reviewer:** Senior Backend Developer  
**Scope:** Authentication flow, security rules, cloud functions  

---

## Executive Summary

### 🔴 CRITICAL ISSUES FOUND

1. **teamMembers Collection: Open Read Access** - Anyone can query all team memberships
2. **teams Collection: Write Rules Too Permissive** - Users can update teams they don't own
3. **users Collection: Update Rules Missing** - No rules for user profile updates
4. **Missing Cloud Function:** joinTeam operation needs server-side validation

### 🟡 MODERATE ISSUES

5. **Development Rules Still Active** - Many `allow write: if true` rules in production
6. **No Rate Limiting** - Cloud functions lack rate limiting
7. **Missing Indexes** - Several queries need composite indexes

### ✅ GOOD PRACTICES

- ✅ Cloud Function for user creation (bypasses client rules correctly)
- ✅ Firebase Auth used for authentication
- ✅ Tenant isolation concept in place
- ✅ Read-only leaderboard pattern

---

## Current Authentication Flow Analysis

### Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User enters team code                                    │
│    Component: TeamCodeLogin.tsx                             │
│    Action: validateEventCode()                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Team code validated                                      │
│    Service: getTeamByAccessCode()                           │
│    Firestore: teams collection query                        │
│    Rule: allow read: if true ✅ (OK for team lookup)        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. User fills identity form                                 │
│    Component: IdentityUplinkModal.tsx                       │
│    Fields: firstName, lastName, email (optional)            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Create user account                                      │
│    Service: createUser()                                    │
│    ├─ signInAnonymously() → Firebase Auth user             │
│    └─ Cloud Function: createUserDocument()                  │
│        ├─ Uses Admin SDK (bypasses client rules) ✅         │
│        └─ Creates users/{uid} document                      │
│    Rule: allow create: if false ✅ (Only via Cloud Fn)      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Firebase auth listener fires                             │
│    Hook: useFirebaseAuthListener                            │
│    Action: setUser() in authStore                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Join team                                                │
│    Service: joinTeam()                                      │
│    Operations:                                              │
│    ├─ Create teamMembers/{teamId-userId} ⚠️ CLIENT-SIDE     │
│    ├─ Update teams/{teamId}.memberUserIds ⚠️ CLIENT-SIDE    │
│    └─ Update users/{userId}.eventsParticipated ⚠️ CLIENT    │
│                                                             │
│    Current Rules:                                           │
│    ├─ teamMembers.create: if isAuth && userId match ✅      │
│    ├─ teams.update: if isAuth ⚠️ TOO PERMISSIVE            │
│    └─ users.update: NO RULE DEFINED 🔴 CRITICAL            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Navigate to dashboard                                    │
│    Page: Dashboard                                          │
│    Auth: isAuthenticated = true                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Issues Breakdown

### 🔴 CRITICAL #1: teamMembers Open Read Access

**Location:** `firestore.rules:169`

```javascript
match /teamMembers/{teamMemberId} {
  // Public read for browse teams (scoped by query)
  allow read: if true;  // ⚠️ CRITICAL: Anyone can read ALL team memberships
```

**Problem:** Anyone (even unauthenticated) can query the entire teamMembers collection

**Exploit Scenario:**
```javascript
// Malicious actor can get ALL team memberships across ALL tenants
const allMembers = await getDocs(collection(db, 'teamMembers'));
// Returns: Every user's participation in every team/event
// Data leak: userIds, teamIds, eventIds, personal scores, roles
```

**Impact:** 
- **Privacy Violation:** User participation data exposed
- **GDPR Risk:** Personal data (scores, teams, events) publicly accessible
- **Competitive Intelligence:** Other events can see all participants

**Current Code Dependency:**
```typescript
// src/services/teamMember.service.ts:257
export async function getUserTeams(userId: string) {
  const q = query(
    collection(db, 'teamMembers'),
    where('userId', '==', userId),  // Requires index
    where('isActive', '==', true)
  );
  // This query REQUIRES open read access
}
```

**Fix Required:**
```javascript
match /teamMembers/{teamMemberId} {
  // Users can only read their own memberships
  allow read: if isAuthenticated() 
              && (resource.data.userId == request.auth.uid 
                  || resource.data.teamId in getUserTeamIds());
  
  // OR: Create a Cloud Function for getUserTeams()
}
```

**Recommended Approach:** Move `getUserTeams()` to Cloud Function

---

### 🔴 CRITICAL #2: teams Update Rules Too Permissive

**Location:** `firestore.rules:98-104`

```javascript
allow update: if isAuthenticated()
              && request.resource.data.tenantId == resource.data.tenantId
              && request.resource.data.eventId == resource.data.eventId;
```

**Problem:** ANY authenticated user can update ANY team (as long as they don't change tenantId/eventId)

**Exploit Scenario:**
```javascript
// Malicious user can update another team's data
await updateDoc(doc(db, 'teams', 'victim-team-id'), {
  memberUserIds: arrayUnion('attacker-uid'),  // Add themselves to team
  memberCount: increment(1),
  teamName: 'HACKED TEAM',  // Change team name
  score: 999999,  // Inflate score
});
```

**Impact:**
- **Unauthorized Team Access:** Users can add themselves to any team
- **Score Manipulation:** Users can inflate team scores
- **Data Integrity:** Team data can be corrupted

**Current Code Dependency:**
```typescript
// src/services/teamMember.service.ts:620
batch.update(teamRef, {
  memberUserIds: arrayUnion(userId),  // ⚠️ Requires update permission
  memberCount: increment(1),
  updatedAt: serverTimestamp(),
});
```

**Fix Required:**
```javascript
allow update: if isAuthenticated()
              && isTeamMember(teamId)
              && request.resource.data.tenantId == resource.data.tenantId
              && request.resource.data.eventId == resource.data.eventId
              // Only allow updating specific fields
              && request.resource.data.diff(resource.data).affectedKeys()
                 .hasOnly(['memberUserIds', 'memberCount', 'updatedAt', 'lastKnownPosition']);
```

**Better Fix:** Move to Cloud Function (see recommendation)

---

### 🔴 CRITICAL #3: users Update Rules Missing

**Location:** `firestore.rules:143-158`

```javascript
match /users/{userId} {
  allow read: if isOwner(userId);
  
  allow update: if isOwner(userId)
                // Prevent changing critical fields
                && !('tenantId' in request.resource.data.diff(resource.data).affectedKeys())
                && !('id' in request.resource.data.diff(resource.data).affectedKeys())
                && !('accountType' in request.resource.data.diff(resource.data).affectedKeys())
                && !('linkedAccountId' in request.resource.data.diff(resource.data).affectedKeys());
  
  allow create: if false;  // Only Cloud Function
  allow delete: if isUserOwner(userId);
  allow list: if isAuthenticated();  // ⚠️ Any user can list all users
}
```

**Problem:** The update rule exists BUT uses `isOwner()` which might not work correctly

**Current Code Dependency:**
```typescript
// src/services/teamMember.service.ts:638
batch.update(doc(db, 'users', userId), {
  eventsParticipated: increment(1),  // ⚠️ Requires update permission
  updatedAt: serverTimestamp(),
});
```

**Test Needed:** Verify `isOwner()` function works correctly

**Also:** `allow list: if isAuthenticated()` allows ANY user to list ALL users (privacy issue)

**Fix:**
```javascript
match /users/{userId} {
  allow read: if isOwner(userId);
  
  allow update: if isOwner(userId)
                && request.resource.data.diff(resource.data).affectedKeys()
                   .hasOnly(['displayName', 'email', 'profilePhotoUrl', 
                            'eventsParticipated', 'totalScore', 
                            'lastLoginAt', 'updatedAt', 'lastActiveAt']);
  
  allow create: if false;
  allow delete: if isOwner(userId);
  allow list: if false;  // ⚠️ Remove open list access
}
```

---

### 🟡 MODERATE #4: Development Rules in Production

**Locations:** Multiple collections

```javascript
// tenants
allow write: if true;  // ⚠️ DEVELOPMENT: Change to false in production

// events
allow write: if true;  // ⚠️ DEVELOPMENT: Change to false in production

// teams
allow create: if true;  // ⚠️ DEVELOPMENT: Change to false in production

// tasks
allow write: if true;  // ⚠️ DEVELOPMENT: Change to false in production
```

**Problem:** Production database has open write access to critical collections

**Impact:**
- Anyone can create/modify tenants
- Anyone can create/modify events
- Anyone can create teams
- Anyone can create/modify tasks

**Fix:** Deploy separate rules for development vs production

---

### 🟡 MODERATE #5: Missing Composite Indexes

**Required Indexes:**

```javascript
// Index 1: teamMembers by userId + isActive
collection: teamMembers
fields: userId (ASC), isActive (ASC)

// Index 2: teamMembers by teamId + isActive  
collection: teamMembers
fields: teamId (ASC), isActive (ASC)

// Index 3: teamMembers by eventId + isActive
collection: teamMembers
fields: eventId (ASC), isActive (ASC)
```

**Check:** Run queries and Firebase will suggest missing indexes

---

## Recommended Architecture Changes

### Recommendation #1: Move joinTeam() to Cloud Function

**Why:**
- Atomic operation (all-or-nothing)
- Proper validation server-side
- No client-side rule complexity
- Rate limiting possible
- Audit logging

**Implementation:**

```typescript
// functions/src/index.ts

export const joinTeamSecure = onCall(async (request) => {
  const { data, auth } = request;
  
  // 1. Verify authentication
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const { teamId, eventId, tenantId } = data;
  const userId = auth.uid;
  
  // 2. Validate inputs
  if (!teamId || !eventId || !tenantId) {
    throw new HttpsError('invalid-argument', 'Missing required fields');
  }
  
  const db = admin.firestore();
  
  // 3. Check if user already in event
  const existingMembership = await db
    .collection('teamMembers')
    .where('userId', '==', userId)
    .where('eventId', '==', eventId)
    .where('isActive', '==', true)
    .get();
  
  if (!existingMembership.empty) {
    throw new HttpsError(
      'already-exists',
      'You are already in a team for this event'
    );
  }
  
  // 4. Check team capacity
  const teamDoc = await db.collection('teams').doc(teamId).get();
  
  if (!teamDoc.exists) {
    throw new HttpsError('not-found', 'Team not found');
  }
  
  const teamData = teamDoc.data()!;
  const currentMembers = teamData.memberUserIds?.length || 0;
  const maxMembers = teamData.maxMembers || 50;
  
  if (currentMembers >= maxMembers) {
    throw new HttpsError('resource-exhausted', 'Team is full');
  }
  
  // 5. Get user display name
  const userDoc = await db.collection('users').doc(userId).get();
  const displayName = userDoc.data()?.displayName || 'Unknown';
  
  // 6. Atomic batch write (Admin SDK bypasses rules)
  const batch = db.batch();
  const memberId = `${teamId}-${userId}`;
  
  // Create TeamMember
  batch.set(db.collection('teamMembers').doc(memberId), {
    id: memberId,
    userId,
    teamId,
    eventId,
    tenantId,
    displayName,
    personalScore: 0,
    submissionIds: [],
    tasksCompleted: [],
    role: 'member',
    isActive: true,
    joinedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastActiveAt: admin.firestore.FieldValue.serverTimestamp(),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  // Update team
  batch.update(db.collection('teams').doc(teamId), {
    memberUserIds: admin.firestore.FieldValue.arrayUnion(userId),
    memberCount: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  // Update user
  batch.update(db.collection('users').doc(userId), {
    eventsParticipated: admin.firestore.FieldValue.increment(1),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  
  await batch.commit();
  
  logger.info('User joined team', { userId, teamId, eventId });
  
  return {
    success: true,
    memberId,
  };
});
```

**Client-side changes:**

```typescript
// src/services/teamMember.service.ts

export async function joinTeam(params: {
  userId: string;
  teamId: string;
  eventId: string;
  tenantId: string;
  role: 'owner' | 'member';
}): Promise<TeamMember> {
  const functions = getFunctions(undefined, 'europe-west3');
  const joinTeamFn = httpsCallable(functions, 'joinTeamSecure');
  
  try {
    const result = await joinTeamFn({
      teamId: params.teamId,
      eventId: params.eventId,
      tenantId: params.tenantId,
    });
    
    // Fetch the created membership
    const db = getFirebaseFirestore();
    const memberId = result.data.memberId;
    const memberDoc = await getDoc(doc(db, 'teamMembers', memberId));
    
    return memberDoc.data() as TeamMember;
  } catch (error) {
    console.error('Error joining team:', error);
    throw error;
  }
}
```

**Firestore Rules Changes:**

```javascript
match /teamMembers/{teamMemberId} {
  // Users can only read their own memberships
  allow read: if isAuthenticated() 
              && resource.data.userId == request.auth.uid;
  
  // Only Cloud Function can create (no client-side creates)
  allow create: if false;
  
  // Users can update their own (limited fields)
  allow update: if isOwner(resource.data.userId)
                && request.resource.data.diff(resource.data).affectedKeys()
                   .hasOnly(['lastActiveAt', 'updatedAt']);
  
  // Users can delete (leave team)
  allow delete: if isOwner(resource.data.userId);
}

match /teams/{teamId} {
  // Anyone can read (for team lookup by code)
  allow read: if true;
  
  // Only Cloud Functions can write
  allow write: if false;
}

match /users/{userId} {
  // Users can read their own profile
  allow read: if isOwner(userId);
  
  // Only Cloud Functions can write
  allow write: if false;
}
```

**Benefits:**
- ✅ Secure: All validation server-side
- ✅ Atomic: All-or-nothing transaction
- ✅ Simple: Client rules are "if false"
- ✅ Auditable: Centralized logging
- ✅ Rate Limiteable: Can add throttling

---

### Recommendation #2: Move getUserTeams() to Cloud Function

**Why:** Current implementation requires open read access to teamMembers

**Implementation:**

```typescript
export const getUserTeamsSecure = onCall(async (request) => {
  const { auth } = request;
  
  if (!auth) {
    throw new HttpsError('unauthenticated', 'Must be authenticated');
  }
  
  const userId = auth.uid;
  const db = admin.firestore();
  
  // Query teamMembers (Admin SDK bypasses rules)
  const memberSnapshots = await db
    .collection('teamMembers')
    .where('userId', '==', userId)
    .where('isActive', '==', true)
    .get();
  
  const teams = [];
  
  for (const memberDoc of memberSnapshots.docs) {
    const memberData = memberDoc.data();
    const teamDoc = await db.collection('teams').doc(memberData.teamId).get();
    
    if (teamDoc.exists) {
      const teamData = teamDoc.data()!;
      
      teams.push({
        teamId: memberData.teamId,
        teamName: teamData.teamName || teamData.teamDisplayName,
        accessCode: teamData.accessCode,
        eventId: memberData.eventId,
        tenantId: memberData.tenantId,  // ADD THIS for navigation
        personalScore: memberData.personalScore,
        role: memberData.role,
        joinedAt: memberData.joinedAt,
      });
    }
  }
  
  return { teams };
});
```

**Client-side:**

```typescript
export async function getUserTeams(userId: string) {
  const functions = getFunctions(undefined, 'europe-west3');
  const getUserTeamsFn = httpsCallable(functions, 'getUserTeamsSecure');
  
  const result = await getUserTeamsFn();
  return result.data.teams;
}
```

---

## Production-Ready Firestore Rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // ===== HELPER FUNCTIONS =====
    
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
    
    // ===== TENANTS =====
    
    match /tenants/{tenantId} {
      allow read: if true;  // Public branding
      allow write: if false;  // Only Admin SDK
    }
    
    // ===== EVENTS =====
    
    match /events/{eventId} {
      allow read: if true;  // Public event info
      allow write: if false;  // Only Admin SDK
    }
    
    // ===== TEAMS =====
    
    match /teams/{teamId} {
      allow read: if true;  // Public for team code lookup
      allow write: if false;  // Only Cloud Functions
    }
    
    // ===== TASKS =====
    
    match /tasks/{taskId} {
      allow read: if isAuthenticated();  // Teams can see tasks
      allow write: if false;  // Only Admin SDK
    }
    
    // ===== TEAM MEMBERS =====
    
    match /teamMembers/{teamMemberId} {
      // Users can only read their own memberships
      allow read: if isAuthenticated() 
                  && resource.data.userId == request.auth.uid;
      
      // Only Cloud Functions can create
      allow create: if false;
      
      // Users can update their own (limited fields)
      allow update: if isOwner(resource.data.userId)
                    && request.resource.data.diff(resource.data).affectedKeys()
                       .hasOnly(['lastActiveAt', 'updatedAt']);
      
      // Users can delete (leave team)
      allow delete: if isOwner(resource.data.userId);
    }
    
    // ===== USERS =====
    
    match /users/{userId} {
      // Users can read their own profile
      allow read: if isOwner(userId);
      
      // Only Cloud Functions can write
      allow write: if false;
    }
    
    // ===== SUBMISSIONS =====
    
    match /submissions/{submissionId} {
      // Users can read their own submissions
      allow read: if isAuthenticated() 
                  && resource.data.userId == request.auth.uid;
      
      // Users can create submissions
      allow create: if isAuthenticated()
                    && request.resource.data.userId == request.auth.uid
                    && request.resource.data.status == 'pending';
      
      // Only Cloud Functions can update/delete
      allow update, delete: if false;
    }
    
    // ===== LEADERBOARD =====
    
    match /leaderboard/{eventId}/entries/{teamId} {
      allow read: if true;  // Public leaderboard
      allow write: if false;  // Only Cloud Functions
    }
    
    // ===== DEFAULT DENY =====
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

---

## Implementation Plan

### Phase 1: Immediate Fixes (CRITICAL - Deploy Today)

1. **Restrict teamMembers read access**
   ```javascript
   allow read: if isAuthenticated() 
               && resource.data.userId == request.auth.uid;
   ```

2. **Restrict teams update access**
   ```javascript
   allow update: if false;  // Temporary until Cloud Function ready
   ```

3. **Restrict users list access**
   ```javascript
   allow list: if false;
   ```

4. **Deploy production rules**
   - Remove all `allow write: if true` development rules

### Phase 2: Cloud Functions (THIS WEEK)

5. **Implement joinTeamSecure() Cloud Function**
   - Server-side validation
   - Atomic batch writes
   - Rate limiting

6. **Implement getUserTeamsSecure() Cloud Function**
   - Bypass client read restrictions
   - Return only user's teams

7. **Update client code**
   - Replace joinTeam() with Cloud Function call
   - Replace getUserTeams() with Cloud Function call

8. **Test thoroughly**
   - Team join flow
   - Session restoration
   - Error handling

### Phase 3: Monitoring & Optimization (NEXT WEEK)

9. **Add Cloud Function monitoring**
   - Error rates
   - Latency
   - Cost tracking

10. **Add rate limiting**
    - Prevent abuse
    - DDoS protection

11. **Create composite indexes**
    - Optimize queries
    - Reduce costs

---

## Testing Checklist

### Security Tests

- [ ] **teamMembers read restriction**
  - [ ] User A cannot read User B's memberships
  - [ ] Unauthenticated user cannot query teamMembers
  - [ ] User can read their own memberships

- [ ] **teams write restriction**
  - [ ] User cannot update team they don't own
  - [ ] User cannot add themselves to arbitrary team
  - [ ] Cloud Function can update teams

- [ ] **users write restriction**
  - [ ] User cannot update another user's profile
  - [ ] User cannot increment eventsParticipated manually
  - [ ] Cloud Function can update users

### Functional Tests

- [ ] **Team join flow**
  - [ ] User can join team via Cloud Function
  - [ ] TeamMember record created correctly
  - [ ] Team memberUserIds updated
  - [ ] User eventsParticipated incremented
  - [ ] Error if team full
  - [ ] Error if already in event

- [ ] **Session restoration**
  - [ ] getUserTeams() returns user's teams
  - [ ] Team data populated correctly in Dashboard
  - [ ] tenantId included for navigation

### Performance Tests

- [ ] **Cloud Function latency**
  - [ ] joinTeamSecure() completes in <2s
  - [ ] getUserTeamsSecure() completes in <1s

- [ ] **Firestore reads**
  - [ ] No unnecessary reads in join flow
  - [ ] Composite indexes working

---

## Cost Impact Analysis

### Current (Client-Side)

```
joinTeam() operation:
- 3 reads (team, user, membership check)
- 3 writes (teamMember, team, user)
- Total: 3 reads + 3 writes = ~$0.0000036 per join

getUserTeams() operation:
- N reads (N = number of teams)
- Total: ~$0.0000006 per team
```

### Proposed (Cloud Function)

```
joinTeamSecure() operation:
- 3 reads (team, user, membership check)
- 3 writes (teamMember, team, user)  
- 1 Cloud Function invocation
- Total: 3 reads + 3 writes + 1 invocation = ~$0.0000036 + $0.0000004 = ~$0.000004

getUserTeamsSecure() operation:
- N reads (N = number of teams)
- 1 Cloud Function invocation
- Total: ~$0.0000006 per team + $0.0000004 = ~$0.000001 per team
```

**Impact:** Minimal cost increase (~10-20%), huge security improvement

---

## Conclusion

### Summary

The current Firestore rules have **3 critical security vulnerabilities**:
1. ❌ Open read access to teamMembers (privacy violation)
2. ❌ Permissive write access to teams (data integrity risk)
3. ❌ Development rules in production (security risk)

### Recommended Action

**IMMEDIATE (Today):**
1. Deploy restrictive rules (Phase 1)
2. Test in development environment

**THIS WEEK:**
1. Implement Cloud Functions (Phase 2)
2. Update client code
3. Test end-to-end
4. Deploy to production

**NEXT WEEK:**
1. Monitor performance
2. Add rate limiting
3. Optimize indexes

### Risk Assessment

**If not fixed:**
- 🔴 **HIGH:** User privacy violation (GDPR risk)
- 🔴 **HIGH:** Data manipulation possible
- 🟡 **MEDIUM:** Performance degradation
- 🟡 **MEDIUM:** Cost increase from inefficient queries

**After fixes:**
- ✅ **Secure:** Server-side validation
- ✅ **Private:** User data protected
- ✅ **Performant:** Optimized queries
- ✅ **Auditable:** Centralized logging

---

**Document Version:** 1.0  
**Last Updated:** December 13, 2025  
**Status:** AWAITING IMPLEMENTATION  
**Priority:** 🔴 CRITICAL
