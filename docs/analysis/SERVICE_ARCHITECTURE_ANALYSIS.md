# Service Architecture Analysis: Client-Side vs Cloud Functions

**Analysis Date:** December 26, 2025  
**Context:** Phase 1 Cloud Functions implementation complete (createUserDocument, getUser, joinTeamSecure)  
**Objective:** Analyze all direct Firestore operations in services and recommend optimal architecture

---

## 📊 Executive Summary

### Current State
- **8 service files** with direct Firestore operations
- **120+ direct database calls** across services
- **3 Cloud Functions** deployed (Phase 1: User & Team Join)
- **Hybrid security rules** (restrictive where protected by Cloud Functions, permissive elsewhere)

### Key Findings
1. **✅ SUCCESS:** User creation + team join now 100% secure via Cloud Functions
2. **⚠️ RISK:** Submissions, profile updates, team stats still vulnerable to client manipulation
3. **⚠️ INCONSISTENCY:** Security rules are hybrid - some operations protected, others not
4. **💰 COST:** Current architecture uses more reads due to client-side validation

### Recommendation
**Phased Cloud Function Migration** - Move critical write operations to Cloud Functions over 3 phases while keeping read operations client-side for performance.

---

## 🔍 Detailed Analysis by Service

### 1. user.service.ts ✅ MOSTLY MIGRATED

**Current Cloud Functions:**
- ✅ `createUser()` → `createUserDocument` Cloud Function
- ✅ Fetch user → `getUser` Cloud Function (with retry logic)

**Remaining Client-Side Operations:**

| Function | Operation | Risk Level | Recommendation |
|----------|-----------|------------|----------------|
| `getUserById()` | READ `/users/{id}` | 🟢 LOW | Keep client-side (read-only) |
| `getUserByEmail()` | QUERY `/users` where email | 🟢 LOW | Keep client-side (read-only) |
| `updateUserProfile()` | UPDATE `/users/{id}` | 🟡 MEDIUM | **MIGRATE** - Profile data manipulation |
| `updateUserStats()` | UPDATE `/users/{id}` stats | 🔴 HIGH | **MIGRATE** - Score manipulation risk |
| `deleteUser()` | DELETE `/users/{id}` + cascade | 🔴 HIGH | **MIGRATE** - GDPR critical |
| `updateLastLogin()` | UPDATE `/users/{id}` timestamp | 🟢 LOW | Keep client-side (non-critical) |
| `getUserEvents()` | QUERY `/teamMembers` | 🟢 LOW | Keep client-side (read-only) |
| `getUserTeamInEvent()` | QUERY + READ | 🟢 LOW | Keep client-side (read-only) |
| `generateRecoveryCode()` | UPDATE `/users/{id}` | 🟡 MEDIUM | **MIGRATE** - Security feature |
| `validateRecoveryCode()` | QUERY `/users` | 🟡 MEDIUM | **MIGRATE** - Auth critical |

**Verdict:**
- ✅ **Phase 1 Complete:** User creation secure
- 🚧 **Phase 2 Needed:** Profile updates, stats, recovery codes
- 🚧 **Phase 3 Needed:** GDPR deletion

---

### 2. teamMember.service.ts ✅ PARTIALLY MIGRATED

**Current Cloud Functions:**
- ✅ `joinTeam()` → `joinTeamSecure` Cloud Function (atomic transaction)

**Remaining Client-Side Operations:**

| Function | Operation | Risk Level | Recommendation |
|----------|-----------|------------|----------------|
| `addUserToTeam()` | BATCH: teamMember SET, team UPDATE, user UPDATE | 🔴 HIGH | ✅ **MIGRATED** (joinTeamSecure) |
| `removeUserFromTeam()` | BATCH: teamMember UPDATE, team UPDATE | 🔴 HIGH | **MIGRATE** - Leave team securely |
| `leaveTeam()` | BATCH: teamMember UPDATE, team UPDATE | 🔴 HIGH | **MIGRATE** (same as removeUser) |
| `getTeamMembers()` | QUERY `/teamMembers` + fetch users | 🟢 LOW | Keep client-side (read-only) |
| `getTeamMembership()` | READ `/teamMembers/{id}` | 🟢 LOW | Keep client-side (read-only) |
| `getUserTeamsInEvent()` | QUERY `/teamMembers` | 🟢 LOW | Keep client-side (read-only) |
| `updateMemberStats()` | UPDATE `/teamMembers/{id}` score/tasks | 🔴 HIGH | **MIGRATE** - Score manipulation |
| `updateLastActive()` | UPDATE `/teamMembers/{id}` timestamp | 🟢 LOW | Keep client-side (tracking only) |

**Race Conditions Prevented by joinTeamSecure:**
- ✅ No duplicate team joins (transaction checks)
- ✅ No capacity overflow (atomic validation)
- ✅ Consistent state across 3 collections (transaction)

**Verdict:**
- ✅ **Phase 1 Complete:** Team join secure
- 🚧 **Phase 2 Needed:** Leave team, member stats updates

---

### 3. submission.service.ts 🔴 HIGH RISK - NOT MIGRATED

**All Client-Side Operations:**

| Function | Operation | Risk Level | Recommendation |
|----------|-----------|------------|----------------|
| `createSubmission()` | BATCH: submission SET, team UPDATE, teamMember UPDATE | 🔴 **CRITICAL** | **MIGRATE URGENTLY** |
| `getSubmissionById()` | READ `/submissions/{id}` | 🟢 LOW | Keep client-side |
| `getTeamSubmissions()` | QUERY `/submissions` | 🟢 LOW | Keep client-side |
| `getUserSubmissions()` | QUERY `/submissions` | 🟢 LOW | Keep client-side |
| `getTaskSubmissions()` | QUERY `/submissions` | 🟢 LOW | Keep client-side |
| `updateSubmissionStatus()` | UPDATE `/submissions/{id}` | 🔴 HIGH | **MIGRATE** - Admin only |

**Critical Security Issues:**

```typescript
// CURRENT CODE (EXPLOITABLE):
export async function createSubmission(..., data: { points: number }) {
  // ❌ Client can set ANY points value
  batch.set(submissionRef, {
    points: data.points,  // 🚨 User-controlled!
    status: 'submitted'
  });
  
  // ❌ Client directly increments team score
  batch.update(teamRef, {
    score: increment(data.points),  // 🚨 User can add 999999 points!
    completedTaskIds: arrayUnion(taskId)
  });
  
  // ❌ Client updates member stats
  batch.update(memberRef, {
    score: increment(data.points),  // 🚨 Manipulation possible
    tasksCompleted: increment(1)
  });
}
```

**Impact:**
- 🚨 **User can submit with arbitrary points** (999,999 points instead of 10)
- 🚨 **No server-side validation** of task requirements
- 🚨 **Race conditions possible** - multiple submissions for same task
- 🚨 **Cannot enforce photo/video requirements**

**Verdict:**
- 🔴 **CRITICAL:** Must migrate in Phase 2
- 🔴 **SECURITY BREACH:** Current implementation allows cheating

---

### 4. team.service.ts 🟡 MEDIUM RISK

**Client-Side Operations:**

| Function | Operation | Risk Level | Recommendation |
|----------|-----------|------------|----------------|
| `getTeamByAccessCode()` | QUERY `/teams` | 🟢 LOW | Keep client-side |
| `linkTeamToUser()` | Anonymous auth | 🟢 LOW | Keep (auth operation) |
| `getTeamById()` | READ `/teams/{id}` | 🟢 LOW | Keep client-side |
| `updateTeamLocation()` | UPDATE `/teams/{id}` location | 🟡 MEDIUM | **Consider migrating** |
| `addTaskToTeam()` | UPDATE `/teams/{id}` array | 🟡 MEDIUM | **Migrate with submissions** |
| `getTeamWithMembers()` | READ + QUERY (aggregate) | 🟢 LOW | Keep client-side |
| `incrementTeamScore()` | UPDATE `/teams/{id}` increment | 🔴 HIGH | **MIGRATE** - Called from submissions |
| `getTeamsByEvent()` | QUERY `/teams` | 🟢 LOW | Keep client-side |
| `subscribeToEventTeams()` | Real-time listener | 🟢 LOW | Keep client-side (read-only) |

**Notes:**
- `incrementTeamScore()` is currently called from `createSubmission()` - both should migrate together
- Location updates could be manipulated but low impact (GPS spoofing exists anyway)
- Real-time subscriptions should stay client-side for UX

**Verdict:**
- 🟡 **Phase 2:** Migrate team score updates with submissions
- 🟢 **Keep:** Read operations, real-time listeners

---

### 5. task.service.ts 🟢 LOW RISK - READ ONLY

**All Client-Side Operations:**

| Function | Operation | Risk Level | Recommendation |
|----------|-----------|------------|----------------|
| `getTasksByEvent()` | QUERY `/tasks` | 🟢 LOW | Keep client-side |
| `getTaskById()` | READ `/tasks/{id}` | 🟢 LOW | Keep client-side |

**Verdict:**
- ✅ **No migration needed** - Read-only service
- ✅ **Security:** Tasks are pre-configured by admins, not user-editable

---

### 6. event.service.ts 🟢 LOW RISK - READ ONLY

**All Client-Side Operations:**

| Function | Operation | Risk Level | Recommendation |
|----------|-----------|------------|----------------|
| `getEventById()` | READ `/events/{id}` | 🟢 LOW | Keep client-side |
| `getEventBySlug()` | QUERY `/events` | 🟢 LOW | Keep client-side |
| `getEventByCode()` | QUERY `/events` | 🟢 LOW | Keep client-side |
| `getActiveEvents()` | QUERY `/events` | 🟢 LOW | Keep client-side |

**Verdict:**
- ✅ **No migration needed** - Read-only service
- ✅ **Security:** Events are admin-managed via Firebase Console

---

### 7. tenant.service.ts 🟢 LOW RISK - READ ONLY

**All Client-Side Operations:**

| Function | Operation | Risk Level | Recommendation |
|----------|-----------|------------|----------------|
| `getTenantBySlug()` | READ `/tenants/{slug}` | 🟢 LOW | Keep client-side |
| `getTenantById()` | READ `/tenants/{id}` | 🟢 LOW | Keep client-side |

**Verdict:**
- ✅ **No migration needed** - Read-only service
- ✅ **Security:** Tenants are system configuration

---

### 8. storage.service.ts ℹ️ SPECIAL CASE

**Firebase Storage Operations:**
- Upload photos/videos to Cloud Storage
- Generate signed URLs
- Delete files

**Verdict:**
- ℹ️ **Different security model** - Uses Firebase Storage Rules, not Firestore Rules
- ℹ️ **Future consideration:** Move upload validation to Cloud Functions (file size, type, malware scan)
- ✅ **Current:** Storage Rules can restrict uploads by auth status

---

## 📈 Migration Priority Matrix

### Phase 1: User & Team Join ✅ COMPLETE
**Status:** Deployed and working
- ✅ createUserDocument
- ✅ getUser (with retry logic)
- ✅ joinTeamSecure (atomic transactions)

### Phase 2: Submissions & Scoring 🔴 CRITICAL - NEXT
**Timeline:** Week 1-2 (Immediate Priority)

**Cloud Functions to Implement:**

1. **`submitTaskSecure`** 🔴 CRITICAL
   ```typescript
   // Server-side validation + scoring
   export const submitTaskSecure = onCall(async (request) => {
     // 1. Validate user is in team
     // 2. Fetch task definition (get actual points)
     // 3. Validate task requirements (photo/video/GPS)
     // 4. Validate not already completed
     // 5. Create submission with CORRECT points
     // 6. Update team/member scores atomically
     // 7. Return submission ID
   });
   ```

2. **`leaveTeamSecure`** 🟡 HIGH
   ```typescript
   // Atomic team departure
   export const leaveTeamSecure = onCall(async (request) => {
     // 1. Validate membership
     // 2. Check if owner (require transfer/delete team)
     // 3. Soft delete member record
     // 4. Update team member arrays/counts
     // 5. Transaction for consistency
   });
   ```

3. **`updateMemberStatsSecure`** (internal, called from submitTask)
   - Not directly callable by client
   - Used by submitTaskSecure to update stats

**Client-Side Changes:**
```typescript
// OLD (submission.service.ts):
export async function createSubmission(taskId, teamId, userId, data) {
  // ❌ Client-controlled points
  batch.set(submissionRef, { points: data.points });
  batch.update(teamRef, { score: increment(data.points) });
}

// NEW (submission.service.ts):
export async function createSubmission(taskId, teamId, userId, data) {
  const functions = getFunctions(undefined, 'europe-west3');
  const submitTask = httpsCallable(functions, 'submitTaskSecure');
  
  const result = await submitTask({
    taskId,
    teamId,
    photoUrls: data.photoUrls,
    videoUrl: data.videoUrl,
    textResponse: data.textResponse,
    location: data.submittedLocation
    // ❌ NO points field - server determines from task definition
  });
  
  return result.data.submissionId;
}
```

**Security Rules Update:**
```javascript
// firestore.rules (submissions)
match /submissions/{submissionId} {
  // Only Cloud Functions can create submissions
  allow create: if false;
  
  // Users can read their own team's submissions
  allow read: if isAuthenticated() 
              && request.auth.uid == resource.data.userId;
  
  // No client updates (admin via Cloud Functions only)
  allow update, delete: if false;
}
```

### Phase 3: User Management 🟡 MEDIUM
**Timeline:** Week 3-4

**Cloud Functions to Implement:**

1. **`updateUserProfileSecure`**
   - Validate displayName (profanity check, length)
   - Validate email format
   - Check for duplicate emails
   - Update user document

2. **`deleteUserSecure`** (GDPR)
   - Leave all teams
   - Anonymize submissions
   - Delete user document
   - Delete Firebase Auth account
   - Full audit trail

3. **`generateRecoveryCodeSecure`**
   - Generate secure recovery code
   - Set expiration (30 days)
   - Email to user (future: SendGrid integration)

4. **`validateRecoveryCodeSecure`**
   - Check code validity
   - Check expiration
   - Return user session

### Phase 4: Advanced Features 🟢 LOW
**Timeline:** Future consideration

1. **`transferTeamOwnershipSecure`**
2. **`updateTeamSettingsSecure`**
3. **`adminApproveSubmissionSecure`**
4. **`generateLeaderboardSecure`** (for caching)

---

## 💰 Cost Analysis

### Current Architecture (Hybrid)
```
User Join Flow:
- Client: 3 reads (check existing membership, get team, get user)
- Cloud Function: 3 reads + 3 writes (createUserDocument + joinTeamSecure)
Total: 6 reads, 3 writes

Submission Flow (CURRENT - INSECURE):
- Client: 2 reads (get team, check task completion) + 3 writes (submission, team, member)
Total: 2 reads, 3 writes
```

### Proposed Architecture (Phase 2)
```
User Join Flow (SAME):
- Cloud Function: 6 reads, 3 writes
Total: 6 reads, 3 writes

Submission Flow (SECURE):
- Cloud Function: 5 reads + 3 writes
  - Read: task definition, team, member, check existing submission, user
  - Write: submission, team, member
Total: 5 reads, 3 writes (+3 reads for validation, but SECURE)
```

**Cost Impact:**
- User join: No change
- Submissions: +3 reads per submission (task validation, duplicate check, user fetch)
- **Monthly increase:** ~$0.60 for 1000 submissions (acceptable for security)

**Cost Savings from Reduced Fraud:**
- Prevent score manipulation → Fair leaderboards
- Prevent duplicate submissions → Reduce storage costs
- Server-side validation → Reduce invalid data cleanup

---

## ⚖️ Pros and Cons Analysis

### Cloud Functions Approach

**Pros:**
1. ✅ **Security:** Server-side validation, no client manipulation
2. ✅ **Atomicity:** Transactions prevent race conditions
3. ✅ **Business Logic:** Points calculated from task definitions (single source of truth)
4. ✅ **Audit Trail:** Full logging of all operations
5. ✅ **Scalability:** Can add rate limiting, abuse detection
6. ✅ **Data Integrity:** Guaranteed consistent state
7. ✅ **Admin SDK:** Bypass security rules, immediate writes

**Cons:**
1. ❌ **Latency:** Network round-trip (50-200ms extra)
2. ❌ **Cost:** More reads for validation (~$0.60 per 1000 operations)
3. ❌ **Complexity:** More deployment steps, function management
4. ❌ **Development:** Slower iteration (deploy + test cycle)
5. ❌ **Debugging:** Logs in Firebase Console, not browser DevTools

### Client-Side Approach

**Pros:**
1. ✅ **Performance:** Instant feedback, no network delay
2. ✅ **Offline:** Can work offline with Firestore cache
3. ✅ **Development:** Fast iteration, immediate testing
4. ✅ **Cost:** Fewer reads (no server-side validation)
5. ✅ **Simplicity:** All code in one place

**Cons:**
1. ❌ **Security:** Client can manipulate any data
2. ❌ **Cheating:** Users can inject arbitrary points
3. ❌ **Race Conditions:** No atomicity across documents
4. ❌ **Validation:** Cannot enforce business rules
5. ❌ **Fraud:** No way to detect/prevent abuse

---

## 🎯 Final Recommendations

### Keep Client-Side ✅
**Operations:**
- All READ operations (queries, getDoc)
- Real-time listeners (onSnapshot)
- Non-critical updates (lastActiveAt, lastLoginAt)
- Read-only services (tasks, events, tenants)

**Rationale:**
- Better UX (instant data)
- Lower latency
- Offline support
- Firestore security rules sufficient for read access

### Migrate to Cloud Functions 🚀
**Operations:**
- All WRITE operations that affect scores/points
- User/team creation and deletion
- Submissions (CRITICAL - scoring manipulation)
- Team join/leave (atomic consistency)
- Profile updates (validation needed)
- Recovery codes (security critical)

**Rationale:**
- Prevent cheating and score manipulation
- Ensure atomic operations
- Server-side validation
- Single source of truth for business logic

### Hybrid Approach (Recommended) ⚡
```typescript
// Pattern: Client reads, Cloud Functions write

// 1. Client reads data (fast, cached)
const tasks = await getTasksByEvent(eventId);
const team = await getTeamById(teamId);

// 2. User submits task
const submissionData = {
  taskId: selectedTask.id,
  photoUrls: uploadedPhotos,
  location: currentLocation
  // ❌ NO points - server determines
};

// 3. Cloud Function validates and writes
const result = await submitTaskSecure(submissionData);

// 4. Client listens to updates (real-time)
onSnapshot(doc(db, 'teams', teamId), (snapshot) => {
  // ✅ Score updated by Cloud Function
  setTeam(snapshot.data());
});
```

**Benefits:**
- ✅ **Best of both worlds:** Fast reads, secure writes
- ✅ **User experience:** Instant data loading
- ✅ **Security:** Server-controlled mutations
- ✅ **Real-time:** Firestore listeners for updates
- ✅ **Scalability:** Can add caching, CDN later

---

## 📋 Migration Checklist

### Phase 2: Submissions (CRITICAL - Next Week)

**Cloud Functions:**
- [ ] Implement `submitTaskSecure()`
  - [ ] Validate user membership
  - [ ] Fetch task definition
  - [ ] Validate task requirements (photo/GPS/text)
  - [ ] Check for duplicates
  - [ ] Calculate points from task (not client)
  - [ ] Transaction: create submission + update team + update member
  - [ ] Return submission ID
- [ ] Implement `leaveTeamSecure()`
  - [ ] Validate membership exists
  - [ ] Check if owner (require transfer/delete)
  - [ ] Transaction: soft delete member + update team arrays
  - [ ] Audit logging
- [ ] Deploy to europe-west3
- [ ] Test with production-like data

**Client Changes:**
- [ ] Update `submission.service.ts` → call submitTaskSecure
- [ ] Remove points parameter from createSubmission()
- [ ] Update error handling for Cloud Function errors
- [ ] Add loading states during submission

**Security Rules:**
- [ ] Lock down submissions: `allow create: if false`
- [ ] Lock down team score: prevent direct updates
- [ ] Lock down teamMember stats: prevent direct updates
- [ ] Deploy rules

**Testing:**
- [ ] Test normal submission flow
- [ ] Test duplicate submission (should fail)
- [ ] Test wrong team submission (should fail)
- [ ] Test task not in event (should fail)
- [ ] Test team full (should fail)
- [ ] Verify points match task definition (not client input)

### Phase 3: User Management (Week 3-4)

**Cloud Functions:**
- [ ] Implement `updateUserProfileSecure()`
- [ ] Implement `deleteUserSecure()` (GDPR)
- [ ] Implement `generateRecoveryCodeSecure()`
- [ ] Implement `validateRecoveryCodeSecure()`

**Security Rules:**
- [ ] Lock down user profile updates
- [ ] Lock down user stats updates

---

## 📊 Metrics to Track

### Security Metrics
- Failed validation attempts (fraud detection)
- Duplicate submission attempts
- Unauthorized access attempts
- Score manipulation attempts blocked

### Performance Metrics
- Cloud Function execution time
- Client-to-submission latency
- Read operation count
- Write operation count

### Cost Metrics
- Firestore reads/writes per day
- Cloud Function invocations
- Storage bandwidth
- Total Firebase cost

---

## 🎓 Best Practices

### 1. Client Code Pattern
```typescript
// ✅ DO: Call Cloud Function for mutations
const functions = getFunctions(undefined, 'europe-west3');
const secureFunction = httpsCallable(functions, 'functionName');
await secureFunction({ data });

// ❌ DON'T: Direct Firestore writes for critical data
await updateDoc(doc(db, 'teams', teamId), { score: 999999 });
```

### 2. Cloud Function Pattern
```typescript
export const secureFunction = onCall(async (request) => {
  // 1. Auth check
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required');
  
  // 2. Input validation
  if (!data.required) throw new HttpsError('invalid-argument', 'Missing data');
  
  // 3. Business logic validation
  const team = await getTeam(data.teamId);
  if (!team) throw new HttpsError('not-found', 'Team not found');
  
  // 4. Use transactions for atomicity
  await db.runTransaction(async (t) => {
    // Multiple reads/writes guaranteed consistent
  });
  
  // 5. Return success
  return { success: true, data: result };
});
```

### 3. Security Rules Pattern
```javascript
// Read operations: Client-side
allow read: if isAuthenticated();

// Write operations: Cloud Functions only
allow create, update, delete: if false;

// Exception: Non-critical tracking
allow update: if isOwner() && onlyUpdatingFields(['lastActiveAt']);
```

---

## 📅 Timeline

### Week 1-2: Phase 2 - Submissions (CRITICAL)
- Day 1-2: Implement submitTaskSecure
- Day 3: Implement leaveTeamSecure  
- Day 4: Deploy and test
- Day 5: Update client code
- Day 6-7: Integration testing + bug fixes

### Week 3-4: Phase 3 - User Management
- Day 1-2: Implement profile updates
- Day 3: Implement GDPR deletion
- Day 4: Implement recovery codes
- Day 5-7: Testing + documentation

### Future: Phase 4 - Advanced Features
- As needed based on feature requirements

---

## 🚀 Conclusion

**Current State:**
- ✅ Phase 1 complete: User creation + team join secure
- ⚠️ Submissions vulnerable to manipulation (CRITICAL)
- ⚠️ Mixed security model (some operations secure, others not)

**Recommended Architecture:**
```
┌─────────────────────────────────────────┐
│  Client (React App)                     │
│  ┌─────────────────────────────────┐   │
│  │ READ: Fast, cached, real-time   │   │
│  │ - Tasks, Events, Teams, Users   │   │
│  │ - Firestore queries/listeners   │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ WRITE: Cloud Functions only     │   │
│  │ - Submissions (points)          │   │
│  │ - Team join/leave               │   │
│  │ - Profile updates               │   │
│  │ - User creation/deletion        │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Cloud Functions (europe-west3)         │
│  - Server-side validation               │
│  - Atomic transactions                  │
│  - Admin SDK (bypass rules)             │
│  - Audit logging                        │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  Firestore Database                     │
│  - Restrictive security rules           │
│  - Only Cloud Functions can write       │
│  - Clients can read (with auth)         │
└─────────────────────────────────────────┘
```

**Next Steps:**
1. ⚠️ **URGENT:** Implement submitTaskSecure (score manipulation risk)
2. 📝 Review and approve Phase 2 implementation plan
3. 🚀 Deploy Phase 2 within 1-2 weeks
4. 📊 Monitor metrics and costs
5. 🔄 Iterate on Phase 3 based on Phase 2 learnings

**Benefits of This Architecture:**
- ✅ Secure: No client manipulation possible
- ✅ Fast: Reads are cached and instant
- ✅ Scalable: Cloud Functions handle load
- ✅ Maintainable: Clear separation of concerns
- ✅ Cost-effective: Minimal overhead for security

---

**Decision:** Proceed with **Phased Cloud Function Migration** focusing on Phase 2 (Submissions) as the highest priority.
