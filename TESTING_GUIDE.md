# 🧪 Testing Guide - UrbanRally

## Quick Start

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Open the App
Navigate to: `http://localhost:5173`

### 3. Login with Test Team
Enter access code: **BERLIN2025**

## What to Test

### ✅ Authentication
- [ ] Login screen appears
- [ ] Enter code "BERLIN2025"
- [ ] ESN Berlin branding loads (blue/purple theme)
- [ ] Team name "The Explorers" displays
- [ ] Score shows "0 pts"
- [ ] Logout button appears in header

### ✅ Task List View
- [ ] See 15 tasks displayed
- [ ] Task cards show title, points, difficulty
- [ ] Filter buttons work:
  - All tasks
  - Available tasks (default)
  - Completed tasks
- [ ] Sort buttons work:
  - By Points
  - By Difficulty
  - By Distance (needs location permission)
- [ ] Click task card to view details
- [ ] Task detail modal opens

### ✅ Map View
- [ ] Click "🗺️ Map View" button
- [ ] Map loads (OpenStreetMap)
- [ ] User location appears (blue marker) - requires location permission
- [ ] Task markers appear on map (15 total)
- [ ] Task markers show different icons:
  - 📍 GPS tasks (4 tasks)
  - 📸 Photo tasks (9 tasks)
  - ❓ Quiz task (1 task)
  - 🎥 Video task (1 task)
- [ ] GPS radius circles visible for location tasks
- [ ] Click marker to see task popup
- [ ] Click "View Details" in popup
- [ ] "Center on Me" button works
- [ ] Task count badge shows "15 tasks on map"

### ✅ Logout & Re-login
- [ ] Click "🚪 Logout" button
- [ ] Returns to login screen
- [ ] Can login again with "BERLIN2025"
- [ ] Data persists (or reloads fresh)

## Test Data Summary

### Tenant
- **Name:** ESN Berlin
- **Theme:** Blue (#1a56db) and Purple (#7e3af2)

### Event
- **Name:** Welcome Week 2025
- **Dates:** September 1-7, 2025
- **Location:** Berlin

### Team
- **Access Code:** BERLIN2025
- **Name:** The Explorers
- **Members:** 4
- **Initial Score:** 0 points

### Tasks (15 Total - 895 Points)

#### GPS Location Tasks (4):
1. 🏛️ Brandenburg Gate - 50 pts (easy)
2. 🏛️ Reichstag Building - 80 pts (medium)
3. 🛂 Checkpoint Charlie - 50 pts (easy)
4. 🏆 Victory Column - 60 pts (medium)

#### Photo Tasks (9):
5. 🏛️ Museum Island - 75 pts (medium)
6. 🎨 East Side Gallery - 60 pts (easy)
7. 📡 TV Tower - 40 pts (easy)
8. ⛪ Berlin Cathedral - 70 pts (medium)
9. 🎭 Gendarmenmarkt - 65 pts (medium)
10. 🌭 Currywurst Challenge - 45 pts (easy)
11. 🎨 Street Art Hunt - 55 pts (easy)
12. 🚇 Public Transport Pro - 30 pts (easy)
13. ☕ Coffee Shop Discovery - 40 pts (easy)

#### Quiz Task (1):
14. 🧠 Berlin Trivia - 35 pts (easy)

#### Video Task (1):
15. 🎥 Team Introduction - 100 pts (hard)

## Common Issues & Solutions

### Tasks Not Showing
**Issue:** List or map shows no tasks
**Solution:** 
1. Check browser console for errors
2. Verify Firebase connection
3. Check that you ran `npm run setup-test-data`
4. Verify in Firebase Console that tasks exist

### Location Not Working
**Issue:** Blue marker doesn't appear on map
**Solution:**
1. Grant location permission when browser asks
2. Check browser console for geolocation errors
3. Try HTTPS (location may not work on HTTP)

### Map Not Loading
**Issue:** Map shows loading spinner indefinitely
**Solution:**
1. Check internet connection (needs to load map tiles)
2. Check browser console for errors
3. Verify Leaflet CSS is loaded

### Can't Logout
**Issue:** Logout button doesn't work
**Solution:**
1. Hard refresh the page (Cmd+Shift+R or Ctrl+Shift+R)
2. Clear browser localStorage
3. Try incognito/private window

## Browser Console Checks

Open browser DevTools (F12) and check:

### Should See (Success):
- ✅ No red errors in Console
- ✅ Network tab shows successful Firebase requests
- ✅ Application > Local Storage shows "urban-rally-auth"

### Should NOT See (Errors):
- ❌ CORS errors
- ❌ "Permission denied" errors
- ❌ "Failed to fetch" errors
- ❌ TypeScript errors

## Firebase Console Verification

Visit: https://console.firebase.google.com/project/urban-rally-539bd/firestore

### Check Collections:
- **tenants/esn-berlin** - Should exist
- **events/welcome-week-2025** - Should exist
- **teams/team-test-01** - Should exist
- **tasks/** - Should have 15 documents

## Next Phase After Testing

Once testing is complete, you're ready for:

### Phase 4: Task Submission
- Camera capture component
- Photo/video upload
- File compression
- GPS verification
- Submission tracking

## Resetting Test Data

If you need to reset:

```bash
# Delete data in Firebase Console
# Then run:
npm run setup-test-data
```

This will recreate all test data fresh.

---

**Happy Testing! 🎉**

If you encounter any issues not covered here, check:
- `docs/TEST_ENV_SETUP.md`
- `docs/TEST_ENV_COMPLETE.md`
- `docs/PHASE3_SUMMARY.md`
