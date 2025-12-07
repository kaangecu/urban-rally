# User System Migration Guide

This guide explains how to migrate your existing UrbanRally teams from the old team-centric model to the new user-centric multi-user system.

## Overview

The new user system allows:
- ✅ Multiple users per team (up to 50 members)
- ✅ Individual user profiles and stats tracking
- ✅ Personal scores and contribution tracking
- ✅ GDPR-compliant user management
- ✅ Users can join multiple teams
- ✅ Team Members tab showing all contributors

## Migration Process

### 1. **Backup** (Automatic)
Before migration, the script automatically creates a backup of:
- All teams
- All submissions

Backups are saved to: `migration-backups/backup-{timestamp}.json`

### 2. **Migration Steps**

For each existing team, the script will:

1. **Create User Document**
   - Uses existing `team.displayName` as user name
   - Uses existing `team.email` if available
   - Creates Firebase Anonymous Auth user if needed
   - Migrates consent data

2. **Update Team Document**
   - Adds `ownerUserId` field
   - Adds `memberUserIds` array with owner
   - Sets `memberCount` to 1
   - Sets `maxMembers` to 50

3. **Create TeamMember Record**
   - Links user to team
   - Sets role as 'owner'
   - Migrates team score to personal score
   - Copies completedTaskIds to tasksCompleted

4. **Update Submissions**
   - Adds `userId` field to all submissions
   - Links submissions to the team owner
   - Updates TeamMember with submission IDs

## Running the Migration

### Prerequisites

Make sure you have:
```bash
# Environment variables set (.env file)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

### Step 1: Dry Run (Preview Changes)

**ALWAYS run a dry run first!**

```bash
npm run migrate-users
```

This will:
- ✅ Show you exactly what will be migrated
- ✅ Display how many teams/users/submissions will be affected
- ✅ **NOT make any changes** to the database
- ✅ Help you identify potential issues

Example output:
```
🚀 Urban Rally - User System Migration

Mode: DRY-RUN

Found 3 teams to migrate

🔍 DRY RUN MODE - No changes will be made

[1/3] Migrating: Team Alpha (team-abc123)
  [DRY RUN] Would create Firebase Auth user
  [DRY RUN] Would create User: Alice (alice@example.com)
  [DRY RUN] Would update Team with ownerUserId: user-abc123
  [DRY RUN] Would create TeamMember with personalScore: 450
  [DRY RUN] Would update 5 submissions

...

📊 MIGRATION SUMMARY
Total teams processed: 3
✓ Successful: 3
✗ Failed: 0
```

### Step 2: Execute Migration

**Only after reviewing the dry run results:**

```bash
npm run migrate-users:execute
```

This will:
- 📦 Create a backup first
- 🔄 Migrate all teams to user-centric model
- ✅ Update all related data
- 📊 Show detailed progress

### Step 3: Verify Migration

After executing the migration:

```bash
npm run migrate-users:verify
```

This will check:
- ✅ All teams have `ownerUserId`
- ✅ All submissions have `userId`
- ✅ User count matches expected
- ✅ TeamMember records exist
- 📊 Display verification statistics

Expected output:
```
🔍 Verifying migration...

📊 Migration Verification Results:
   Total Teams: 3
   ✓ Teams with owner: 3
   ✗ Teams without owner: 0
   Total Users: 3
   Total TeamMembers: 3
   Total Submissions: 15
   ✓ Submissions with userId: 15
   ✗ Submissions without userId: 0

✅ Migration verification PASSED!
```

## What to Check After Migration

1. **Test Login Flow**
   - New users should be able to join teams
   - Team code login should create individual user accounts
   - Users should see their name in the Team Members tab

2. **Test Submissions**
   - Submit a task and check it's attributed to the user
   - Verify both team and personal scores update
   - Check Team Members tab shows updated stats

3. **Test Existing Teams**
   - Existing team owners can still log in
   - Their scores are preserved
   - Completed tasks are still marked complete

## Troubleshooting

### Issue: "Teams without owner" in verification

**Cause**: Migration failed for some teams

**Solution**:
1. Check error messages in migration output
2. Look at failed team details
3. Manually fix the issue (e.g., missing required fields)
4. Re-run migration for failed teams only

### Issue: Submissions without userId

**Cause**: Submissions weren't updated properly

**Solution**:
1. Check backup file for original data
2. Run verification to identify affected submissions
3. Manually update missing userId fields if needed

### Issue: User cannot login after migration

**Cause**: Firebase Auth user wasn't created

**Solution**:
1. Check if team had a valid `uid` before migration
2. User may need to "rejoin" the team with new login flow
3. Contact user to create new account via team code

## Rollback (Manual)

If something goes wrong:

1. **Stop using the new system immediately**

2. **Restore from backup**:
```bash
# Find your backup file
ls migration-backups/

# You'll need to manually restore using Firebase Console or Admin SDK
# The backup file contains all original team and submission data
```

3. **Revert code changes** (if you deployed):
```bash
git revert {migration-commit-hash}
```

## Important Notes

⚠️ **Before Migration**:
- [ ] Run dry-run and review output
- [ ] Test in development environment first
- [ ] Backup is created automatically
- [ ] Inform users about downtime (optional)

⚠️ **During Migration**:
- [ ] Don't interrupt the process
- [ ] Monitor console output for errors
- [ ] Keep backup file safe

⚠️ **After Migration**:
- [ ] Run verification
- [ ] Test all critical flows
- [ ] Update Firestore security rules
- [ ] Deploy new app version

## Data Model Changes

### Before Migration (Old Model)
```typescript
Team {
  id: string
  uid?: string              // Firebase Auth ID (deprecated)
  displayName?: string      // User name (deprecated)
  email?: string           // User email (deprecated)
  teamName: string
  score: number
  completedTaskIds: string[]
}

Submission {
  id: string
  teamId: string
  // No userId field
}
```

### After Migration (New Model)
```typescript
User {
  id: string               // Firebase Auth UID
  displayName: string
  email?: string
  totalScore: number
  totalSubmissions: number
}

Team {
  id: string
  ownerUserId: string      // NEW
  memberUserIds: string[]  // NEW
  memberCount: number      // NEW
  maxMembers: number       // NEW (default: 50)
  teamName: string
  score: number
  completedTaskIds: string[]
}

TeamMember {
  id: string               // NEW collection
  teamId: string
  userId: string
  personalScore: number
  tasksCompleted: string[]
  submissionIds: string[]
  role: 'owner' | 'member'
}

Submission {
  id: string
  teamId: string
  userId: string          // NEW - tracks who submitted
}
```

## Next Steps After Migration

1. **Update Firestore Rules** - Run task 11 to add security rules for new collections
2. **Deploy New App Version** - Users will see Team Members tab
3. **Test End-to-End** - Full flow from login to submission
4. **Monitor** - Watch for any issues in production

## Support

If you encounter issues:
1. Check the console output for detailed error messages
2. Review the backup file in `migration-backups/`
3. Verify your Firebase configuration
4. Check Firestore console for data consistency

---

**Migration Checklist:**
- [ ] Environment variables configured
- [ ] Dry run executed and reviewed
- [ ] Backup location verified
- [ ] Migration executed successfully
- [ ] Verification passed
- [ ] Test login flow
- [ ] Test submission flow
- [ ] Team Members tab working
- [ ] Firestore rules updated
- [ ] New version deployed
