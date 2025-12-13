# Migration and Seeding Scripts

This directory contains scripts for migrating existing data and seeding test data for the multi-event authentication system.

## 📋 Overview

### Migration Script
- **File**: `migration/migrateUsersToMultiEvent.ts`
- **Purpose**: Updates existing User documents with multi-event fields
- **Safe**: Non-destructive, only adds new fields

### Seed Script
- **File**: `seed/seedMultiEventTestData.ts`
- **Purpose**: Creates test events and teams for multi-event testing
- **Creates**: 3 events, 10 teams across 2 tenants

---

## 🚀 Quick Start

### Prerequisites

1. Install `tsx` for running TypeScript scripts:
```bash
npm install -D tsx
```

2. Ensure your `.env` file has Firebase credentials:
```bash
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

---

## 📝 Usage

### 1. Migrate Existing Users

This script adds multi-event fields to existing User documents.

**Dry Run (Preview Changes):**
```bash
npm run migrate:users -- --dry-run
```

**Execute Migration:**
```bash
npm run migrate:users
```

**What it does:**
- ✅ Adds `accountType: 'anonymous'` to all users
- ✅ Adds `recoveryCode: null` (initially)
- ✅ Adds `recoveryCodeExpiresAt: null`
- ✅ Adds `recoveryCodeGeneratedAt: null`
- ✅ Updates `updatedAt` timestamp
- ✅ Skips users already migrated
- ✅ Processes in batches of 500 (Firestore limit)

**Output:**
```
🔄 Starting User Migration for Multi-Event Support...

📊 Found 15 users to process

✅ User abc123 (John Doe) - Queued for migration
✅ User def456 (Jane Smith) - Queued for migration
⏭️  User ghi789 (Bob Wilson) - Already migrated

💾 Committed batch of 15 updates

✨ Migration Complete!

📊 Migration Statistics:
   Total users: 15
   ✅ Updated: 14
   ⏭️  Skipped: 1
   ❌ Errors: 0

🔍 Verifying migration...

✅ Verified: 15 users have multi-event fields

🎉 All users successfully migrated!
```

---

### 2. Seed Test Data

This script creates test events and teams for multi-event testing.

**Dry Run (Preview Data):**
```bash
npm run seed:multi-event -- --dry-run
```

**Execute Seeding:**
```bash
npm run seed:multi-event
```

**What it creates:**

**Events (3):**
1. **Berlin Winter Hunt 2025**
   - Tenant: ESN Berlin
   - Dates: Dec 15-22, 2025
   - Teams: 3 (Red, Blue, Green)

2. **Munich Christmas Rally 2025**
   - Tenant: ESN Munich
   - Dates: Dec 18-25, 2025
   - Teams: 3 (Gold, Silver, Santa)

3. **Berlin New Year 2026**
   - Tenant: ESN Berlin
   - Dates: Jan 1-7, 2026
   - Teams: 4 (Fireworks, Champagne, Midnight, Resolution)

**Teams (10 total):**
- Each with unique access code
- Various team sizes (6-12 members)
- All active and ready to join

**Output:**
```
🚀 Starting Multi-Event Test Data Seeding...

📅 Seeding Events...

✅ Event: Winter Scavenger Hunt 2025 (esn-berlin)
   ID: berlin-winter-hunt-2025
   Dates: 12/15/2025 - 12/22/2025
   Status: 🟢 Active

✨ Created 3 events

👥 Seeding Teams...

✅ Team: Team Red Explorers
   Event: berlin-winter-hunt-2025
   Access Code: REDWTR25
   Max Size: 8

✨ Created 10 teams

============================================================
🎯 MULTI-EVENT TESTING SUMMARY
============================================================

📊 Test Data Created:

🎪 Event: Winter Scavenger Hunt 2025
   Tenant: ESN Berlin (esn-berlin)
   Teams:
     • Team Red Explorers - Code: REDWTR25 (Max: 8)
     • Team Blue Wanderers - Code: BLUWTR25 (Max: 8)
     • Team Green Giants - Code: GRNWTR25 (Max: 6)

🎪 Event: Christmas City Rally 2025
   Tenant: ESN Munich (esn-munich)
   Teams:
     • Team Golden Stars - Code: GOLDXMS25 (Max: 10)
     • Team Silver Bells - Code: SLVRXMS25 (Max: 10)
     • Team Santa Squad - Code: SANTAXMS25 (Max: 8)

🎪 Event: New Year City Challenge 2026
   Tenant: ESN Berlin (esn-berlin)
   Teams:
     • Team Fireworks - Code: FIRENY26 (Max: 12)
     • Team Champagne - Code: CHAMPNY26 (Max: 12)
     • Team Midnight - Code: MIDNY26 (Max: 10)
     • Team Resolution - Code: RESOLNY26 (Max: 8)
```

---

## 🧪 Testing Scenarios

### Scenario 1: Multi-Event Participation
**Goal**: User joins teams in multiple events

1. Login with team code `REDWTR25`
2. Join Team Red in Berlin Winter Hunt
3. Navigate to `/events`
4. Select Munich Christmas Rally
5. Join Team Golden Stars with code `GOLDXMS25`
6. Use EventSwitcher to switch between events

**Expected**:
- ✅ User is in 2 different teams
- ✅ Each event shows different team context
- ✅ EventSwitcher shows both events

---

### Scenario 2: 1-Team-Per-Event Validation
**Goal**: Prevent joining multiple teams in same event

1. Join Team Red in Berlin Winter Hunt
2. Try to join Team Blue in same event

**Expected**:
- ❌ ParticipationBanner shows warning
- ❌ Join button disabled
- ✅ User remains in Team Red

---

### Scenario 3: Cross-Tenant Testing
**Goal**: Verify tenant isolation

1. Join team in ESN Berlin event
2. Join team in ESN Munich event
3. Navigate between events
4. Verify data isolation

**Expected**:
- ✅ Can join teams in both tenants
- ✅ Each tenant has separate team context
- ✅ No data leakage between tenants

---

### Scenario 4: Recovery Code Flow
**Goal**: Test account recovery

1. Join multiple teams across events
2. Navigate to `/settings`
3. Generate recovery code
4. Copy code to clipboard
5. Logout
6. Login with recovery code

**Expected**:
- ✅ Recovery code generated (6 digits)
- ✅ Can copy to clipboard
- ✅ Login restores all event memberships
- ✅ All teams restored correctly

---

## 🔑 Team Access Codes

Quick reference for testing:

### Berlin Winter Hunt 2025
- Team Red Explorers: `REDWTR25`
- Team Blue Wanderers: `BLUWTR25`
- Team Green Giants: `GRNWTR25`

### Munich Christmas Rally 2025
- Team Golden Stars: `GOLDXMS25`
- Team Silver Bells: `SLVRXMS25`
- Team Santa Squad: `SANTAXMS25`

### Berlin New Year 2026
- Team Fireworks: `FIRENY26`
- Team Champagne: `CHAMPNY26`
- Team Midnight: `MIDNY26`
- Team Resolution: `RESOLNY26`

---

## 🔗 Testing URLs

### Public Routes
- Login: `http://localhost:5173/login`
- Recovery Code Login: `http://localhost:5173/login?mode=recovery`

### Protected Routes
- Event Selector: `http://localhost:5173/events`
- Account Settings: `http://localhost:5173/settings`

### Event-Specific Routes

**Berlin Winter Hunt:**
- Browse Teams: `http://localhost:5173/tenant/esn-berlin/event/berlin-winter-hunt-2025/teams`
- Dashboard: `http://localhost:5173/tenant/esn-berlin/event/berlin-winter-hunt-2025/dashboard`

**Munich Christmas Rally:**
- Browse Teams: `http://localhost:5173/tenant/esn-munich/event/munich-christmas-rally-2025/teams`
- Dashboard: `http://localhost:5173/tenant/esn-munich/event/munich-christmas-rally-2025/dashboard`

**Berlin New Year:**
- Browse Teams: `http://localhost:5173/tenant/esn-berlin/event/berlin-new-year-2026/teams`
- Dashboard: `http://localhost:5173/tenant/esn-berlin/event/berlin-new-year-2026/dashboard`

---

## 🛠️ Troubleshooting

### Migration Issues

**Problem**: "No such file or directory"
```bash
# Solution: Create scripts directory
mkdir -p scripts/migration scripts/seed
```

**Problem**: "Firebase config not found"
```bash
# Solution: Check .env file has all required variables
cat .env | grep VITE_FIREBASE
```

**Problem**: "Permission denied"
```bash
# Solution: Check Firestore security rules allow writes
# Or use Firebase Admin SDK with service account
```

---

### Seeding Issues

**Problem**: "Document already exists"
```bash
# Solution: Delete existing test data first
# Or modify script to use different IDs
```

**Problem**: "Invalid date"
```bash
# Solution: Check system date/time is correct
# Ensure dates are in valid format
```

---

## 📊 Verification

### After Migration
```bash
# Check Firestore console
# Navigate to users collection
# Verify documents have:
# - accountType: "anonymous"
# - recoveryCode: null
# - recoveryCodeExpiresAt: null
# - recoveryCodeGeneratedAt: null
```

### After Seeding
```bash
# Check Firestore console
# Verify:
# - 3 documents in events collection
# - 10 documents in teams collection
# - All have correct tenantId and eventId
```

---

## 🧹 Cleanup

To remove test data:

```bash
# Delete test events (will cascade delete teams in security rules)
firebase firestore:delete /events/berlin-winter-hunt-2025 --recursive
firebase firestore:delete /events/munich-christmas-rally-2025 --recursive
firebase firestore:delete /events/berlin-new-year-2026 --recursive
```

---

## 📝 Notes

- Migration is **idempotent** (safe to run multiple times)
- Seeding will **overwrite** existing documents with same IDs
- Always test in **development environment** first
- Use **--dry-run** flag to preview changes
- Backup production data before running migrations

---

**Last Updated**: December 13, 2025
