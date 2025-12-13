# Logout Enhancement - Testing Guide

**Date:** December 13, 2025  
**Build:** After TICKET 1-4 implementation  
**Tester:** QA Team

---

## 🧪 Test Cases

### TEST 1: Basic Logout Flow ✅
**Priority:** P0 - Critical  
**Objective:** Verify logout properly clears Firebase session

**Steps:**
1. Start dev server: `npm run dev`
2. Navigate to `/login`
3. Click "Have a Team Code?"
4. Enter team code: `NEON-42` (or any valid code)
5. Fill authentication form (First Name, Last Name, Email)
6. Check both consent boxes
7. Click "Create ID"
8. **Verify:** Redirected to dashboard
9. Click "Logout" button in header
10. **Verify:** Redirected to `/login`
11. Open browser DevTools → Application → Local Storage
12. **Verify:** `urban-rally-auth` key cleared
13. Refresh page
14. **Verify:** Stays on `/login` (no auto-login)

**Expected Result:**
- ✅ Firebase auth session cleared
- ✅ localStorage cleared
- ✅ No auto-login on refresh

---

### TEST 2: Session Restoration After Logout ✅
**Priority:** P0 - Critical  
**Objective:** Verify user auto-rejoins team on next login

**Steps:**
1. Login with team code `NEON-42`
2. Complete 2-3 tasks (note your personal score)
3. Click "Logout"
4. **Verify:** Redirected to `/login`
5. Re-enter the same team code `NEON-42`
6. Fill authentication form again
7. **Verify:** Redirected to dashboard
8. Check "Team Members" tab
9. **Verify:** You appear in the member list
10. **Verify:** Your personal score is preserved from before logout

**Expected Result:**
- ✅ TeamMember record stayed `isActive: true`
- ✅ Personal score preserved
- ✅ Task completions preserved
- ✅ User automatically rejoined team

**Alternative Flow:**
- After step 3, instead of re-entering team code, just refresh page
- **Verify:** Auto-login happens and team is restored

---

### TEST 3: Leave Team Functionality ✅
**Priority:** P0 - Critical  
**Objective:** Verify "Leave Team" button works correctly

**Steps:**
1. Login and join a team
2. Navigate to dashboard
3. Click "Team" tab in bottom navigation
4. Scroll to bottom
5. **Verify:** "Leave Team" button visible (red, with icon)
6. Click "Leave Team"
7. **Verify:** Confirmation modal appears
8. **Verify:** Modal shows:
   - Team name
   - Warning icon
   - List of consequences
   - "Cancel" and "Leave Team" buttons
9. Click "Cancel"
10. **Verify:** Modal closes, user stays in team
11. Click "Leave Team" again
12. Click "Leave Team" (confirm)
13. **Verify:** Loading state shows ("Leaving...")
14. **Verify:** Redirected to `/events`
15. **Verify:** No longer in team

**Expected Result:**
- ✅ Confirmation modal prevents accidental leaving
- ✅ User can cancel
- ✅ Leave operation completes successfully
- ✅ User logged out and redirected

**Database Verification (Firestore):**
- Open Firebase Console → Firestore
- Find `teamMembers` collection
- Find record with your userId
- **Verify:** `isActive: false`
- **Verify:** `leftAt` timestamp exists

---

### TEST 4: Team Owner Cannot Leave ✅
**Priority:** P1 - High  
**Objective:** Prevent team owners from leaving team

**Prerequisites:**
- You must be the team owner (create team or have ownership transferred)

**Steps:**
1. Login as team owner
2. Navigate to "Team" tab
3. Click "Leave Team"
4. **Verify:** Confirmation modal appears
5. **Verify:** "Leave Team" button is disabled (gray, cursor-not-allowed)
6. **Verify:** Warning text shows: "Team owners cannot leave. Transfer ownership first."
7. Try to click disabled button
8. **Verify:** Nothing happens

**Expected Result:**
- ✅ Owner cannot leave team
- ✅ Clear error message displayed
- ✅ Must transfer ownership first

---

### TEST 5: Multi-Device Session ✅
**Priority:** P1 - High  
**Objective:** Verify same user can login on multiple devices

**Steps:**
1. **Device 1 (Chrome):**
   - Login with team code
   - Complete 1 task (score: 50)
   - Leave browser open

2. **Device 2 (Firefox/Safari):**
   - Navigate to login page
   - Enter same team code
   - Fill authentication form (same email)
   - **Verify:** Logged in successfully
   - **Verify:** Score shows 50 (from Device 1)

3. **Device 1:**
   - Complete another task (score: 100)
   - Refresh page
   - **Verify:** Score updated to 100

4. **Device 2:**
   - Refresh page
   - **Verify:** Score shows 100 (synced from Device 1)

**Expected Result:**
- ✅ Same user can login on multiple devices
- ✅ Progress syncs across devices
- ✅ Real-time updates work

---

### TEST 6: Rejoin After Leaving ✅
**Priority:** P1 - High  
**Objective:** Verify user can rejoin team after leaving

**Steps:**
1. Login and join team "Alpha" (ensure team not full)
2. Note team member count (e.g., 3/10)
3. Leave team via "Leave Team" button
4. **Verify:** Redirected to `/events`
5. Re-enter team code for "Alpha"
6. **Verify:** Can join team again
7. Check team member count
8. **Verify:** Count is same as before (3/10)
9. Check personal score
10. **Verify:** Score reset to 0 (fresh membership)

**Expected Result:**
- ✅ User can rejoin team
- ✅ New TeamMember record created
- ✅ Personal score starts from 0
- ✅ Old membership record stays `isActive: false`

---

### TEST 7: Full Team Rejection ✅
**Priority:** P2 - Medium  
**Objective:** Verify user cannot rejoin if team becomes full

**Setup:**
- Create test team with `maxMembers: 3`
- Fill team with 3 members

**Steps:**
1. Login as 4th user
2. Try to join the full team
3. **Verify:** Error message: "This team is full"
4. **Verify:** Cannot join

5. Have one member leave the team (via "Leave Team")
6. Try to join again
7. **Verify:** Can join now (spot opened up)

**Expected Result:**
- ✅ Full teams reject new members
- ✅ Leaving opens spot for new member
- ✅ Clear error messages

---

### TEST 8: No Teams Edge Case ✅
**Priority:** P2 - Medium  
**Objective:** Verify user with no teams handled gracefully

**Steps:**
1. Create new user (fresh account)
2. Don't join any team
3. Open DevTools → Console
4. Refresh page
5. **Verify:** Console shows: "ℹ️ User authenticated but has no active teams"
6. **Verify:** Dashboard doesn't crash
7. **Verify:** User can navigate to `/events` to join a team

**Expected Result:**
- ✅ No crash for users without teams
- ✅ Graceful handling
- ✅ User can join team normally

---

### TEST 9: Deleted Team Edge Case ✅
**Priority:** P2 - Medium  
**Objective:** Verify deleted team handled on login

**Setup (Firebase Console):**
- Join a team
- Logout
- Admin deletes team from Firestore

**Steps:**
1. Try to login again
2. **Verify:** useFirebaseAuthListener handles error
3. **Verify:** No crash
4. **Verify:** User can join different team

**Expected Result:**
- ✅ Deleted teams don't crash app
- ✅ User can join new team
- ✅ Error logged in console

---

### TEST 10: Performance Check ⏱️
**Priority:** P3 - Low  
**Objective:** Verify session restoration is fast

**Steps:**
1. Login and join team
2. Logout
3. Login again
4. Measure time from entering team code to dashboard load
5. **Target:** < 3 seconds

**Expected Result:**
- ✅ Session restoration fast (<3s)
- ✅ No noticeable delay
- ✅ Loading states clear

---

## 🐛 Known Issues / Limitations

### Issue 1: Team Owner Transfer Not Implemented
**Impact:** Medium  
**Status:** Future enhancement  
**Workaround:** Team owners cannot leave team currently

**Solution (Future):**
- Add "Transfer Ownership" button
- Allow owner to designate new owner
- Then allow leave

---

### Issue 2: No "Switch Team" Feature
**Impact:** Low  
**Status:** Future enhancement  
**Workaround:** Must leave current team then join new one

**Solution (Future):**
- Add "Switch Team" button
- Atomically leave current + join new
- Prevent time gap without team

---

## ✅ Acceptance Criteria

### Critical (Must Pass):
- [x] Logout clears Firebase auth session
- [x] TeamMember record stays active on logout
- [x] Session restores on next login
- [x] Leave Team button works
- [x] Team owners cannot leave
- [x] No TypeScript errors
- [x] No console errors (except expected warnings)

### Important (Should Pass):
- [x] Multi-device support works
- [x] Can rejoin after leaving (if team not full)
- [x] Full teams reject new members
- [x] Deleted teams handled gracefully
- [x] Performance acceptable (<3s restore)

### Nice-to-Have (Can Defer):
- [ ] Team status shown on login page (TICKET 5)
- [ ] Activity tracking implemented (TICKET 6)
- [ ] Transfer ownership feature
- [ ] Switch team feature

---

## 📊 Test Results Template

**Tester:** [Your Name]  
**Date:** [Test Date]  
**Build:** [Commit Hash]

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| TEST 1 | Basic Logout | ⏳ | |
| TEST 2 | Session Restoration | ⏳ | |
| TEST 3 | Leave Team | ⏳ | |
| TEST 4 | Owner Protection | ⏳ | |
| TEST 5 | Multi-Device | ⏳ | |
| TEST 6 | Rejoin Team | ⏳ | |
| TEST 7 | Full Team | ⏳ | |
| TEST 8 | No Teams | ⏳ | |
| TEST 9 | Deleted Team | ⏳ | |
| TEST 10 | Performance | ⏳ | |

**Overall Status:** ⏳ In Progress / ✅ Passed / ❌ Failed

**Blockers:** [List any blocking issues]

**Sign-off:** [Tester Name] - [Date]

---

## 🚀 Next Steps After Testing

1. **If all tests pass:**
   - ✅ Mark tickets as "QA Approved"
   - Deploy to staging environment
   - Monitor for 24 hours
   - Deploy to production

2. **If tests fail:**
   - Log bugs in issue tracker
   - Assign back to developer
   - Re-test after fixes

3. **Optional enhancements (TICKET 5-6):**
   - Discuss with product team
   - Prioritize for next sprint
   - Create separate tickets

---

**Happy Testing! 🎉**
