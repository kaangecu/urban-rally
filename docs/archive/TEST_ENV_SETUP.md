# 🧪 Test Environment Setup Guide

This guide will help you populate your Firebase database with test data for development.

## Prerequisites

1. ✅ Firebase project created
2. ✅ `.env` file configured with Firebase credentials
3. ✅ Firestore database created
4. ✅ Security rules deployed

## Quick Setup

Run this single command to populate your test environment:

```bash
npm run setup-test-data
```

This will create:
- ✅ 1 Tenant (ESN Berlin)
- ✅ 1 Event (Welcome Week 2025)
- ✅ 1 Test Team (Access Code: **BERLIN2025**)
- ✅ 15 Tasks across Berlin

## What Gets Created

### Tenant: ESN Berlin
- **ID:** `esn-berlin`
- **Name:** ESN Berlin
- **Colors:** Blue/Purple theme
- **Type:** Premium tier

### Event: Welcome Week 2025
- **Dates:** September 1-7, 2025
- **Location:** Berlin, Germany
- **Max Teams:** 50
- **Status:** Active

### Test Team
- **Access Code:** `BERLIN2025`
- **Team Name:** The Explorers
- **Members:** 4
- **Initial Score:** 0 points

### Tasks (15 Total)

| # | Task | Type | Points | Difficulty | Location |
|---|------|------|--------|-----------|----------|
| 1 | 🏛️ Brandenburg Gate | GPS | 50 | Easy | 52.5163, 13.3777 |
| 2 | 🏛️ Museum Island | PHOTO | 75 | Medium | 52.5211, 13.3987 |
| 3 | 🎨 East Side Gallery | PHOTO | 60 | Easy | 52.5058, 13.4394 |
| 4 | 📡 TV Tower | PHOTO | 40 | Easy | 52.5208, 13.4094 |
| 5 | 🏛️ Reichstag Building | GPS | 80 | Medium | 52.5186, 13.3761 |
| 6 | 🛂 Checkpoint Charlie | GPS | 50 | Easy | 52.5075, 13.3903 |
| 7 | 🏆 Victory Column | GPS | 60 | Medium | 52.5145, 13.3501 |
| 8 | ⛪ Berlin Cathedral | PHOTO | 70 | Medium | 52.5191, 13.4013 |
| 9 | 🎭 Gendarmenmarkt | PHOTO | 65 | Medium | 52.5134, 13.3926 |
| 10 | 🌭 Currywurst | PHOTO | 45 | Easy | - |
| 11 | 🎨 Street Art Hunt | PHOTO | 55 | Easy | - |
| 12 | 🚇 Public Transport | PHOTO | 30 | Easy | - |
| 13 | ☕ Coffee Shop | PHOTO | 40 | Easy | - |
| 14 | 🧠 Berlin Trivia | QUIZ | 35 | Easy | - |
| 15 | 🎥 Team Video | VIDEO | 100 | Hard | - |

**Total Points Available:** 895

## Testing the App

### 1. Start Development Server
```bash
npm run dev
```

### 2. Open the App
Navigate to `http://localhost:5173`

### 3. Login with Test Team
Enter the access code: **BERLIN2025**

### 4. Explore Features

#### ✅ Authentication
- Team code login
- Tenant branding (blue/purple theme)
- Team info display

#### ✅ Task List
- View all 15 tasks
- Filter: All / Available / Completed
- Sort by: Points / Difficulty / Distance
- Task cards with images
- Task detail modal

#### ✅ Map View
- Toggle between List and Map views
- See task markers on map
- User location (blue marker)
- Custom task type icons
- Click markers to view details
- "Center on Me" button

## Firestore Collections

After running the setup script, your Firestore will have:

```
/tenants
  └─ esn-berlin
  
/events
  └─ welcome-week-2025
  
/teams
  └─ team-test-01
  
/tasks
  ├─ task-brandenburg-gate
  ├─ task-museum-island
  ├─ task-east-side-gallery
  ├─ task-tv-tower
  ├─ task-reichstag
  ├─ task-checkpoint-charlie
  ├─ task-victory-column
  ├─ task-berlin-cathedral
  ├─ task-gendarmenmarkt
  ├─ task-currywurst
  ├─ task-street-art
  ├─ task-public-transport
  ├─ task-coffee-shop
  ├─ task-trivia
  └─ task-team-video
```

## Reset Test Data

To reset and recreate test data:

1. **Delete existing data** (via Firebase Console or script)
2. **Run setup again:**
   ```bash
   npm run setup-test-data
   ```

## Viewing Data in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database**
4. Browse collections: `tenants`, `events`, `teams`, `tasks`

## Security Rules

Make sure your security rules allow:
- ✅ Anonymous users can read `teams` by `accessCode`
- ✅ Authenticated users can read `tenants` and `events`
- ✅ Authenticated users can read tasks for their `tenantId` and `eventId`

## Troubleshooting

### Script fails with "Firebase not initialized"
**Solution:** Check your `.env` file has correct Firebase credentials

### Tasks don't appear in the app
**Solution:** 
1. Check Firebase Console to verify tasks were created
2. Verify team's `tenantId` matches task's `tenantId`
3. Check browser console for errors

### "Permission denied" errors
**Solution:** 
1. Deploy security rules: `firebase deploy --only firestore:rules`
2. Verify rules allow reading `tasks` collection

### Can't login with BERLIN2025
**Solution:**
1. Check Firebase Console for team with accessCode "BERLIN2025"
2. Verify team exists in `teams` collection
3. Check team's `isActive: true`

## Next Steps

Once test data is loaded:

1. ✅ Test authentication flow
2. ✅ Verify task list displays correctly
3. ✅ Test map integration
4. ✅ Try filtering and sorting
5. ✅ Click tasks to view details
6. 🚀 Proceed to Phase 4: Task Submission

## Script Source

The setup script is located at:
```
src/scripts/setup-test-data.ts
```

You can modify it to:
- Add more tasks
- Create multiple events
- Add more test teams
- Customize tenant branding

---

**Happy Testing! 🎉**
