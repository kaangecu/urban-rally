# Firebase Emulator Initialization Fix

## Problem
After page refresh, the app crashed with:
```
POST https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=... 400 (Bad Request)
FirebaseError: Firebase: Error (auth/emulator-config-failed)
```

## Root Cause
**Race condition in Firebase initialization order:**

### ❌ Old (Broken) Flow:
```typescript
1. app = initializeApp(firebaseConfig)
2. auth = getAuth(app)                    // Auth instance created
3. setPersistence(auth, ...)              // Auth tries to restore session from localStorage
   └─> 🔥 Auth makes API call to PRODUCTION endpoint (identitytoolkit.googleapis.com)
4. connectAuthEmulator(auth, ...)         // ❌ TOO LATE! Already tried production
```

### Problem Details:
- When `getAuth()` is called, Firebase Auth immediately tries to restore the user session from localStorage
- It makes an API call to validate the stored auth token
- **BUT** the emulator connection hasn't been configured yet
- So it uses the production API endpoint instead of the emulator
- This causes `auth/emulator-config-failed` error

## Solution
**Connect to emulator BEFORE configuring persistence:**

### ✅ New (Fixed) Flow:
```typescript
1. app = initializeApp(firebaseConfig)
2. auth = getAuth(app)                    // Auth instance created
3. connectAuthEmulator(auth, ...)         // ✅ Connect to emulator FIRST
4. setPersistence(auth, ...)              // Now auth uses emulator endpoint
   └─> ✅ Auth makes API call to EMULATOR endpoint (127.0.0.1:9099)
```

## Code Changes

### Before:
```typescript
export const initializeFirebase = async (): Promise<void> => {
  try {
    app = initializeApp(firebaseConfig);
    
    // Initialize Auth with local persistence
    auth = getAuth(app);
    await setPersistence(auth, browserLocalPersistence);  // ❌ Too early
    
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app, 'europe-west3');
    
    // Connect to emulators AFTER persistence set ❌
    if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    }
    
    await enableIndexedDbPersistence(db);
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
};
```

### After:
```typescript
export const initializeFirebase = async (): Promise<void> => {
  try {
    app = initializeApp(firebaseConfig);
    
    // Initialize Auth (but DON'T configure persistence yet)
    auth = getAuth(app);
    
    // ✅ Connect to Auth emulator FIRST
    if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      console.log('🔧 Connected to Auth Emulator (9099)');
    }
    
    // ✅ NOW set persistence after emulator is connected
    await setPersistence(auth, browserLocalPersistence);
    
    db = getFirestore(app);
    storage = getStorage(app);
    functions = getFunctions(app, 'europe-west3');
    
    // Connect other emulators
    if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      connectFunctionsEmulator(functions, '127.0.0.1', 5001);
      console.log('🔧 Connected to Firestore (8080) and Functions (5001) Emulators');
    }
    
    await enableIndexedDbPersistence(db);
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
};
```

## Key Takeaways

### 1. **Order Matters**
When using Firebase emulators, you MUST:
1. Create the Auth instance
2. Connect to the emulator
3. THEN configure persistence

### 2. **Why This Happens on Refresh**
- First load: No localStorage data, so no restoration attempt
- Refresh: Auth token exists in localStorage → Auth tries to validate it immediately
- If emulator not connected yet → Uses production endpoint → Error

### 3. **Firebase Emulator Connection Rules**
From Firebase documentation:
> `connectAuthEmulator()` must be called before any other Auth operations (including automatic token restoration).

## Testing
After this fix:
1. ✅ First load works correctly
2. ✅ Page refresh works correctly
3. ✅ Auth state persists across refreshes
4. ✅ No production API calls in development
5. ✅ Emulator connection established before any auth operations

## Prevention
**Always follow this pattern when initializing Firebase with emulators:**

```typescript
// 1. Initialize app
const app = initializeApp(config);

// 2. Create service instances
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

// 3. Connect to emulators (BEFORE any operations)
if (isDevelopment) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}

// 4. Configure services (AFTER emulator connection)
await setPersistence(auth, browserLocalPersistence);
await enableIndexedDbPersistence(db);
```

## Related Issues
- Firebase Auth automatic token restoration
- Emulator configuration timing
- Development vs production environment switching

## Date Fixed
26 December 2025

## Files Modified
- `src/services/firebase.service.ts` - Reordered initialization steps
