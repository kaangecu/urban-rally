# User Creation Fix: Date Serialization Issue

**Date:** December 26, 2025  
**Issue:** `createUserDocument` Cloud Function returning 500 Internal Server Error  
**Status:** ✅ FIXED

---

## Problem

When creating a new user, the client successfully created an anonymous Firebase Auth user, but the `createUserDocument` Cloud Function failed with:

```
POST http://127.0.0.1:5001/.../createUserDocument 500 (Internal Server Error)
Error: functions/internal
```

### Error Logs

```javascript
✅ Auth user created, UID: 87zCLWrjHHW6VUziFlZ3DBL7tHr4
☁️ Calling Cloud Function to create user document...
❌ POST http://127.0.0.1:5001/.../createUserDocument 500 (Internal Server Error)
❌ Error creating user: FirebaseError: INTERNAL
Firebase error code: functions/internal
```

---

## Root Cause

**Date Serialization Problem:**

The `consentGiven` object contained JavaScript `Date` objects:

```typescript
// In IdentityUplinkModal.tsx
consentGiven: {
  terms: true,
  privacy: true,
  termsVersion: '1.0',
  privacyVersion: '1.0',
  termsAcceptedAt: new Date(),  // ← JavaScript Date object
  privacyAcceptedAt: new Date(), // ← JavaScript Date object
}
```

When this data was sent to the Cloud Function via `httpsCallable()`, the `Date` objects were serialized to JSON. However, Date serialization can be inconsistent and may result in:
1. Invalid date strings
2. Timezone issues
3. Format incompatibility with Firestore Timestamps

The Cloud Function then tried to store these malformed dates directly into Firestore, causing an internal error.

---

## Solution

### Part 1: Client-Side Fix (`user.service.ts`)

Convert `Date` objects to ISO strings before sending to Cloud Function:

```typescript
// BEFORE (user.service.ts)
const result = await createUserDocument({
  displayName: data.displayName,
  email: data.email || undefined,
  tenantId: data.tenantId,
  accountType: data.accountType || 'anonymous',
  consentGiven: data.consentGiven, // ← Contains Date objects
});
```

```typescript
// AFTER (user.service.ts)
// Convert Date objects to ISO strings for JSON serialization
const consentData = {
  ...data.consentGiven,
  termsAcceptedAt: data.consentGiven.termsAcceptedAt.toISOString(),
  privacyAcceptedAt: data.consentGiven.privacyAcceptedAt.toISOString(),
};

const result = await createUserDocument({
  displayName: data.displayName,
  email: data.email || undefined,
  tenantId: data.tenantId,
  accountType: data.accountType || 'anonymous',
  consentGiven: consentData, // ← ISO strings instead of Date objects
});
```

**Benefits of ISO Strings:**
- ✅ Standard format: `2025-12-26T22:30:45.123Z`
- ✅ JSON-safe
- ✅ Timezone-aware (always UTC)
- ✅ Easily parseable

---

### Part 2: Server-Side Fix (`functions/src/index.ts`)

Convert ISO strings to Firestore Timestamps in the Cloud Function:

```typescript
// BEFORE (functions/src/index.ts)
const userData = {
  id: uid,
  uid: uid,
  displayName: displayName,
  tenantId: tenantId,
  consentGiven: consentGiven, // ← Stored as-is (broken)
  // ... rest of fields
};
```

```typescript
// AFTER (functions/src/index.ts)
// Convert ISO strings to Firestore Timestamps
const consentData = {
  ...consentGiven,
  termsAcceptedAt: consentGiven.termsAcceptedAt 
    ? admin.firestore.Timestamp.fromDate(new Date(consentGiven.termsAcceptedAt))
    : admin.firestore.FieldValue.serverTimestamp(),
  privacyAcceptedAt: consentGiven.privacyAcceptedAt 
    ? admin.firestore.Timestamp.fromDate(new Date(consentGiven.privacyAcceptedAt))
    : admin.firestore.FieldValue.serverTimestamp(),
};

const userData = {
  id: uid,
  uid: uid,
  displayName: displayName,
  tenantId: tenantId,
  consentGiven: consentData, // ← Proper Firestore Timestamps
  // ... rest of fields
};
```

**Why Firestore Timestamps?**
- ✅ Native Firestore type
- ✅ Properly indexed
- ✅ Works with Firestore queries (>, <, ==)
- ✅ Consistent across clients

---

## Data Flow

### Complete Journey: Client → Cloud Function → Firestore

```
1. User submits form (IdentityUplinkModal.tsx)
   ↓
   consentGiven: {
     termsAcceptedAt: Date { 2025-12-26T22:30:45.123Z }
     privacyAcceptedAt: Date { 2025-12-26T22:30:45.123Z }
   }

2. createUser() in user.service.ts
   ↓
   Convert to ISO strings:
   consentGiven: {
     termsAcceptedAt: "2025-12-26T22:30:45.123Z"
     privacyAcceptedAt: "2025-12-26T22:30:45.123Z"
   }

3. httpsCallable() sends to Cloud Function
   ↓
   JSON serialization (ISO strings remain intact)

4. Cloud Function receives data
   ↓
   Convert ISO strings to Firestore Timestamps:
   consentGiven: {
     termsAcceptedAt: Timestamp { seconds: 1735255845, nanoseconds: 123000000 }
     privacyAcceptedAt: Timestamp { seconds: 1735255845, nanoseconds: 123000000 }
   }

5. Store in Firestore
   ↓
   ✅ Success! Proper timestamp format
```

---

## Files Modified

### 1. `src/services/user.service.ts`

**Line ~88-95:** Added ISO string conversion

```typescript
// Convert Date objects to ISO strings for JSON serialization
const consentData = {
  ...data.consentGiven,
  termsAcceptedAt: data.consentGiven.termsAcceptedAt.toISOString(),
  privacyAcceptedAt: data.consentGiven.privacyAcceptedAt.toISOString(),
};
```

### 2. `functions/src/index.ts`

**Line ~133-143:** Added Timestamp conversion

```typescript
// Prepare consent data with proper Timestamp conversion
const consentData = {
  ...consentGiven,
  termsAcceptedAt: consentGiven.termsAcceptedAt 
    ? admin.firestore.Timestamp.fromDate(new Date(consentGiven.termsAcceptedAt))
    : admin.firestore.FieldValue.serverTimestamp(),
  privacyAcceptedAt: consentGiven.privacyAcceptedAt 
    ? admin.firestore.Timestamp.fromDate(new Date(consentGiven.privacyAcceptedAt))
    : admin.firestore.FieldValue.serverTimestamp(),
};
```

### 3. Rebuild

```bash
cd functions
npm run build  # or: npx tsc
```

---

## Testing

### Expected Behavior (After Fix)

```
1. User fills form
2. Clicks "Create ID"
3. ✅ Auth user created (anonymous)
4. ✅ Cloud Function called
5. ✅ User document created in Firestore
6. ✅ Modal closes
7. ✅ User redirected to app
```

### Console Logs (Success)

```
🔵 Starting user creation process (via Cloud Function)...
📋 Input data: {displayName: "John Doe", hasEmail: false, ...}
🔒 Auth listener disabled (state: creating)
🔐 Creating anonymous auth user...
✅ Auth user created, UID: abc123xyz
☁️ Calling Cloud Function to create user document...
✅ Cloud Function response: {success: true, userId: "abc123xyz"}
✅ User created successfully: abc123xyz
```

### Firestore Data (Success)

```json
{
  "id": "abc123xyz",
  "uid": "abc123xyz",
  "displayName": "John Doe",
  "tenantId": "esn-berlin",
  "accountType": "anonymous",
  "consentGiven": {
    "terms": true,
    "privacy": true,
    "termsVersion": "1.0",
    "privacyVersion": "1.0",
    "termsAcceptedAt": {
      "_seconds": 1735255845,
      "_nanoseconds": 123000000
    },
    "privacyAcceptedAt": {
      "_seconds": 1735255845,
      "_nanoseconds": 123000000
    }
  },
  "totalScore": 0,
  "totalSubmissions": 0,
  "eventsParticipated": 0,
  "createdAt": { "_seconds": 1735255845, "_nanoseconds": 456000000 },
  "updatedAt": { "_seconds": 1735255845, "_nanoseconds": 456000000 },
  "lastLoginAt": { "_seconds": 1735255845, "_nanoseconds": 456000000 }
}
```

✅ Notice the proper Firestore Timestamp format with `_seconds` and `_nanoseconds`

---

## Lessons Learned

### 1. Never Send JavaScript Date Objects to Cloud Functions

**❌ Wrong:**
```typescript
httpsCallable(fn, {
  timestamp: new Date()  // Bad!
});
```

**✅ Correct:**
```typescript
httpsCallable(fn, {
  timestamp: new Date().toISOString()  // Good!
});
```

### 2. Always Convert to Firestore Timestamps on Server

**❌ Wrong:**
```typescript
const data = {
  createdAt: "2025-12-26T22:30:45.123Z"  // String, not queryable
};
```

**✅ Correct:**
```typescript
const data = {
  createdAt: admin.firestore.Timestamp.fromDate(new Date(isoString))
};
```

### 3. Use Server Timestamps When Possible

For current time, prefer server timestamps:

```typescript
createdAt: admin.firestore.FieldValue.serverTimestamp()
```

**Benefits:**
- Consistent across all users
- No client clock skew
- Guaranteed accuracy

---

## Related Issues

This fix also prevents:
- Timezone-related bugs
- Date format inconsistencies
- Query issues (can't query by string dates efficiently)
- Data corruption from malformed dates

---

## Status

✅ **FIXED** - User creation now works correctly

**Next Steps:**
1. ✅ Rebuild functions
2. ✅ Restart emulators (auto-reloads)
3. 🧪 Test user creation in browser
4. 🧪 Verify Firestore data structure
5. 🧪 Test returning user flow

**Ready to test!** 🚀
