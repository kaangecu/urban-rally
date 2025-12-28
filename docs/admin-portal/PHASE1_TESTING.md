# Phase 1 Testing Guide

Quick reference for testing the Admin Portal authentication system.

## Prerequisites

1. **Firebase Emulators Running:**
   ```bash
   firebase emulators:start
   ```

2. **Vite Dev Server Running:**
   ```bash
   npm run dev
   ```

---

## Test 1: Create First Super Admin

### Step 1: Enable Email/Password Auth in Firebase Console (Production Only)
For emulator testing, this is already enabled.

### Step 2: Create Test User Account

**Option A: Via Emulator UI**
1. Open http://127.0.0.1:4000/auth
2. Click "Add user"
3. Enter email: `admin@test.com`
4. Enter password: `password123`
5. Click "Add user"
6. **Copy the UID** (will look like: `ABC123xyz456`)

**Option B: Via Application**
1. Open http://localhost:5173/admin/login
2. Note: You'll get an error because user doesn't have admin role yet
3. Create user via emulator UI instead (Option A)

### Step 3: Assign Super Admin Role

Run this command (replace [USER_UID] with actual UID):

```bash
curl -X POST http://127.0.0.1:5001/urban-rally-dev/europe-west3/setUserRole \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "uid": "[USER_UID]",
      "role": "superadmin",
      "tenantIds": [],
      "email": "admin@test.com",
      "displayName": "Test Admin"
    }
  }'
```

**Expected Response:**
```json
{
  "result": {
    "success": true,
    "message": "Role superadmin assigned successfully to user admin@test.com"
  }
}
```

### Step 4: Verify in Firestore

1. Open http://127.0.0.1:4000/firestore
2. Check `userProfiles` collection
3. Verify document exists with your UID
4. Verify fields: role = "superadmin", isActive = true
5. Check `auditLogs` collection
6. Verify log entry for setUserRole action

---

## Test 2: Admin Login Flow

### Step 1: Navigate to Login Page
```
http://localhost:5173/admin/login
```

**Expected:**
- Dark tactical theme (slate-900 background)
- "Admin Portal" heading with shield icon
- Email and password fields
- "Sign In" button
- "Back to Player App" link

### Step 2: Test Invalid Credentials

Try logging in with wrong password:
- Email: `admin@test.com`
- Password: `wrongpassword`

**Expected:**
- Error message: "Incorrect password. Please try again."
- Red error box below password field
- Form stays on page

### Step 3: Test Non-Admin Account

Create a regular user (no role):
1. Create user in emulator: player@test.com
2. Try logging in with those credentials

**Expected:**
- Login succeeds temporarily
- Then auto-logs out with error: "This account does not have admin privileges"

### Step 4: Successful Login

Login with super admin credentials:
- Email: `admin@test.com`
- Password: `password123`

**Expected:**
- Loading state: "Authenticating..."
- Redirect to `/admin` dashboard
- Dashboard loads successfully

---

## Test 3: Admin Dashboard

### Verify Dashboard Elements

**Expected to see:**

1. **Header:**
   - "Admin Dashboard" title
   - "Mission Control" subtitle
   - Logout button (top-right)

2. **Welcome Card:**
   - Avatar circle with first letter
   - "Welcome, Test Admin"
   - Green badge: "SUPERADMIN"
   - "All tenants access" text

3. **Quick Stats:**
   - Events: 0 (Coming in Phase 2)
   - Tasks: 0 (Coming in Phase 3)
   - Submissions: 0 (Coming in Phase 4)
   - All with pulsing status dots

4. **System Status:**
   - Authentication: Online (green)
   - Cloud Functions: Online (green)
   - Firestore: Online (green)

5. **Phase 1 Notice:**
   - Blue info box
   - "Phase 1 Complete ✅"
   - Description text

### Test Logout

1. Click "Logout" button
2. **Expected:**
   - Redirect to `/admin/login`
   - Admin state cleared
   - Can't access `/admin` without logging in again

---

## Test 4: Route Protection

### Test Unauthenticated Access

1. Logout or open incognito window
2. Try to access: `http://localhost:5173/admin`

**Expected:**
- Redirect to `/admin/login`
- Login page displays

### Test Insufficient Role

This test requires creating a moderator account:

```bash
# Create moderator (assumes you have another UID)
curl -X POST http://127.0.0.1:5001/urban-rally-dev/europe-west3/setUserRole \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "uid": "[MODERATOR_UID]",
      "role": "moderator",
      "tenantIds": ["esn-berlin"],
      "email": "moderator@test.com",
      "displayName": "Test Moderator"
    }
  }'
```

Then create a protected route (example for Phase 2):
```tsx
<Route path="/admin/events/create" element={
  <AdminRoute requiredRole="organizer">
    <EventCreate />
  </AdminRoute>
} />
```

Login as moderator and try to access `/admin/events/create`:

**Expected:**
- "Access Denied" screen
- "You need organizer role to access this page"
- "Current role: moderator"
- "Go Back" button

---

## Test 5: Custom Claims Verification

### Verify Claims in Browser Console

1. Login as admin
2. Open browser console (F12)
3. Run:
   ```javascript
   firebase.auth().currentUser.getIdTokenResult()
     .then(result => console.log(result.claims));
   ```

**Expected Output:**
```json
{
  "role": "superadmin",
  "tenantIds": [],
  "aud": "...",
  "auth_time": ...,
  "exp": ...,
  "iat": ...,
  "iss": "...",
  "sub": "...",
  "uid": "..."
}
```

### Verify useAdminAuth Hook

In browser console:
```javascript
// Check admin store state
JSON.parse(localStorage.getItem('admin-storage'))
```

**Expected:**
```json
{
  "state": {
    "adminProfile": {
      "uid": "...",
      "email": "admin@test.com",
      "displayName": "Test Admin",
      "role": "superadmin",
      "managedTenantIds": [],
      "isActive": true,
      ...
    },
    "selectedTenantId": null
  },
  "version": 0
}
```

---

## Test 6: Security Rules

### Test UserProfile Access

In browser console (logged in as admin):
```javascript
import { doc, getDoc } from 'firebase/firestore';
import { db } from './services/firebase.service';

// Try to read own profile (should work)
getDoc(doc(db, 'userProfiles', firebase.auth().currentUser.uid))
  .then(snap => console.log('✅ Own profile:', snap.data()))
  .catch(err => console.error('❌ Error:', err));

// Try to write to profile (should fail)
setDoc(doc(db, 'userProfiles', firebase.auth().currentUser.uid), {
  role: 'superadmin', // Attempting privilege escalation
  isActive: true
}, { merge: true })
  .then(() => console.log('❌ SECURITY BREACH: Write succeeded!'))
  .catch(err => console.log('✅ Write blocked:', err.code));
```

**Expected:**
- Read own profile: ✅ Success
- Write to profile: ✅ Blocked with "permission-denied"

### Test Audit Logs Access

```javascript
// Try to write audit log (should fail)
addDoc(collection(db, 'auditLogs'), {
  action: 'fake_action',
  performedBy: 'attacker'
})
  .then(() => console.log('❌ SECURITY BREACH: Write succeeded!'))
  .catch(err => console.log('✅ Write blocked:', err.code));

// Super admin should read logs (if any exist)
getDocs(query(collection(db, 'auditLogs')))
  .then(snap => console.log('✅ Audit logs count:', snap.size))
  .catch(err => console.error('❌ Error:', err));
```

**Expected:**
- Write: ✅ Blocked
- Read (super admin): ✅ Success

---

## Test 7: Persistence & Session

### Test Page Refresh

1. Login to admin dashboard
2. Refresh page (F5)

**Expected:**
- ✅ Still logged in
- ✅ Dashboard loads without redirect to login
- ✅ Admin profile persists from localStorage

### Test Cross-Tab

1. Login in Tab 1
2. Open new tab with `/admin`
3. **Expected:** Dashboard loads immediately (shared localStorage)

### Test Logout Cleanup

1. Login to admin dashboard
2. Open browser devtools → Application → Local Storage
3. Verify `admin-storage` key exists
4. Click Logout
5. **Expected:** `admin-storage` still exists but adminProfile cleared

---

## Common Issues & Fixes

### Issue: "Permission denied" when calling setUserRole

**Cause:** Emulator not running or wrong endpoint URL

**Fix:**
```bash
# Check emulators are running
firebase emulators:start

# Verify Functions emulator is at port 5001
curl http://127.0.0.1:5001
```

### Issue: "User not found" after setUserRole

**Cause:** User UID doesn't exist in Firebase Auth

**Fix:**
1. Open http://127.0.0.1:4000/auth
2. Verify user exists in list
3. Copy exact UID (case-sensitive)

### Issue: Login succeeds but dashboard shows "Access Denied"

**Cause:** Custom claims not set or not refreshed

**Fix:**
```javascript
// Force token refresh
await firebase.auth().currentUser.getIdToken(true);
window.location.reload();
```

### Issue: "Failed to load admin profile"

**Cause:** UserProfile document missing in Firestore

**Fix:**
1. Check http://127.0.0.1:4000/firestore
2. Verify `userProfiles/[UID]` exists
3. Re-run setUserRole if missing

---

## Success Criteria

✅ All tests pass without errors
✅ Security rules block unauthorized access
✅ Custom claims persist across refresh
✅ Admin dashboard renders correctly
✅ Logout clears state properly
✅ No TypeScript/console errors

---

## Next: Phase 2 Testing

Once Phase 2 is complete, test:
- Event creation flow
- Map bounds picker
- Event code generation
- Event activation toggle
- Event list pagination

Refer to `docs/admin-portal/PHASE2_TESTING.md` (coming soon)
