# Permission Error Diagnosis Guide

## Current Status: 🔍 DEBUGGING MODE

**Error:** `FirebaseError: Missing or insufficient permissions`  
**Location:** `user.service.ts` line 92 (setDoc call)  
**Action Plan Status:** Step 3/6 Complete

---

## What We've Done

### ✅ Step 1: Added Comprehensive Logging
The `createUser` function now logs:
- 🔵 Start of process
- 📋 Input data (displayName, email, tenantId, consentGiven)
- 🔐 Auth user creation
- ✅ Auth UID and state
- 📱 Auth provider details
- 📄 Document structure to be created
- 🔍 Current auth state before setDoc
- 💾 Document write attempt
- ❌ Enhanced error details

### ✅ Step 2: Simplified Firestore Rules
**Before (Strict):**
```javascript
allow create: if isAuthenticated() 
              && request.auth.uid == userId
              && request.resource.data.uid == userId  // ❌ Field validation
              && request.resource.data.id == userId;  // ❌ Field validation
```

**After (Debugging):**
```javascript
allow create: if isAuthenticated() 
              && request.auth.uid == userId;  // ✅ Only auth check
```

### ✅ Step 3: Deployed Rules
Rules deployed to Firebase: `urban-rally-539bd`

---

## Next Steps: TEST NOW

### 🧪 Test Case 1: WITHOUT Email

**Instructions:**
1. Open browser console (F12)
2. Clear console
3. Navigate to team login
4. Enter:
   - Access code: [your team code]
   - Display name: "Debug Test"
   - Email: [LEAVE BLANK]
5. Accept terms
6. Click "Join Team"

**What to Look For:**
```
Console Output:
🔵 Starting user creation process...
📋 Input data: { displayName: "Debug Test", hasEmail: false, ... }
🔐 Creating anonymous auth user...
✅ Auth user created, UID: [some-uid]
📱 Auth state: { uid: "...", isAnonymous: true, ... }
📄 Document to be created: { path: "users/...", fields: [...], ... }
🔍 Auth check before setDoc: { exists: true, uid: "...", matchesDocId: true }
💾 Attempting to write document...

Expected Result:
✅ User created successfully: [uid] without email

OR ERROR with details:
❌ Error creating user: [error details]
```

**Copy and paste ALL console output here:**
```
[PASTE CONSOLE OUTPUT]
```

---

### 🧪 Test Case 2: WITH Email

**Instructions:**
1. Open browser console (F12)
2. Clear console
3. Navigate to team login
4. Enter:
   - Access code: [your team code]
   - Display name: "Debug Test 2"
   - Email: "debug@test.com"
5. Accept terms
6. Click "Join Team"

**Copy and paste ALL console output here:**
```
[PASTE CONSOLE OUTPUT]
```

---

## Diagnosis Checklist

Based on console output, identify the issue:

### Scenario A: Auth Not Completing
**Symptoms:**
- ✅ Auth user created
- ❌ Current user exists: false
- OR: UID mismatch

**Cause:** Timing issue - setDoc called before auth state propagates  
**Fix:** Add await or delay after signInAnonymously

### Scenario B: Still Permission Denied (Even with Simple Rules)
**Symptoms:**
- ✅ Auth user created
- ✅ Current user exists: true
- ✅ UID matches
- ❌ Still permission error

**Possible Causes:**
1. Rules not deployed (check Firebase Console)
2. Using wrong Firebase project
3. Anonymous auth not enabled in Firebase Console
4. Firestore database in wrong mode (lockdown mode)

**Fix:** Check Firebase Console settings

### Scenario C: Field Validation Error
**Symptoms:**
- ✅ Auth user created
- ✅ Current user exists
- ❌ Error mentions specific field

**Cause:** Field type/format mismatch  
**Fix:** Adjust document structure

### Scenario D: Works Now!
**Symptoms:**
- ✅ All logs look good
- ✅ User created successfully
- ✅ No errors

**Conclusion:** Issue was field validation in rules  
**Next Step:** Restore stricter rules with corrected field checks

---

## Firebase Console Checks

### 1. Verify Anonymous Auth Enabled
```
1. Go to: https://console.firebase.google.com/project/urban-rally-539bd/authentication
2. Click "Sign-in method"
3. Verify "Anonymous" is ENABLED
```

### 2. Verify Firestore Rules Deployed
```
1. Go to: https://console.firebase.google.com/project/urban-rally-539bd/firestore/rules
2. Check timestamp of last deploy
3. Verify rules match local file
4. Look for line: "allow create: if isAuthenticated() && request.auth.uid == userId;"
```

### 3. Check Firestore Database Mode
```
1. Go to: https://console.firebase.google.com/project/urban-rally-539bd/firestore
2. Verify database is in "Production mode" or "Test mode"
3. NOT in complete lockdown
```

### 4. Test Rules Simulator
```
1. Go to Firestore Rules tab
2. Click "Rules Playground"
3. Test:
   Location: /users/test-uid-123
   Auth: Authenticated (uid: test-uid-123)
   Operation: Create
   Document: { uid: "test-uid-123", id: "test-uid-123", displayName: "Test" }
4. Should show: ✅ Allow
```

---

## Common Issues & Solutions

### Issue: "Anonymous sign-in is disabled"
**Solution:**
```
1. Go to Firebase Console > Authentication
2. Click "Sign-in method"
3. Enable "Anonymous"
4. Save
```

### Issue: Rules not deploying
**Solution:**
```bash
# Re-deploy rules
firebase deploy --only firestore:rules --force

# Verify deployment
firebase open firestore
# Check rules tab for latest timestamp
```

### Issue: Wrong Firebase project
**Solution:**
```bash
# Check current project
firebase projects:list
firebase use

# Should show: urban-rally-539bd

# If wrong project:
firebase use urban-rally-539bd
```

### Issue: Auth state not persisting
**Solution:**
```typescript
// In createUser, add small delay after auth
await signInAnonymously(auth);
await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
const uid = auth.currentUser!.uid;
```

---

## After Diagnosis

### If Issue is Field Validation:
1. Identify which field is failing
2. Update rules to match actual document structure
3. Re-deploy with proper validation
4. Re-test

### If Issue is Auth Timing:
1. Add delay after signInAnonymously
2. Ensure auth.currentUser is populated
3. Re-test

### If Issue is Firebase Configuration:
1. Fix settings in Firebase Console
2. Re-test without code changes

---

## Restore Production Rules

Once working, restore strict field validation:

```javascript
allow create: if isAuthenticated() 
              && request.auth.uid == userId
              && request.resource.data.uid == userId
              && request.resource.data.id == userId
              && request.resource.data.tenantId is string
              && request.resource.data.displayName is string
              && request.resource.data.consentGiven is map;
```

---

## Status Updates

**Current:** Waiting for test results with debugging enabled  
**Expected:** Console logs will reveal exact failure point  
**Next:** Apply targeted fix based on diagnosis  

---

**Updated:** December 7, 2024  
**Commit:** 598b1ac  
**Rules Deployed:** Yes (simplified)  
**Ready for Testing:** ✅ YES - Please test now and share console output
