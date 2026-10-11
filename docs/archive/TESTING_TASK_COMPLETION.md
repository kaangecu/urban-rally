# Task Completion Fix - Testing Guide

## Quick Test (1 minute)

1. **Login to the app** with your team code
2. **Select any photo/video task** (e.g., "Take a selfie with street art")
3. **Submit a photo or video**
4. **Wait for success message** (✅ "Task submitted successfully!")
5. **Return to task list** (click back or wait for auto-close)
6. **Verify the task now shows:**
   - ✅ Checkmark badge in top-right corner
   - ✅ Neon cyan glow (cyberpunk) or green border (ESN theme)
   - ✅ Reduced opacity (75%)
   - ✅ Button text changed to "View" instead of "Start"
   - ✅ Card is disabled (clicking does nothing or shows completed state)
7. **Check header:**
   - ✅ Score increased by task points
   - ✅ "X tasks completed" counter incremented

### Expected Result
✅ Task appears completed in UI within 1-2 seconds
✅ Cannot re-submit the task

### If It Fails
❌ Task still shows "Start" button → Real-time sync not working
❌ Can still click task → Check console for errors

---

## Detailed Test Scenarios

### Test 1: Normal Flow ✅
**Goal:** Verify task completion reflects in UI

1. Login to app
2. Navigate to "List View" or "Map View"
3. Click on an incomplete task (one without checkmark)
4. Complete the task (take photo/video or answer quiz)
5. Wait for "Task submitted successfully!" message
6. Return to task list

**Expected:**
- Task shows checkmark within 1-2 seconds
- Task visual style changes (glow, opacity, border)
- Button changes to "View"
- Score updates in header
- Completion counter updates

**Console logs to verify:**
```
[useTeamSync] Team data updated: {
  score: "0 → 100",
  completed: "0 → 1",
  newCompletedTasks: ["<taskId>"]
}
```

---

### Test 2: Duplicate Submission Attempt ✅
**Goal:** Verify friendly error message on re-submission

1. Complete a task (follow Test 1)
2. **Before UI updates**, quickly click the task again
3. Attempt to submit again

**Expected:**
- Shows message: "✅ You have already completed this task!"
- Shows success state (green background, not red error)
- Modal auto-closes after 2 seconds
- Task list shows task as completed

**Console logs:**
```
Error submitting photo: Error: Task already completed
```
(This is normal - caught and handled gracefully)

---

### Test 3: Multiple Tasks in Sequence ✅
**Goal:** Verify sync works for multiple completions

1. Complete Task A → Wait for UI update
2. Verify Task A shows completed
3. Complete Task B → Wait for UI update
4. Verify Task B shows completed
5. Verify both tasks remain completed
6. Verify score updated correctly (sum of both tasks)

**Expected:**
- Each task completion triggers sync
- UI updates independently for each task
- No race conditions
- Final state matches Firestore

---

### Test 4: Filter Behavior ✅
**Goal:** Verify completed tasks filter correctly

1. Complete 2-3 tasks
2. Click "Available" filter
3. Verify completed tasks hidden
4. Click "Completed" filter
5. Verify only completed tasks shown
6. Click "All" filter
7. Verify all tasks shown with correct states

**Expected:**
- "Available" shows only incomplete tasks
- "Completed" shows only completed tasks
- "All" shows all tasks with correct visual states
- Filters update immediately after task completion

---

### Test 5: Page Reload Persistence ✅
**Goal:** Verify completion state survives page reload

1. Complete 1-2 tasks
2. Wait for UI update
3. Hard refresh page (Cmd+R or F5)
4. Wait for app to load

**Expected:**
- Completed tasks still show checkmarks
- Score persists
- Completion counter correct
- Can't re-submit completed tasks

---

### Test 6: Multi-Device Sync 🌐
**Goal:** Verify real-time sync across devices

**Requirements:** 2 devices with same team logged in

1. **Device A:** Complete a task
2. **Device B:** Watch task list
3. Verify Device B shows task as completed within 1-2 seconds
4. **Device B:** Complete another task
5. **Device A:** Watch task list
6. Verify Device A shows new task as completed

**Expected:**
- Changes sync bidirectionally
- Delay: < 2 seconds typically
- Both devices show same state

---

### Test 7: Offline Behavior 🔌
**Goal:** Verify behavior when offline

1. Turn off internet connection
2. Try to complete a task
3. Should see error (can't upload photo/video)
4. Turn on internet connection
5. Complete the task again
6. Verify sync resumes

**Expected:**
- Offline: Upload fails gracefully
- Online: Submission succeeds
- Sync reconnects automatically

---

### Test 8: Different Task Types 📋
**Goal:** Verify all task types sync correctly

1. Complete a **photo task**
   - Take photo → Submit → Verify UI update
2. Complete a **video task**
   - Record video → Submit → Verify UI update
3. Complete a **text/quiz task**
   - Answer question → Submit → Verify UI update
4. Verify all three show as completed
5. Verify total score is sum of all task points

**Expected:**
- All task types trigger sync
- UI updates consistently
- No type-specific issues

---

## Console Debugging

### Expected Logs (Success)

```
[useTeamSync] Setting up real-time listener for team: abc123
🚀 startCapture called, task type: photo
📸 Photo captured, file size: 123456 bytes
📤 Uploading image: submissions/tenant1/event1/team1/task1
✅ Image uploaded successfully
✅ Submission created with ID: sub123
[useTeamSync] Team data updated: {
  score: "0 → 100",
  completed: "0 → 1",
  newCompletedTasks: ["task1"]
}
```

### Error Logs (Duplicate Submission)

```
Error submitting photo: Error: Task already completed
  at updateTeamScore (submission.service.ts:109)
  at createSubmission (submission.service.ts:80)
```
(This is caught and handled gracefully - shows success message)

### Error Logs (Real Issues)

```
❌ Firebase initialization failed: <error>
[useTeamSync] Error syncing team data: <error>
Error submitting photo: storage/unauthorized
```

---

## Firebase Console Verification

### Check Firestore

1. Open [Firebase Console](https://console.firebase.google.com)
2. Go to Firestore Database
3. Navigate to `teams/{teamId}`
4. Verify fields:
   ```json
   {
     "score": 100,
     "completedTaskIds": ["task1", "task2"],
     "updatedAt": "<timestamp>"
   }
   ```

### Check Storage

1. Go to Storage
2. Navigate to `submissions/{tenantId}/{eventId}/{teamId}/{taskId}/`
3. Verify uploaded files exist

### Check Submissions

1. Go to Firestore Database
2. Navigate to `submissions` collection
3. Find submissions with your teamId
4. Verify fields:
   ```json
   {
     "teamId": "team1",
     "taskId": "task1",
     "type": "photo",
     "photoUrls": ["https://..."],
     "points": 100,
     "status": "pending"
   }
   ```

---

## Performance Verification

### Check Network Tab (Browser DevTools)

1. Open DevTools → Network tab
2. Filter: `WS` (WebSocket)
3. Complete a task
4. Verify WebSocket message received (Firestore update)
5. Check timing: should be < 1 second

### Check Firestore Reads

1. Firebase Console → Firestore → Usage tab
2. Note current read count
3. Complete a task
4. Refresh usage page
5. Should see +2 reads:
   - 1 read from updateTeamScore (check if completed)
   - 1 read from onSnapshot (sync update)

---

## Common Issues & Solutions

### Issue 1: UI Not Updating
**Symptom:** Task submitted but still shows "Start"
**Debug:**
```bash
# Check console for logs
# Should see: [useTeamSync] Team data updated
```
**Solutions:**
- Ensure `useTeamSync()` called in App.tsx
- Check Firebase initialization in main.tsx
- Verify network connection
- Check browser console for errors

### Issue 2: "Task already completed" Error Shows as Red
**Symptom:** Duplicate submission shows error state
**Debug:**
```typescript
// Check TaskSubmission.tsx line ~95, ~140, ~200
// Should have duplicate check in catch block
```
**Solution:**
- Verify error handling code exists in all submission handlers
- Check error message matches exactly: "Task already completed"

### Issue 3: Multi-Device Sync Not Working
**Symptom:** Device B doesn't update when Device A completes task
**Debug:**
- Check both devices are logged in with same team
- Check both have internet connection
- Check Firebase console for WebSocket connections
**Solution:**
- Ensure both devices authenticated
- Check firestore.rules allow read access
- Verify team.id is same on both devices

### Issue 4: Listener Memory Leak
**Symptom:** Multiple listeners created, app slows down
**Debug:**
```bash
# Console should show:
[useTeamSync] Cleaning up listener for team: <old-id>
[useTeamSync] Setting up real-time listener for team: <new-id>
```
**Solution:**
- Ensure useTeamSync returns unsubscribe function
- Only call useTeamSync once (in App.tsx)
- Check dependency array: `[team?.id]`

---

## Success Criteria

✅ **All tests pass**
✅ **Console shows sync logs**
✅ **Firebase shows correct data**
✅ **No memory leaks**
✅ **Multi-device sync < 2 seconds**
✅ **Error messages are user-friendly**
✅ **UI always matches Firestore state**

---

## Next Steps After Testing

1. ✅ Verify all tests pass
2. ✅ Remove debug console.logs (optional, can keep for production debugging)
3. ✅ Test on multiple devices
4. ✅ Test with different team codes
5. ✅ Test with different task types
6. ✅ Proceed to GPS validation implementation
7. ✅ Proceed to real-time leaderboard

---

**Happy Testing! 🎉**

If you encounter any issues not covered here, check:
- Browser console logs
- Firebase Console (Firestore + Storage)
- Network tab (WebSocket connections)
- docs/TASK_COMPLETION_SYNC.md (detailed architecture)
