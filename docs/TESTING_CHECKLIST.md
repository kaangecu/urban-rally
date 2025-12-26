# AuthProvider Testing Checklist

## Quick Test Suite

### ✅ Test 1: User Creation (Happy Path)

**Steps:**
1. Open incognito/private window
2. Navigate to: `http://localhost:5173`
3. Click "Join with Event Code" or browse teams
4. Fill in: First Name, Last Name, Email (optional)
5. Accept terms
6. Click "Join Team"

**Expected Console Logs:**
```
🔒 Auth listener disabled (state: creating)
🔐 Creating anonymous auth user...
✅ Auth user created, UID: abc123xyz
⏭️  Auth listener skipped - user creation in progress
☁️ Calling Cloud Function to create user document...
✅ Cloud Function response: {success: true, userId: 'abc123xyz', user: {...}}
✅ User created successfully
🔓 Auth listener enabled (state: authenticated)
```

**Success Criteria:**
- ✅ No "User signed out" message
- ✅ No "Missing or insufficient permissions" error
- ✅ User redirected to Dashboard
- ✅ No page reload or logout

---

### ✅ Test 2: Session Restoration (Page Refresh)

**Steps:**
1. After Test 1 succeeds (user logged in)
2. Refresh the page (F5 or Cmd+R)
3. Check console logs

**Expected Console Logs:**
```
🔵 Auth listener initialized
🔄 Restoring session for user: abc123xyz
✅ Session restored for team: Team Alpha
```

**Success Criteria:**
- ✅ User stays logged in
- ✅ Team and tenant restored
- ✅ Dashboard loads immediately
- ✅ No re-authentication needed

---

### ✅ Test 3: Multiple Teams (If Applicable)

**Steps:**
1. Join a second team (different event)
2. Switch between events
3. Refresh page

**Expected:**
- ✅ Last viewed team/event restored
- ✅ No auth errors
- ✅ Team switching works smoothly

---

### ✅ Test 4: Logout and Re-login

**Steps:**
1. Click logout (if you have a logout button)
2. Log in again

**Expected Console Logs:**
```
🔴 User signed out, clearing state
[... logout complete ...]
🔒 Auth listener disabled (state: creating)
[... login process ...]
🔓 Auth listener enabled (state: authenticated)
```

**Success Criteria:**
- ✅ Clean logout
- ✅ Re-login works without errors
- ✅ No stale state

---

### ✅ Test 5: Error Handling (Network Issues)

**Steps:**
1. Open DevTools → Network tab
2. Set throttling to "Offline"
3. Try to create a user
4. Check error state

**Expected:**
- ✅ Error message shown to user
- ✅ Auth state set to 'error'
- ✅ App doesn't crash

**Console Logs:**
```
🔒 Auth listener disabled (state: creating)
❌ Error creating user: Network error
⚠️  Auth state set to error
```

---

### ✅ Test 6: Race Condition (Eliminated)

**This test verifies the race condition is gone.**

**Steps:**
1. Open DevTools → Network tab
2. Set throttling to "Slow 3G"
3. Create a new user (incognito)
4. Watch console logs carefully

**What to Look For:**
- ✅ Auth listener skips while creating: `⏭️  Auth listener skipped - user creation in progress`
- ✅ NO "Firebase user exists but no Firestore document" error
- ✅ NO logout during creation
- ✅ User creation completes successfully (even if slow)

**This Proves:**
The auth listener is properly gated by the state machine and doesn't interfere with user creation, regardless of timing.

---

### ✅ Test 7: Concurrent Users (Multiple Tabs)

**Steps:**
1. Open 2 tabs with your app
2. In Tab 1: Join team as User A
3. In Tab 2: Join team as User B
4. Switch between tabs

**Expected:**
- ✅ Each tab maintains its own auth state
- ✅ No cross-contamination
- ✅ Both users can create accounts

---

## Test Results Template

Copy this and fill in after testing:

```
## Test Results - [Date]

### Environment
- Browser: [Chrome/Firefox/Safari]
- OS: [macOS/Windows/Linux]
- Network: [Fast/Slow/Offline]

### Test 1: User Creation
- Status: [ ] PASS [ ] FAIL
- Notes: 

### Test 2: Session Restoration
- Status: [ ] PASS [ ] FAIL
- Notes: 

### Test 3: Multiple Teams
- Status: [ ] PASS [ ] FAIL [ ] N/A
- Notes: 

### Test 4: Logout/Re-login
- Status: [ ] PASS [ ] FAIL
- Notes: 

### Test 5: Error Handling
- Status: [ ] PASS [ ] FAIL
- Notes: 

### Test 6: Race Condition
- Status: [ ] PASS [ ] FAIL
- Notes: 

### Test 7: Concurrent Users
- Status: [ ] PASS [ ] FAIL [ ] N/A
- Notes: 

### Overall Status
- [ ] All tests passed ✅
- [ ] Some tests failed ⚠️
- [ ] Major issues found ❌

### Issues Found
1. 
2. 
3. 

### Next Steps
- 
```

---

## Debugging Failed Tests

### If User Creation Fails

1. **Check AuthProvider is wrapping app:**
   ```typescript
   // src/AppRoutes.tsx
   return (
     <AuthProvider> {/* ← Must be here */}
       <BrowserRouter>...</BrowserRouter>
     </AuthProvider>
   );
   ```

2. **Check setAuthState is passed:**
   ```typescript
   // src/components/auth/IdentityUplinkModal.tsx
   const { setAuthState } = useAuth();
   const user = await createUser(data, setAuthState); // ← Must pass it
   ```

3. **Check console for state transitions:**
   Should see: `creating` → `authenticated`
   NOT: `creating` → `error`

### If Session Restoration Fails

1. **Check localStorage:**
   ```javascript
   // In browser console
   console.log(localStorage.getItem('urban-rally-auth'));
   ```
   Should have: `{user: {...}, team: {...}, tenant: {...}}`

2. **Check auth listener initialized:**
   Should see: `🔵 Auth listener initialized` on page load

3. **Check Firebase Auth persists:**
   ```javascript
   // In browser console
   import { getAuth } from 'firebase/auth';
   console.log(getAuth().currentUser);
   ```

### If Race Condition Still Occurs

1. **Verify auth state during creation:**
   Add this to `AuthContext.tsx`:
   ```typescript
   console.log('Current auth state:', authState);
   ```

2. **Check listener actually skips:**
   Should see: `⏭️  Auth listener skipped - user creation in progress`

3. **Verify state transitions:**
   ```
   idle → creating → authenticated
   NOT: idle → creating → restoring (wrong!)
   ```

---

## Performance Benchmarks

Expected timing (from logs):

```
T+0ms:   User clicks "Join Team"
T+1ms:   setAuthState('creating')
T+50ms:  signInAnonymously() starts
T+200ms: signInAnonymously() completes
T+201ms: Auth listener fires → SKIPS (state: creating)
T+250ms: Cloud Function called
T+700ms: Cloud Function completes
T+701ms: setUser() called
T+702ms: setAuthState('authenticated')
T+703ms: Auth listener re-enabled
T+750ms: Redirect to Dashboard

Total: ~750ms
```

**If you're seeing >2 seconds, something is wrong!**

---

## Success Indicators

You know it's working when:

1. ✅ Console shows state transitions clearly
2. ✅ No "User signed out" during creation
3. ✅ No "Missing or insufficient permissions" errors
4. ✅ No page reloads or flashing
5. ✅ User creation < 1 second on good network
6. ✅ Page refresh restores session instantly

---

## Common Issues

### Issue: "useAuth must be used within AuthProvider"

**Solution:**
```typescript
// Make sure AuthProvider wraps your app
<AuthProvider>
  <YourApp />
</AuthProvider>
```

### Issue: "Auth listener not skipping during creation"

**Solution:**
Check that `setAuthState('creating')` is called BEFORE `signInAnonymously()`

### Issue: "User still getting logged out"

**Solution:**
1. Check old `useFirebaseAuthListener` is NOT being called
2. Verify AuthProvider is the ONLY auth listener
3. Clear browser cache and try again

---

## When to Consider Test Complete

Mark this feature as **READY** when:

- [x] All 7 tests pass
- [x] No console errors
- [x] Fast user creation (<1s)
- [x] Session restoration works
- [x] No race conditions observed

Then you can:
1. Remove old `useFirebaseAuthListener.ts` file (optional)
2. Update user documentation
3. Deploy to staging
4. Test in production

---

## Contact / Support

If tests fail consistently:

1. Share console logs (full output)
2. Share test results template (filled)
3. Note your environment (browser, OS, network)
4. Share any error messages

The state machine should make debugging much easier because you can see exactly which state the app is in at any time.

Good luck testing! 🚀
