# CORS Fix for Cloud Functions

## Issue

**Error:**
```
Access to fetch at 'https://europe-west3-urban-rally-539bd.cloudfunctions.net/getTeamMembersSecure' 
from origin 'http://localhost:5173' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

**Root Cause:**
Firebase Cloud Functions (2nd Gen) using `onCall` require explicit CORS configuration. Without it, browser requests are blocked due to same-origin policy.

---

## Solution

Added `{cors: true}` option to all Cloud Functions.

### Before (Broken):
```typescript
export const getTeamMembersSecure = onCall(async (request) => {
  // ❌ No CORS configuration = blocked by browser
});
```

### After (Fixed):
```typescript
export const getTeamMembersSecure = onCall(
  {cors: true}, // ✅ Enable CORS for all origins
  async (request) => {
    // Function code
  }
);
```

---

## Changes Made

### 1. createUserDocument ✅
```typescript
export const createUserDocument = onCall(
  {cors: true},
  async (request) => { ... }
);
```

### 2. joinTeamSecure ✅
```typescript
export const joinTeamSecure = onCall(
  {cors: true},
  async (request) => { ... }
);
```

### 3. getTeamMembersSecure ✅
```typescript
export const getTeamMembersSecure = onCall(
  {cors: true},
  async (request) => { ... }
);
```

---

## What `{cors: true}` Does

**Enables CORS for all origins:**
- Adds `Access-Control-Allow-Origin: *` header
- Handles OPTIONS preflight requests automatically
- Allows requests from:
  - `localhost` (development)
  - Firebase Hosting domains (production)
  - Any other authorized origin

**Security:**
- Authentication still required (`auth.uid` check)
- CORS only controls browser access, not API security
- Firebase authentication tokens validate requests

---

## Testing

### After Deployment:

1. **Refresh Browser** (clear cache if needed)
2. **Navigate to Team Members Tab**
3. **Verify:**
   - NO CORS errors in console ✅
   - Team members load successfully ✅
   - No `net::ERR_FAILED` errors ✅

### Expected Console Logs:

**Success:**
```
✅ Team members fetched successfully
```

**No More:**
```
❌ Access to fetch ... has been blocked by CORS policy
```

---

## Why This Happens

**Browser Same-Origin Policy:**
- Browser at `http://localhost:5173`
- Function at `https://europe-west3-urban-rally-539bd.cloudfunctions.net`
- Different origins = CORS check required

**Preflight Request:**
1. Browser sends OPTIONS request first
2. Checks if server allows cross-origin requests
3. If allowed, sends actual POST request
4. If not allowed, blocks request with CORS error

**Firebase 2nd Gen Functions:**
- Don't auto-enable CORS (unlike 1st Gen)
- Must explicitly add `{cors: true}` option
- Or implement custom CORS headers

---

## Alternative Solutions (Not Used)

### Option 1: Specific Origins
```typescript
export const getTeamMembersSecure = onCall(
  {
    cors: {
      origin: ['https://yourdomain.com', 'http://localhost:5173']
    }
  },
  async (request) => { ... }
);
```

**Pros:** More secure (limited origins)
**Cons:** Must update for each new domain

### Option 2: Custom CORS Headers (1st Gen)
```typescript
import * as cors from 'cors';
const corsHandler = cors({origin: true});

export const myFunction = functions.https.onRequest((req, res) => {
  corsHandler(req, res, () => {
    // Function code
  });
});
```

**Pros:** Full control over CORS
**Cons:** More complex, 2nd Gen uses onCall differently

---

## Deployment Status

✅ **Committed:** `1a81968 - fix: add CORS configuration to Cloud Functions`
⏳ **Deploying:** All three functions being updated
🎯 **ETA:** ~2-3 minutes

---

## Verification Steps

Once deployment completes:

1. **Clear browser cache** (Ctrl+Shift+Delete or Cmd+Shift+Delete)
2. **Hard reload page** (Ctrl+Shift+R or Cmd+Shift+R)
3. **Navigate to Dashboard → Team view**
4. **Check console:**
   - Should see "Team members fetched successfully"
   - Should NOT see CORS errors
5. **Verify team members display**

---

## If Still Having Issues

### Check Deployment Status:
```bash
firebase functions:list
```

Should show:
- createUserDocument (active)
- joinTeamSecure (active)
- getTeamMembersSecure (active)

### Check Function Logs:
```bash
firebase functions:log --only getTeamMembersSecure
```

### Test Direct Call:
```javascript
// In browser console
const functions = getFunctions(app, 'europe-west3');
const fn = httpsCallable(functions, 'getTeamMembersSecure');
fn({ teamId: 'YOUR_TEAM_ID' }).then(console.log);
```

---

## Related Files

- `functions/src/index.ts` - All Cloud Functions with CORS enabled
- `src/services/teamMember.service.ts` - Client-side function calls

---

## Summary

✅ **Problem:** CORS blocking Cloud Function requests from browser
✅ **Solution:** Added `{cors: true}` to all `onCall` functions
✅ **Status:** Deploying now, will work after deployment completes

Team members feature should load without CORS errors once deployment finishes! 🎉
