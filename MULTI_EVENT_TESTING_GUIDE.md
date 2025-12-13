# Multi-Event Testing Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
npm install -D tsx
```

### Step 2: Migrate Existing Users
```bash
# Preview what will change (safe)
npm run migrate:multi-event -- --dry-run

# Execute migration
npm run migrate:multi-event
```

**Output:**
```
✅ Updated: 15 users
⏭️  Skipped: 0
✨ All users successfully migrated!
```

### Step 3: Create Test Data
```bash
# Preview test data (safe)
npm run seed:multi-event -- --dry-run

# Create events and teams
npm run seed:multi-event
```

**Output:**
```
✨ Created 3 events
✨ Created 10 teams
🎉 Ready for multi-event testing!
```

### Step 4: Start Testing!
```bash
npm run dev
```

Navigate to: `http://localhost:5173/login`

---

## 🧪 Test Scenarios

### Test 1: Join Multiple Events (3 min)

**Steps:**
1. Go to login page
2. Enter team code: `REDWTR25`
3. Join **Team Red Explorers** in Berlin Winter Hunt
4. Click "Events" in header
5. Select **Munich Christmas Rally**
6. Enter team code: `GOLDXMS25`
7. Join **Team Golden Stars**

**Verify:**
- ✅ EventSwitcher shows 2 events
- ✅ Can switch between events
- ✅ Each event shows different team
- ✅ Team context changes when switching

---

### Test 2: 1-Team-Per-Event Rule (2 min)

**Steps:**
1. Join Team Red in Berlin Winter Hunt
2. Navigate to `/tenant/esn-berlin/event/berlin-winter-hunt-2025/teams`
3. Try to join Team Blue (code: `BLUWTR25`)

**Verify:**
- ⚠️ Yellow banner shows: "You're already in this event"
- ❌ Join buttons are disabled
- ✅ Can still join teams in other events

---

### Test 3: Recovery Code (3 min)

**Steps:**
1. Join teams in 2+ events
2. Navigate to Settings (⚙️ icon)
3. Click "Generate Recovery Code"
4. Copy the 6-digit code
5. Logout
6. Click "Login with Recovery Code"
7. Enter your code

**Verify:**
- ✅ Code generated successfully
- ✅ Can copy to clipboard
- ✅ Login with code works
- ✅ All event memberships restored
- ✅ EventSwitcher shows all events

---

### Test 4: Cross-Tenant (2 min)

**Steps:**
1. Join Team Red in ESN Berlin event
2. Join Team Golden Stars in ESN Munich event
3. Switch between events
4. Verify URLs change correctly

**Verify:**
- ✅ URL shows correct tenantId
- ✅ URL shows correct eventId
- ✅ Dashboard shows correct team
- ✅ No data leakage between tenants

---

## 🔑 Quick Reference

### Team Access Codes

| Event | Team | Code |
|-------|------|------|
| Berlin Winter | Team Red Explorers | `REDWTR25` |
| Berlin Winter | Team Blue Wanderers | `BLUWTR25` |
| Berlin Winter | Team Green Giants | `GRNWTR25` |
| Munich Christmas | Team Golden Stars | `GOLDXMS25` |
| Munich Christmas | Team Silver Bells | `SLVRXMS25` |
| Munich Christmas | Team Santa Squad | `SANTAXMS25` |
| Berlin New Year | Team Fireworks | `FIRENY26` |
| Berlin New Year | Team Champagne | `CHAMPNY26` |
| Berlin New Year | Team Midnight | `MIDNY26` |
| Berlin New Year | Team Resolution | `RESOLNY26` |

### Key URLs

| Page | URL |
|------|-----|
| Login | `/login` |
| Events | `/events` |
| Settings | `/settings` |
| Berlin Winter Teams | `/tenant/esn-berlin/event/berlin-winter-hunt-2025/teams` |
| Munich Christmas Teams | `/tenant/esn-munich/event/munich-christmas-rally-2025/teams` |
| Berlin New Year Teams | `/tenant/esn-berlin/event/berlin-new-year-2026/teams` |

---

## 🎯 What to Test

### ✅ Core Features
- [x] Join multiple events
- [x] EventSwitcher shows all events
- [x] Switch between events
- [x] 1-team-per-event enforcement
- [x] URL updates correctly
- [x] Team context switches
- [x] Recovery code generation
- [x] Recovery code login
- [x] Event memberships persist

### ✅ UI Components
- [x] EventSwitcher dropdown
- [x] ParticipationBanner (warning/success)
- [x] BrowseTeams grid
- [x] EventHeader context
- [x] Account Settings page
- [x] Loading states
- [x] Error states

### ✅ Navigation
- [x] Login → Events → Teams → Dashboard
- [x] Dashboard → Settings → Events
- [x] Browser back/forward buttons
- [x] Deep linking (bookmark URLs)
- [x] Logout redirects to login

### ✅ Data Integrity
- [x] TeamMember records created correctly
- [x] memberCount increments
- [x] User events list accurate
- [x] Recovery codes unique
- [x] Tenant isolation maintained

---

## 🐛 Common Issues

### Issue: "User not found"
**Solution:** Make sure you ran the migration:
```bash
npm run migrate:multi-event
```

### Issue: "Team not found"
**Solution:** Make sure you ran the seed script:
```bash
npm run seed:multi-event
```

### Issue: "Already in event" even though not joined
**Solution:** Check Firestore `teamMembers` collection for orphaned records

### Issue: Recovery code not working
**Solution:** 
1. Check code hasn't expired (30 days)
2. Verify code matches (case-sensitive)
3. Generate new code if needed

---

## 🧹 Reset Test Data

If you want to start fresh:

### Option 1: Delete Test Events (Recommended)
```bash
# In Firebase Console:
# 1. Go to Firestore
# 2. Delete events collection documents:
#    - berlin-winter-hunt-2025
#    - munich-christmas-rally-2025
#    - berlin-new-year-2026
# 3. Re-run seed script
npm run seed:multi-event
```

### Option 2: Full Reset
```bash
# Delete all test data
# Then re-run both scripts
npm run migrate:multi-event
npm run seed:multi-event
```

---

## 📊 Success Criteria

After testing, verify:

- ✅ Users can join multiple events successfully
- ✅ 1-team-per-event rule is enforced
- ✅ Event switching works smoothly
- ✅ Recovery codes restore full state
- ✅ URLs reflect current context
- ✅ No console errors
- ✅ No layout issues
- ✅ Data persists after refresh
- ✅ Logout/login cycle works

---

## 🎉 Next Steps

Once testing is complete:

1. **Document Issues** - Create GitHub issues for any bugs found
2. **Update Documentation** - Add findings to project docs
3. **E2E Tests** - Write automated tests for critical flows
4. **Security Audit** - Review Firestore rules
5. **Performance Testing** - Test with larger datasets
6. **User Acceptance Testing** - Get feedback from real users

---

**Happy Testing! 🚀**

For detailed information, see `scripts/README.md`
