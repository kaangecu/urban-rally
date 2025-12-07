# Production Deployment Checklist
## Urban Rally - User-Centric System Migration

This checklist ensures a safe, zero-downtime deployment of the new user-centric system.

---

## Pre-Deployment Phase (1-2 Days Before)

### 1. Code Review & Testing ✓
- [ ] Review all code changes in pull request
- [ ] Run full test suite: `npm run test:run`
- [ ] Run TypeScript type checking: `npm run type-check`
- [ ] Run linter: `npm run lint`
- [ ] Test migration script in dry-run mode: `npm run migrate-users`
- [ ] Verify no console errors in development build

### 2. Backup Current State
- [ ] **Export Firestore Data**
  ```bash
  gcloud firestore export gs://[YOUR-BUCKET]/firestore-backup-$(date +%Y%m%d-%H%M%S) \
    --project=urban-rally-539bd
  ```
- [ ] **Backup Firestore Rules**
  ```bash
  npm run firebase:backup-rules
  # Saved to: firestore.backup.rules
  ```
- [ ] **Backup Storage Rules**
  ```bash
  firebase storage:rules get > storage.backup.rules
  ```
- [ ] **Export environment variables**
  ```bash
  cp .env .env.backup
  ```
- [ ] **Document current database stats**
  - Number of teams: _______
  - Number of submissions: _______
  - Number of events: _______
  - Last backup timestamp: _______

### 3. Test Environment Verification
- [ ] Create test Firebase project or use emulator
- [ ] Deploy code to test environment
- [ ] Deploy Firestore rules to test environment
- [ ] Run migration on test data
- [ ] Verify all features work post-migration:
  - [ ] User registration
  - [ ] Team joining
  - [ ] Task submission
  - [ ] Leaderboard updates
  - [ ] Team members list view
  - [ ] GDPR deletion

### 4. Communication
- [ ] Notify stakeholders of deployment window
- [ ] Prepare rollback communication template
- [ ] Set up monitoring alerts
- [ ] Assign on-call person for issues

---

## Deployment Day - Part 1: Database Migration

### 5. Pre-Migration Checks (30 mins before)
- [ ] Confirm all team members available
- [ ] Check Firebase project health in console
- [ ] Verify no ongoing events (or coordinate with users)
- [ ] Enable maintenance mode (optional):
  ```typescript
  // Add to firestore: /system/maintenance
  { enabled: true, message: "System upgrade in progress. Back in 30 minutes." }
  ```

### 6. Deploy New Firestore Rules (CRITICAL FIRST)
```bash
# Deploy the new rules BEFORE migration
cd /Users/kaangecu/Desktop/personal/urban-rally
firebase deploy --only firestore:rules --project urban-rally-539bd
```

- [ ] Rules deployed successfully
- [ ] Verify rules in Firebase Console
- [ ] Test basic read/write with new schema (in console)

**⚠️ WARNING:** Rules must be deployed BEFORE running migration execute mode!

### 7. Run Migration Script
```bash
# Final dry-run to verify
npm run migrate-users
```

**Review Output:**
- [ ] Number of teams to migrate: _______
- [ ] No errors in dry-run
- [ ] All teams showing expected preview

```bash
# EXECUTE MIGRATION
npm run migrate-users:execute
```

**Monitor Output:**
- [ ] All teams migrated successfully
- [ ] No errors in console
- [ ] Backup created in `migration-backups/`
- [ ] Migration summary looks correct

### 8. Verify Migration Success
```bash
# Run verification script
npm run migrate-users:verify
```

- [ ] All users created correctly
- [ ] All teamMembers created correctly
- [ ] All teams updated with ownerUserId/memberUserIds
- [ ] All submissions updated with userId
- [ ] No data loss detected

**Manual Verification (Firebase Console):**
- [ ] Check `/users` collection - should have documents
- [ ] Check `/teamMembers` collection - should have documents
- [ ] Check `/teams` - should have `ownerUserId` and `memberUserIds`
- [ ] Check `/submissions` - should have `userId` field
- [ ] Verify a sample team's complete data structure

---

## Deployment Day - Part 2: Application Deploy

### 9. Build Production App
```bash
npm run build
```

- [ ] Build completed without errors
- [ ] Check bundle size (should be reasonable)
- [ ] Verify `dist/` folder created

### 10. Deploy to Firebase Hosting
```bash
firebase deploy --only hosting --project urban-rally-539bd
```

- [ ] Hosting deployed successfully
- [ ] Note deployment URL: _______________________
- [ ] Deployment time: _______

### 11. Smoke Testing (Production)
**Test Immediately After Deploy:**

- [ ] **Homepage loads**
  - Navigate to production URL
  - No console errors
  - UI renders correctly

- [ ] **New User Flow**
  - Create new user account
  - Set display name and email
  - Verify user saved in Firestore `/users`

- [ ] **Team Join Flow**
  - Use existing team access code
  - Join team successfully
  - Verify teamMember created in `/teamMembers`
  - See other team members in Members tab

- [ ] **Task Submission**
  - Submit a photo/video task
  - Verify submission includes `userId`
  - Check submission appears in list

- [ ] **Team Members Tab**
  - Navigate to Members tab
  - See list of team members
  - Verify names display correctly

- [ ] **Leaderboard**
  - Check leaderboard loads
  - Verify team scores correct

### 12. Performance & Monitoring
- [ ] Check Firebase Console > Analytics
- [ ] Monitor error logs in Console > Crashlytics (if enabled)
- [ ] Check network tab for slow requests
- [ ] Verify no 403 permission errors in console
- [ ] Monitor Firestore read/write operations

---

## Post-Deployment (Next 24-48 Hours)

### 13. Continuous Monitoring
- [ ] Check every 2 hours for first 8 hours
- [ ] Monitor user feedback channels
- [ ] Watch for error spikes in Firebase
- [ ] Track user engagement metrics
- [ ] Verify no increase in support requests

### 14. User Feedback
- [ ] Collect feedback from early users
- [ ] Monitor social media / support channels
- [ ] Track any reported bugs
- [ ] Document any issues for quick fixes

### 15. Optimization
- [ ] Review Firestore indexes (add if needed)
- [ ] Check for slow queries in Performance tab
- [ ] Optimize bundle size if needed
- [ ] Review and optimize security rules if too permissive

---

## Rollback Plan (If Things Go Wrong)

### When to Rollback
- Migration failed with data corruption
- Critical features not working for users
- Firestore permission errors blocking users
- More than 25% of users reporting issues

### Rollback Steps

#### 1. Restore Previous Firestore Rules
```bash
# Copy backup rules
cp firestore.backup.rules firestore.rules

# Deploy old rules
firebase deploy --only firestore:rules --project urban-rally-539bd
```

#### 2. Restore Previous Hosting Version
```bash
# List hosting versions
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:rollback --project urban-rally-539bd
```

#### 3. Restore Firestore Data (NUCLEAR OPTION)
```bash
# Import from backup (overwrites current data!)
gcloud firestore import gs://[YOUR-BUCKET]/firestore-backup-[TIMESTAMP] \
  --project=urban-rally-539bd
```

**⚠️ WARNING:** This will overwrite ALL current data! Use only if migration completely failed.

#### 4. Verify Rollback Success
- [ ] Old rules active
- [ ] Old app version deployed
- [ ] Users can access features
- [ ] No console errors
- [ ] Normal operations resumed

#### 5. Communication
- [ ] Notify users of rollback
- [ ] Explain what happened
- [ ] Provide timeline for fix
- [ ] Apologize for inconvenience

---

## Success Criteria

### Migration is considered successful when:
- ✅ All teams migrated (0 failures)
- ✅ All users created in `/users` collection
- ✅ All teamMembers created in `/teamMembers` collection
- ✅ All submissions have `userId` field
- ✅ New user registration working
- ✅ Team joining working
- ✅ Task submissions working
- ✅ Team Members tab showing members
- ✅ No permission errors in console
- ✅ No increase in error rates
- ✅ Positive user feedback
- ✅ Performance metrics normal

---

## Post-Deployment Cleanup (After 1 Week)

### 16. Remove Development Overrides
Once verified stable, update Firestore rules to production-ready:

**File: `/Users/kaangecu/Desktop/personal/urban-rally/firestore.rules`**

Remove these development overrides:
```javascript
// CHANGE FROM:
allow write: if true; // ⚠️ DEVELOPMENT

// CHANGE TO:
allow write: if false; // Production: Only via Admin SDK
```

**Collections to lock down:**
- `/tenants` - read: true, write: false
- `/events` - read: true, write: false
- `/tasks` - read: authenticated, write: false
- `/teams` - create: false (unless controlled flow)

Deploy updated rules:
```bash
firebase deploy --only firestore:rules
```

### 17. Archive Migration Scripts
- [ ] Move migration scripts to `/scripts/archive/`
- [ ] Update README with migration date
- [ ] Document lessons learned
- [ ] Archive backup files (keep for 90 days minimum)

### 18. Final Documentation
- [ ] Update main README with new features
- [ ] Document new collections structure
- [ ] Update API documentation
- [ ] Create user guide for new features
- [ ] Update team onboarding instructions

---

## Emergency Contacts

**Technical Lead:** _________________________  
**Firebase Admin:** _________________________  
**On-Call Engineer:** _______________________  
**Project Manager:** ________________________  

**Firebase Console:** https://console.firebase.google.com/project/urban-rally-539bd  
**Status Page:** __________________________  
**Support Channel:** _______________________  

---

## Notes & Observations

**Deployment Date:** _____________________  
**Migration Duration:** _____________________  
**Teams Migrated:** _____________________  
**Issues Encountered:** 

_____________________________________________  
_____________________________________________  
_____________________________________________  

**Resolution Actions:**

_____________________________________________  
_____________________________________________  
_____________________________________________  

---

## Sign-Off

**Deployed By:** _________________________ Date: _________  
**Verified By:** _________________________ Date: _________  
**Approved By:** _________________________ Date: _________  

---

**Version:** 1.0  
**Last Updated:** December 7, 2024  
**Next Review:** Post-deployment retrospective
