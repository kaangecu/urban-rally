# Auth Navigation Firestore Connection Debug Analysis

## Issue Summary
When navigating from player auth to admin layout, Firestore operations fail with:
```
Could not reach Cloud Firestore backend. Backend didn't respond within 10 seconds.
Failed to get document because the client is offline.
```

## Error Stack Analysis

### Key Error Patterns

1. **Primary Error**: "Could not reach Cloud Firestore backend" 
   - This indicates Firestore SDK is trying to connect to **PRODUCTION** instead of emulator
   - Happens when `getUserById()` is called

2. **React Strict Mode Double-Mount**:
   ```
   doubleInvokeEffectsInDEV
   reconnectPassiveEffects
   ```
   - React Strict Mode causes components to mount twice in development
   - Auth listeners fire multiple times
   - Can cause race conditions if Firestore connection not properly established

3. **Cascade Failure**:
   - `useProfileGuard` hook fires on auth state change
   - Calls `getUserById()`
   - Firestore query fails
   - Error handler calls `logout()`
   - Creates infinite loop of logout → onboarding modal → login attempts

## Root Cause Hypotheses

### Hypothesis 1: Emulator Connection Timing Issue ✅ LIKELY
**Evidence:**
- Error says "Could not reach Cloud Firestore backend" (production URL)
- Emulator is running (verified with `curl http://127.0.0.1:8080`)
- `connectFirestoreEmulator()` is called in initialization
- But Firestore queries might happen BEFORE connection is fully registered

**Why This Happens:**
When you call `getFirestore(app)`, it returns a Firestore instance immediately. However, `connectFirestoreEmulator()` must be called BEFORE the first query executes. If React Strict Mode causes rapid component mounting, the auth listener might fire and trigger Firestore queries before the emulator connection is fully established.

### Hypothesis 2: Multiple Firestore Instance Creation ❌ RULED OUT
**Evidence:**
- Checked all imports - services use `getFirebaseFirestore()` singleton
- Only one `getFirestore()` call in firebase.service.ts
- No duplicate instance creation

### Hypothesis 3: HMR (Hot Module Reload) State Corruption ⚠️ POSSIBLE
**Evidence:**
- During development, Vite HMR might reload modules
- `connectFirestoreEmulator()` throws if called twice
- Added try-catch to handle this (✅ FIXED in current code)

## Current Fixes Applied

### 1. Enhanced Error Handling for Emulator Connection
**File**: `src/services/firebase.service.ts`

```typescript
try {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  console.log('🔧 Connected to Firestore Emulator (8080)');
} catch (error: any) {
  // If already connected, this is OK (happens on HMR reloads)
  if (error.message?.includes('already been called')) {
    console.log('⚠️  Firestore Emulator already connected (HMR reload)');
  } else {
    console.error('❌ Failed to connect to Firestore Emulator:', error);
    throw error;
  }
}
```

**Why**: Prevents crash on HMR reload when `connectFirestoreEmulator()` is called twice.

### 2. Enhanced Diagnostic Logging
**Files**: 
- `src/services/firebase.service.ts` - Initialization sequence logging
- `src/services/user.service.ts` - Query execution logging

**Why**: Helps identify exact timing of when queries execute relative to initialization.

## Testing Steps

### Step 1: Clear Browser State
```bash
# Open DevTools → Application → Clear Storage
# OR Hard Refresh: Cmd+Shift+R (Mac)
```

**Why**: Old cached Firestore instance might have stale production connection.

### Step 2: Check Console Logs on Load
Expected sequence:
```
🔥 [initializeFirebase] Starting initialization...
🔥 [initializeFirebase] DEV: true
🔥 [initializeFirebase] VITE_USE_EMULATOR: true
✅ [initializeFirebase] Firebase App initialized
✅ [initializeFirebase] Auth instance created
🔧 Connected to Auth Emulator (9099)
✅ [initializeFirebase] Auth persistence configured
🔥 [initializeFirebase] useEmulator: true
✅ [initializeFirebase] Firestore instance created
🔧 Connected to Firestore Emulator (8080)
🔧 Connected to Functions (5001) and Storage (9199) Emulators
✅ Firebase initialized successfully
🔥 Firebase ready, rendering app...
```

If you see `useEmulator: false` or emulator connection logs missing → Environment variable issue.

### Step 3: Attempt Login as Player
1. Navigate to `/` (player login)
2. Enter event code / team code
3. Watch console for:
   ```
   [getUserById] START - Fetching user: <uid>
   [getUserById] Got Firestore instance
   [getUserById] Created doc reference: users/<uid>
   [getUserById] Fetched document, exists: true
   ```

If you see "Could not reach Cloud Firestore backend" → Connection not established.

### Step 4: Navigate to Admin
1. Navigate to `/admin/login`
2. Login with admin credentials
3. Watch for same error pattern

## Potential Additional Fixes

### Fix Option 1: Add Initialization Lock ⭐ RECOMMENDED
Ensure Firestore isn't used until connection confirmed:

```typescript
// firebase.service.ts
let firestoreReady = false;

export const initializeFirebase = async (): Promise<void> => {
  // ... existing code ...
  
  if (useEmulator) {
    db = getFirestore(app);
    try {
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      firestoreReady = true; // ← Mark as ready
      console.log('🔧 Connected to Firestore Emulator (8080)');
    } catch (error: any) {
      // ...
    }
  }
};

export const getFirebaseFirestore = (): Firestore => {
  if (!db) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  if (import.meta.env.DEV && !firestoreReady) {
    console.warn('⚠️  Firestore accessed before emulator connection confirmed!');
  }
  return db;
};
```

### Fix Option 2: Delay Auth Listener Until Firestore Ready
Modify `AuthContext.tsx` to wait for initialization:

```typescript
useEffect(() => {
  // Wait 100ms for Firestore emulator connection to stabilize
  const timer = setTimeout(() => {
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // ... existing logic ...
    });
    return () => unsubscribe();
  }, 100);
  
  return () => clearTimeout(timer);
}, []);
```

### Fix Option 3: Use `waitForPendingWrites()` Before Queries
Add connection verification:

```typescript
import { waitForPendingWrites } from 'firebase/firestore';

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const db = getFirebaseFirestore();
    
    // Wait for Firestore to be fully connected
    if (import.meta.env.DEV) {
      await waitForPendingWrites(db);
    }
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    // ...
  }
}
```

## Environment Verification Checklist

- [x] Emulator running: `curl http://127.0.0.1:8080` returns `Ok`
- [x] Environment variable set: `.env.local` contains `VITE_USE_EMULATOR=true`
- [x] Firestore init code calls `connectFirestoreEmulator()` before queries
- [ ] Console shows emulator connection logs on app load
- [ ] `useEmulator` flag is `true` in console logs
- [ ] No "Could not reach Cloud Firestore backend" errors

## Expected vs Actual Behavior

### Expected (Working)
1. User logs in as player
2. `getUserById()` fetches from emulator at `127.0.0.1:8080`
3. Profile loads, dashboard accessible
4. Navigate to `/admin/login`
5. Login as admin
6. `getUserById()` fetches admin user from same emulator
7. Admin dashboard loads

### Actual (Broken)
1. User logs in as player (works if fresh page load)
2. Navigate to `/admin/login`
3. Login as admin
4. `getUserById()` tries to reach **production Firestore** (not emulator)
5. Times out after 10 seconds
6. Error: "client is offline"
7. Error handler calls `logout()`
8. User stuck in login loop

## Next Debugging Steps

1. **Test with added logging**: Open browser, check console for initialization sequence
2. **Verify environment**: Ensure `useEmulator: true` appears in logs
3. **Check timing**: Look for `[getUserById]` logs appearing BEFORE emulator connection logs
4. **Test navigation**: If player login works but admin fails, indicates route-specific issue
5. **Try Fix Option 1**: Add `firestoreReady` flag if timing issue confirmed

## Related Files
- `src/services/firebase.service.ts` - Firebase initialization (MODIFIED)
- `src/services/user.service.ts` - User queries (MODIFIED - added logging)
- `src/contexts/AuthContext.tsx` - Auth listener setup
- `src/hooks/useProfileGuard.ts` - Profile check hook
- `.env.local` - Environment configuration (VITE_USE_EMULATOR=true)

## Status
🟡 **In Progress** - Enhanced logging added, awaiting test results from user.

**Next Action**: User should test with new logging and report console output.
