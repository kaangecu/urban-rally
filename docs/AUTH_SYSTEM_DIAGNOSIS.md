# Authentication System Diagnosis & Refactoring Plan

**Date:** December 7, 2025  
**Status:** 🔴 CRITICAL - System Not Functioning  
**Root Cause:** Permission Denied on User Creation

---

## 🔍 Current State Analysis

### What You Have

1. **Firebase Auth:** ✅ Working
   - 20+ anonymous auth users created successfully
   - Each login creates a new Firebase Auth user with unique UID
   - Auth users have NO associated Firestore documents

2. **Firestore Database:** ❌ Empty Users Collection
   - **0 user documents** in `/users/` collection
   - Auth users exist but Firestore documents NEVER get created
   - Permission error blocks `setDoc()` call

3. **Authentication Flow:** ✅ Designed (but blocked)
   ```
   User enters form → signInAnonymously() → [PERMISSION DENIED HERE] → setDoc(user doc)
   ```

### The Critical Problem

**You have 20+ "ghost users"** - Firebase Auth accounts with NO database records.

```
Firebase Auth (✅ Working):
- UID: 1K1qcnxAMvdU01YxIe0uz9HM6yk2
- UID: 2QM25011d2Uc5vdG5VZzySAT1sJ2
- UID: 5WD7OdqPzMPJKteIQkMJk1rORz62
... (20 total)

Firestore /users/ collection (❌ Empty):
- (no documents)
```

**Every login attempt:**
1. ✅ Creates new Firebase Auth user
2. ❌ FAILS to create Firestore document
3. Result: Ghost user in Auth, nothing in database

---

## 🎯 Root Cause Identified

### The Permission Error

```typescript
// user.service.ts:121
await setDoc(userRef, userData);
// ❌ FirebaseError: Missing or insufficient permissions
```

### Why This is Happening

**Firestore Security Rules** require authentication AND UID match:

```javascript
// firestore.rules
match /users/{userId} {
  allow create: if isAuthenticated() 
                && request.auth.uid == userId;
}
```

**The Problem:** Rules check passes, but something ELSE is blocking the write.

### Potential Root Causes

1. **⏱️ Auth Timing Issue** (Most Likely)
   - `signInAnonymously()` is async
   - `setDoc()` happens immediately after
   - **Firebase Auth state may not be fully propagated** to Firestore security rules
   - Rules see "not authenticated" even though `auth.currentUser` exists in client

2. **🔐 Anonymous Auth Not Fully Enabled**
   - Firebase Console might have anonymous auth disabled
   - Or restricted by domain/app settings

3. **🌐 CORS/Domain Restrictions**
   - Firestore may reject requests from localhost
   - Auth domains not configured properly

4. **📋 Field Validation Still Active**
   - Even though we simplified rules, there might be cached rules
   - Or rules haven't actually deployed

---

## 🏗️ Architecture Review

### Current Design (User-Centric Multi-User System)

Your system was **correctly migrated** from team-centric to user-centric:

```
OLD MODEL (Deprecated):
Team {
  uid: string           // Single user's Auth ID
  displayName: string   // Single user's name
  email?: string        // Single user's email
}

NEW MODEL (Current):
User {
  id: string           // Firebase Auth UID
  displayName: string
  email?: string
  tenantId: string
  totalScore: number
}

Team {
  ownerUserId: string
  memberUserIds: string[]
  maxMembers: number
}

TeamMember {
  teamId: string
  userId: string
  personalScore: number
  role: 'owner' | 'member'
}
```

**This design is CORRECT and should work!** The issue is just the permission timing.

### Authentication Flow (Designed)

```typescript
// TeamCodeLogin.tsx → handleSubmit()

1. User enters team code → Verify team exists
2. User enters name/email → Validate inputs
3. User accepts terms → Capture consent

4. getOrCreateUser() called:
   ├─→ signInAnonymously(auth)           // ✅ WORKS
   ├─→ Get UID from userCredential       // ✅ WORKS
   ├─→ setDoc(db, 'users', uid, userData) // ❌ PERMISSION DENIED
   └─→ Return user object

5. addUserToTeam() → Create TeamMember record
6. Update team.memberUserIds array
7. Update auth store (setUser, setTeam)
8. Redirect to game
```

**The flow stops at step 4** - user doc never gets created.

---

## 🛠️ Solution Options

### Option 1: Add Auth State Delay (Recommended - Quick Fix)

**Theory:** Firestore rules evaluation happens server-side. Client-side auth state updates instantly, but server-side propagation takes ~100-500ms.

**Implementation:**

```typescript
// user.service.ts - createUser()

export async function createUser(data: {...}): Promise<User> {
  const auth = getFirebaseAuth();
  const db = getFirebaseFirestore();

  console.log('🔐 Creating anonymous auth user...');
  const userCredential = await signInAnonymously(auth);
  const uid = userCredential.user.uid;
  console.log('✅ Auth user created, UID:', uid);

  // 🆕 ADD THIS: Wait for auth state to propagate to Firestore
  console.log('⏳ Waiting for auth state propagation...');
  await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
  
  // 🆕 ADD THIS: Force token refresh to ensure rules have latest state
  await userCredential.user.getIdToken(true);
  
  console.log('💾 Attempting to write document...');
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, userData);
  
  return user;
}
```

**Pros:**
- ✅ Simple one-line fix
- ✅ No architecture changes
- ✅ Addresses most common auth timing issues

**Cons:**
- ⚠️ Adds 500ms delay to login (barely noticeable)
- ⚠️ Hacky workaround, not a "proper" solution

---

### Option 2: Use Firebase Admin SDK (Proper Fix)

**Theory:** Client SDK requires authentication to write. Admin SDK bypasses security rules entirely.

**Implementation:**

Create a **Cloud Function** to handle user creation:

```typescript
// functions/src/index.ts

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const createUserDocument = functions.https.onCall(async (data, context) => {
  // Verify caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be logged in to create user document'
    );
  }

  const uid = context.auth.uid;
  const { displayName, email, tenantId, consentGiven } = data;

  // Create user document with Admin SDK (bypasses security rules)
  await admin.firestore().collection('users').doc(uid).set({
    id: uid,
    displayName,
    email: email || null,
    tenantId,
    consentGiven,
    totalScore: 0,
    totalSubmissions: 0,
    eventsParticipated: 0,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, userId: uid };
});
```

**Client-side:**

```typescript
// user.service.ts

import { getFunctions, httpsCallable } from 'firebase/functions';

export async function createUser(data: {...}): Promise<User> {
  const auth = getFirebaseAuth();
  const functions = getFunctions();
  
  // 1. Authenticate
  const userCredential = await signInAnonymously(auth);
  const uid = userCredential.user.uid;
  
  // 2. Call Cloud Function to create document
  const createUserDoc = httpsCallable(functions, 'createUserDocument');
  await createUserDoc({
    displayName: data.displayName,
    email: data.email,
    tenantId: data.tenantId,
    consentGiven: data.consentGiven,
  });
  
  // 3. Fetch created document
  const userRef = doc(db, 'users', uid);
  const userDoc = await getDoc(userRef);
  
  return userDoc.data() as User;
}
```

**Pros:**
- ✅ Proper solution - no timing issues
- ✅ More secure - server validates all data
- ✅ Bypasses client-side permission issues

**Cons:**
- ❌ Requires Firebase Blaze plan (pay-as-you-go)
- ❌ More complex setup
- ❌ Adds Cloud Functions dependency

---

### Option 3: Verify Firebase Configuration (Diagnostic Step)

**Before applying any fix, verify:**

1. **Check Anonymous Auth is Enabled:**
   ```bash
   # Firebase Console
   → Authentication
   → Sign-in method
   → Anonymous
   → Should be ENABLED
   ```

2. **Check Authorized Domains:**
   ```bash
   # Firebase Console
   → Authentication
   → Settings
   → Authorized domains
   → Should include: localhost, 127.0.0.1
   ```

3. **Verify Rules Deployed:**
   ```bash
   firebase deploy --only firestore:rules
   # Check timestamp matches your last deployment
   ```

4. **Test Rules in Simulator:**
   ```bash
   # Firebase Console
   → Firestore Database
   → Rules
   → Rules Playground
   
   # Test this:
   Operation: Create
   Collection: users
   Document: test-user-123
   Authenticated: Yes
   Auth UID: test-user-123
   
   # Should ALLOW
   ```

---

### Option 4: Simplify Auth Flow (Alternative Architecture)

**Theory:** Maybe the multi-step user creation is overcomplicating things.

**Simplified approach:**

```typescript
// Don't create user until they're INSIDE the game

// TeamCodeLogin.tsx
async function handleSubmit() {
  // 1. Find team
  const team = await getTeamByAccessCode(code);
  
  // 2. Sign in anonymously (NO user doc yet)
  const userCredential = await signInAnonymously(auth);
  const uid = userCredential.user.uid;
  
  // 3. Store temporary profile in localStorage
  localStorage.setItem('tempProfile', JSON.stringify({
    displayName: formData.displayName,
    email: formData.email,
    consent: consentData,
  }));
  
  // 4. Set auth state
  setUser({ id: uid, displayName: formData.displayName });
  setTeam(team);
  
  // 5. Redirect to game
}

// Inside game - first submission triggers user doc creation
async function submitTask() {
  const tempProfile = JSON.parse(localStorage.getItem('tempProfile'));
  
  // Create user doc NOW (after auth has fully propagated)
  if (!userExists) {
    await createUser(tempProfile);
    localStorage.removeItem('tempProfile');
  }
  
  // Continue with submission...
}
```

**Pros:**
- ✅ Delays user creation until auth fully propagated
- ✅ No setTimeout hacks
- ✅ Still captures all required data

**Cons:**
- ⚠️ More complex flow
- ⚠️ User doc created on first action, not login
- ⚠️ Edge case: User logs in but never submits = no doc

---

## 📋 Recommended Action Plan

### Phase 1: Immediate Diagnosis (5 minutes)

1. **Check Firebase Console:**
   - [ ] Verify Anonymous Auth is enabled
   - [ ] Check authorized domains include localhost
   - [ ] Test rules in Rules Playground

2. **Add Enhanced Logging:**
   - [ ] Log `auth.currentUser` state before setDoc
   - [ ] Log exact timestamp of auth creation vs. doc creation
   - [ ] Log auth token claims

### Phase 2: Quick Fix (30 minutes)

**Try Option 1 first** (auth state delay):

```typescript
// Add 500ms delay + token refresh before setDoc
await new Promise(resolve => setTimeout(resolve, 500));
await userCredential.user.getIdToken(true);
await setDoc(userRef, userData);
```

Test if this resolves the issue.

### Phase 3: Proper Fix (If needed - 2 hours)

If Option 1 doesn't work, implement **Option 2** (Cloud Functions):

1. Set up Firebase Functions
2. Create `createUserDocument` callable function
3. Update client to call function instead of direct setDoc
4. Deploy and test

### Phase 4: Cleanup (1 hour)

Once working:

1. **Delete ghost auth users:**
   ```typescript
   // Delete all Auth users with no Firestore docs
   firebase auth:export users.json
   // Filter users without matching Firestore docs
   firebase auth:import cleaned-users.json
   ```

2. **Update documentation**
3. **Add monitoring** for this error

---

## 🎯 Next Steps

**What You Should Do RIGHT NOW:**

1. **Verify Firebase Configuration** (5 min)
   - Check Anonymous Auth is enabled
   - Check authorized domains
   - Test rules simulator

2. **Apply Quick Fix** (Option 1 - 5 min)
   - Add 500ms delay after signInAnonymously
   - Add token refresh
   - Test user creation

3. **Share Results**
   - If Option 1 works → Great! Clean up ghost users
   - If Option 1 fails → Provide console logs, proceed to Option 2

**I can help you implement any of these options.** Which approach would you like to try first?

---

## 📊 Current System Health

| Component | Status | Details |
|-----------|--------|---------|
| Firebase Auth | ✅ Working | 20+ users created |
| Firestore Users | ❌ Empty | 0 documents |
| Security Rules | ✅ Deployed | Simplified version active |
| Login UI | ✅ Working | Form validation passes |
| User Creation | ❌ Blocked | Permission error |
| Team System | ⏸️ Untested | Can't test without users |
| Overall Health | 🔴 Critical | **Users cannot join teams** |

