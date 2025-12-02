# 🔥 Firebase Console: Temporary Rules Update Guide

## ⚠️ IMPORTANT: Temporary Setup Only

These rules allow **unrestricted access** to your Firestore database. Use ONLY for initial setup, then immediately revert!

---

## Step 1: Open Firebase Console

1. Go to: https://console.firebase.google.com/
2. Select project: **urban-rally-539bd**
3. Click **Firestore Database** in the left sidebar
4. Click the **Rules** tab at the top

---

## Step 2: Update Rules (TEMPORARY)

**Replace the entire rules file with:**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // ⚠️ TEMPORARY: Allow all reads and writes
    // This is ONLY for initial test data setup
    // REVERT AFTER RUNNING: npm run setup-test-data
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**Click "Publish" button**

---

## Step 3: Run Setup Script

Back in your terminal:

```bash
npm run setup-test-data
```

You should see:
```
✅ Tenant created: ESN Berlin (Light Theme)
✅ Tenant created: Urban Chase (Cyberpunk Theme)
✅ Event created: Welcome Week 2025
✅ Event created: Night Chase 2025
✅ Team created with access code: BERLIN2025
✅ Team created with access code: CHASE2025
📍 Creating tasks...
  ESN Berlin Tasks:
    ✅ 🏛️ Brandenburg Gate
    ✅ 🏛️ Reichstag Building
    ... (15 tasks total)
  
  Urban Chase Tasks:
    ✅ 🌃 Alexanderplatz Nexus
    ✅ ⚡ Oberbaum Data Bridge
    ... (8 tasks total)

🎉 Test Environment Setup Complete!
```

---

## Step 4: IMMEDIATELY Revert Rules

**⚠️ CRITICAL: Do not skip this step!**

Back in Firebase Console → Firestore → Rules:

**Replace with the secure rules:**

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Tenants - public read, no write
    match /tenants/{tenantId} {
      allow read: if true;
      allow write: if false;
    }
    
    // Events - public read, no write
    match /events/{eventId} {
      allow read: if true;
      allow write: if false;
    }
    
    // Tasks - public read, no write
    match /tasks/{taskId} {
      allow read: if true;
      allow write: if false;
    }
    
    // Teams - read/write for authenticated users
    match /teams/{teamId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      request.auth.uid == resource.data.userId;
    }
    
    // Submissions - read/write for authenticated users
    match /submissions/{submissionId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Leaderboard - public read, no write
    match /leaderboard/{entry} {
      allow read: if true;
      allow write: if false;
    }
  }
}
```

**Click "Publish" button**

---

## Step 5: Verify Data Created

In Firebase Console → Firestore → Data:

Check for:
- ✅ **tenants/** collection:
  - `esn-berlin`
  - `urban-chase` (NEW)
  
- ✅ **events/** collection:
  - `welcome-week-2025`
  - `night-chase-2025` (NEW)
  
- ✅ **teams/** collection:
  - `team-test-01` (BERLIN2025)
  - `team-test-02` (CHASE2025) (NEW)
  
- ✅ **tasks/** collection:
  - 15 tasks for ESN Berlin
  - 8 tasks for Urban Chase (NEW)

---

## Step 6: Test Both Themes

Start dev server:
```bash
npm run dev -- --host
```

### Test 1: ESN Berlin (Light Theme)
1. Open: http://localhost:5174
2. Enter code: `BERLIN2025`
3. Expected: Light theme, white cards, blue accents
4. Check: 15 tasks visible

### Test 2: Urban Chase (Cyberpunk Theme)
1. Click Logout
2. Enter code: `CHASE2025`
3. Expected: Dark theme, glass cards, pink/cyan gradients
4. Check: 8 tasks visible

---

## ✅ Checklist

- [ ] Firebase Console opened
- [ ] Temporary rules applied
- [ ] Setup script run successfully
- [ ] **SECURE RULES RESTORED** (CRITICAL!)
- [ ] Data verified in Firestore
- [ ] Both themes tested
- [ ] Mobile testing (optional)

---

## 🆘 Troubleshooting

### "Permission Denied" after reverting rules
**Solution:** This is expected! The secure rules prevent script writes. Only run the setup script when temporary rules are active.

### Can't see Urban Chase tasks
**Check:** 
1. Firestore → tasks collection → Verify tasks exist with `tenantId: "urban-chase"`
2. Team code is correct: `CHASE2025` (case-sensitive)

### Theme not changing
**Check:**
1. Logout completely
2. Clear browser cache
3. Re-enter team code
4. Check browser console for errors

---

## 📝 Notes

- Temporary rules are active for ~5 minutes typically
- You can run the script multiple times (it overwrites data)
- The script uses `setDoc()` which creates or updates documents
- All test data has timestamps set to current time

---

## 🎉 Success!

Once complete, you'll have:
- ✅ 2 working tenants with different themes
- ✅ 2 events with unique task sets
- ✅ 2 team codes to test both experiences
- ✅ Secure Firestore rules restored

Happy testing! 🚀
