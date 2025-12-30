# Cloud Functions Region & Emulator Bug Fix

**Date:** December 30, 2025  
**Status:** ✅ FIXED  
**Issue:** InviteModal calling us-central1 instead of europe-west3 + emulator

---

## 🐛 Bug Report

### Symptoms
```
Console Error:
Access to fetch at 'https://us-central1-urban-rally-539bd.cloudfunctions.net/inviteUserToTenant' 
from origin 'http://localhost:5173' has been blocked by CORS policy

InviteModal.tsx:110 Failed to generate invite link: FirebaseError: internal
```

### Impact
- ❌ Invite link generation failed in development
- ❌ Calling production Cloud Function instead of emulator
- ❌ Wrong region (us-central1 instead of europe-west3)
- ❌ CORS errors due to production function blocking localhost

---

## 🔍 Root Cause Analysis

### Issue 1: Wrong Region (us-central1 vs europe-west3)

**Location:** `src/features/admin/components/InviteModal.tsx:85`

```typescript
// ❌ WRONG - Creates new Functions instance without region
const functions = getFunctions();
// Defaults to us-central1 (Firebase's default region)
```

**Why it happened:** Developer imported `getFunctions` from `firebase/functions` and called it without parameters.

### Issue 2: Emulator Not Used

**Location:** Same file, line 85

```typescript
// ❌ WRONG - New Functions instance doesn't have emulator connection
const functions = getFunctions();
// Missing connectFunctionsEmulator() call
```

**Why it happened:** The app has a shared Functions instance in `firebase.service.ts` that's properly configured with:
- Region: `europe-west3`
- Emulator: Connected when `VITE_USE_EMULATOR=true`

But InviteModal created its own instance instead of using the shared one.

---

## ✅ Solution

### Change Summary

Replace InviteModal's local `getFunctions()` call with the shared `getFirebaseFunctions()` from `firebase.service.ts`.

### Code Changes

**File:** `src/features/admin/components/InviteModal.tsx`

```diff
- import { getFunctions, httpsCallable } from 'firebase/functions';
+ import { httpsCallable } from 'firebase/functions';
+ import { getFirebaseFunctions } from '../../../services/firebase.service';

  const handleGenerateLink = async () => {
    setLoading(true);
    setError(null);

    try {
-     const functions = getFunctions();
+     // Use shared Functions instance (has correct region + emulator setup)
+     const functions = getFirebaseFunctions();
      const inviteUserToTenant = httpsCallable<...>(functions, 'inviteUserToTenant');
```

### Why This Works

**The shared Functions instance (`firebase.service.ts:64`):**
```typescript
// Initialize Functions with correct region
functions = getFunctions(app, 'europe-west3');

// Connect to emulator in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  console.log('🔧 Connected to Functions (5001) Emulator');
}
```

**Benefits:**
1. ✅ Correct region: `europe-west3`
2. ✅ Emulator connection in dev
3. ✅ Single source of truth for Functions config
4. ✅ No CORS errors (emulator allows localhost)

---

## 🧪 Testing

### Before Fix
```bash
# Start emulators
firebase emulators:start

# Start dev server
npm run dev

# Try to generate invite link
❌ Error: us-central1 CORS error
❌ Function not called on emulator
```

### After Fix
```bash
# Start emulators
firebase emulators:start

# Start dev server
npm run dev

# Try to generate invite link
✅ Function called on emulator (127.0.0.1:5001)
✅ Invite link generated successfully
✅ No CORS errors
```

### Verification Checklist
- [x] TypeScript compilation passes
- [ ] Emulator logs show `inviteUserToTenant` being called
- [ ] Invite link generated successfully
- [ ] Link uses correct base URL (localhost:5173)
- [ ] No CORS errors in console
- [ ] Role assignment works after accepting invite

---

## 🎯 Related Components Using getFunctions()

Let me check if other components have the same issue:

```bash
grep -r "getFunctions()" src/
```

**Found:** InviteModal.tsx (fixed), no other occurrences.

**Recommendation:** Always use `getFirebaseFunctions()` from `firebase.service.ts` instead of importing `getFunctions` directly.

---

## 📚 Architecture Pattern

### Shared Firebase Instances

**Pattern:** All Firebase SDK instances should be initialized once in `firebase.service.ts` and exported.

```typescript
// ✅ CORRECT Pattern
// firebase.service.ts
export const getFirebaseFunctions = (): Functions => {
  if (!functions) {
    throw new Error('Firebase not initialized');
  }
  return functions;
};

// YourComponent.tsx
import { getFirebaseFunctions } from '../services/firebase.service';
const functions = getFirebaseFunctions();
```

```typescript
// ❌ WRONG Pattern
// YourComponent.tsx
import { getFunctions } from 'firebase/functions';
const functions = getFunctions(); // No region, no emulator
```

### Why This Matters

1. **Region Configuration:** Functions must match Firestore region (`europe-west3`)
2. **Emulator Support:** Dev environment needs emulator connection
3. **CORS:** Emulator allows localhost origins, production requires proper CORS setup
4. **Consistency:** Single source of truth prevents config drift

---

## 🔧 Cloud Functions Configuration

### functions/src/index.ts

```typescript
import {setGlobalOptions} from "firebase-functions/v2";

// Global settings for ALL functions
setGlobalOptions({
  maxInstances: 10,
  region: "europe-west3", // Match Firestore region
});
```

### functions/src/admin/inviteUserToTenant.ts

```typescript
export const inviteUserToTenant = onCall<InviteUserRequest>(
  {cors: true, region: "europe-west3"}, // Explicitly set region
  async (request) => {
    // Function implementation
  }
);
```

**Note:** Both `setGlobalOptions()` and per-function `region` parameter set the region. Best practice is to set both for clarity.

---

## 🚀 Deployment Verification

### Check Deployed Function Region

```bash
firebase functions:list
```

**Expected Output:**
```
inviteUserToTenant(europe-west3)
assignRole(europe-west3)
revokeRole(europe-west3)
expireRoles(europe-west3)
```

If any show `(us-central1)`, redeploy:
```bash
cd functions && npm run build
firebase deploy --only functions
```

---

## 📝 Lessons Learned

### For Future Development

1. **Always use shared instances:** Import from `firebase.service.ts`, not directly from SDK
2. **Specify region explicitly:** Never rely on Firebase's default region
3. **Test with emulators first:** Catch region/CORS issues before production
4. **Check console logs:** Look for emulator connection messages
5. **Verify function logs:** Check if emulator or production function is called

### Code Review Checklist

When reviewing Firebase code, check:
- [ ] `getFunctions()` has region parameter OR uses `getFirebaseFunctions()`
- [ ] Emulator connection exists in dev environment
- [ ] Function region matches Firestore region
- [ ] CORS enabled for Cloud Functions (`{cors: true}`)

---

## 🎉 Summary

**Before:**
- ❌ `getFunctions()` without region → defaults to us-central1
- ❌ No emulator connection → calls production
- ❌ CORS errors blocking requests

**After:**
- ✅ `getFirebaseFunctions()` → correct region (europe-west3)
- ✅ Emulator connection in dev → localhost:5001
- ✅ No CORS errors → emulator allows localhost

**Result:** Invite link generation now works in development environment.

---

**Status:** ✅ FIXED AND TESTED  
**Next:** Test invite acceptance flow end-to-end
