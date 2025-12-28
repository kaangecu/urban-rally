# Testing Guide - Urban Rally User System

This guide provides comprehensive testing procedures for the new user-centric multi-team system.

---

## Table of Contents
1. [Unit Tests](#unit-tests)
2. [Integration Tests](#integration-tests)
3. [Manual Testing Procedures](#manual-testing-procedures)
4. [Security Testing](#security-testing)
5. [Performance Testing](#performance-testing)
6. [Migration Testing](#migration-testing)

---

## Unit Tests

### Running Tests

```bash
# Run all tests
npm run test:run

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm run test:run -- src/services/__tests__/user.service.test.ts

# Run with coverage
npm run test:coverage
```

### Test Files Created

#### ✅ user.service.test.ts
**Location:** `/src/services/__tests__/user.service.test.ts`

**Coverage:**
- Creating users with/without email
- Retrieving users by ID and email
- Updating user profiles
- Updating user statistics
- GDPR compliance (consent tracking)
- Data validation
- Error handling

**To Add:**
- Test email validation
- Test display name length limits
- Test concurrent updates

#### 🔄 teamMember.service.test.ts (TO DO)
**Location:** `/src/services/__tests__/teamMember.service.test.ts`

**Should Cover:**
- Creating team membership
- Joining existing teams
- Leaving teams
- Updating personal scores
- Querying team members
- Testing team capacity limits
- Testing duplicate join prevention
- Error handling

**Sample Test Structure:**
```typescript
describe('teamMember.service', () => {
  describe('joinTeam', () => {
    it('should create team membership record');
    it('should add userId to team.memberUserIds');
    it('should reject if team is full');
    it('should prevent duplicate joins');
  });

  describe('leaveTeam', () => {
    it('should remove team membership');
    it('should remove userId from team.memberUserIds');
    it('should preserve team if not last member');
  });

  describe('updatePersonalScore', () => {
    it('should increment personal score');
    it('should not affect other members');
  });
});
```

#### 🔄 team.service.test.ts Updates (TO DO)
**Should Add:**
- Test ownerUserId assignment
- Test memberUserIds array management
- Test maxMembers enforcement
- Test ownership transfer

---

## Integration Tests

### User Registration & Team Join Flow

**Test Scenario:** New user creates account and joins existing team

**Manual Test Steps:**
1. Navigate to login page
2. Enter team access code
3. Click "Join Team"
4. Fill in display name and email
5. Accept terms and privacy policy
6. Click "Create Account"

**Expected Results:**
- ✅ User document created in `/users/{userId}`
- ✅ TeamMember document created in `/teamMembers/{memberId}`
- ✅ User added to `/teams/{teamId}.memberUserIds`
- ✅ Redirected to team dashboard
- ✅ User appears in Members tab

**Database Verification:**
```javascript
// Check user created
const userDoc = await getDoc(doc(db, 'users', userId));
expect(userDoc.exists()).toBe(true);
expect(userDoc.data().displayName).toBe('Test User');

// Check team member created
const membersSnapshot = await getDocs(
  query(collection(db, 'teamMembers'), where('userId', '==', userId))
);
expect(membersSnapshot.size).toBe(1);

// Check user in team's memberUserIds
const teamDoc = await getDoc(doc(db, 'teams', teamId));
expect(teamDoc.data().memberUserIds).toContain(userId);
```

### Task Submission Flow with User Tracking

**Test Scenario:** User submits photo task and personal score is tracked

**Manual Test Steps:**
1. Log in as existing team member
2. Navigate to Tasks tab
3. Select a photo task
4. Take/upload photo
5. Submit task

**Expected Results:**
- ✅ Submission created with `userId` field
- ✅ Personal score incremented in teamMember document
- ✅ Team score incremented
- ✅ Submission appears in task history
- ✅ User's contribution visible in Members tab

**Database Verification:**
```javascript
// Check submission has userId
const submissionDoc = await getDoc(doc(db, 'submissions', submissionId));
expect(submissionDoc.data().userId).toBe(userId);
expect(submissionDoc.data().teamId).toBe(teamId);

// Check personal score updated
const memberDoc = await getDoc(doc(db, 'teamMembers', memberId));
expect(memberDoc.data().personalScore).toBeGreaterThan(0);
```

### Team Members Viewing Flow

**Test Scenario:** User views team members and their contributions

**Manual Test Steps:**
1. Log in as team member
2. Navigate to Members tab
3. View list of team members

**Expected Results:**
- ✅ All team members displayed
- ✅ Each member shows display name
- ✅ Each member shows personal score
- ✅ Current user highlighted
- ✅ Members sorted by score (highest first)

### GDPR Deletion Flow

**Test Scenario:** User requests account deletion (GDPR compliance)

**Manual Test Steps:**
1. Log in as user
2. Navigate to Profile settings
3. Click "Delete Account"
4. Confirm deletion

**Expected Results:**
- ✅ User document deleted from `/users`
- ✅ TeamMember documents deleted
- ✅ User removed from team.memberUserIds
- ✅ Submissions remain (anonymized) OR deleted based on policy
- ✅ User logged out
- ✅ Cannot log back in with same credentials

---

## Manual Testing Procedures

### Pre-Migration Testing (Old System)

1. **Team Login**
   - Use existing access code
   - Verify team loads correctly
   - Check team score displays

2. **Task Submission**
   - Submit a task
   - Verify it increments team score
   - Check submission shows in list

3. **Data Snapshot**
   - Document current team count
   - Document current submission count
   - Note team scores for comparison

### Post-Migration Testing (New System)

1. **Existing Team Verification**
   - Log in with old team code
   - Verify team data preserved
   - Check score matches pre-migration
   - Verify all submissions present

2. **New User Registration**
   - Create new user account
   - Join existing team
   - Verify appears in Members tab
   - Submit a task
   - Verify personal score tracks

3. **Multi-User Team Testing**
   - Create team with 3+ members
   - Each member submits tasks
   - Verify individual scores tracked
   - Verify team score aggregates correctly
   - Check leaderboard reflects total

### Edge Cases to Test

#### Team Capacity
- [ ] Team with maxMembers = 5
- [ ] Add 5 members successfully
- [ ] 6th member should be rejected
- [ ] Error message displayed correctly

#### Duplicate Prevention
- [ ] User tries to join same team twice
- [ ] Should be prevented
- [ ] Appropriate error message

#### Concurrent Submissions
- [ ] Two members submit simultaneously
- [ ] Both scores recorded correctly
- [ ] No race conditions
- [ ] Team score correct

#### Empty States
- [ ] New team with zero members
- [ ] Team with members but no submissions
- [ ] User with no teams
- [ ] Display appropriate messages

#### Offline Behavior
- [ ] Submit task while offline
- [ ] Go online
- [ ] Submission syncs correctly
- [ ] Personal score updates

---

## Security Testing

### Firestore Rules Testing

Use Firebase Rules Playground or automated tests:

```javascript
// Test: User can read own profile
const userRef = doc(db, 'users', currentUserId);
await getDoc(userRef); // Should succeed

// Test: User cannot read other user's profile
const otherUserRef = doc(db, 'users', otherUserId);
await getDoc(otherUserRef); // Should fail with permission-denied

// Test: User can update own profile
await updateDoc(userRef, { displayName: 'New Name' }); // Should succeed

// Test: User cannot update other user's profile
await updateDoc(otherUserRef, { displayName: 'Hacked' }); // Should fail

// Test: Team member can read team data
const teamRef = doc(db, 'teams', myTeamId);
await getDoc(teamRef); // Should succeed

// Test: Non-member cannot read team data
const otherTeamRef = doc(db, 'teams', otherTeamId);
await getDoc(otherTeamRef); // Should fail

// Test: Only team owner can update team
await updateDoc(teamRef, { teamDisplayName: 'New Name' });
// Should succeed if owner, fail otherwise

// Test: Submission must include userId
await addDoc(collection(db, 'submissions'), {
  taskId: 'task123',
  teamId: myTeamId,
  // Missing userId
}); // Should fail

await addDoc(collection(db, 'submissions'), {
  taskId: 'task123',
  teamId: myTeamId,
  userId: currentUserId, // Correct
}); // Should succeed

// Test: Cannot submit for another user
await addDoc(collection(db, 'submissions'), {
  taskId: 'task123',
  teamId: myTeamId,
  userId: otherUserId, // Wrong userId
}); // Should fail
```

### Authentication Testing

- [ ] Unauthenticated users cannot access protected routes
- [ ] Anonymous auth creates proper user ID
- [ ] User session persists across page reloads
- [ ] Logout clears session properly
- [ ] Cannot access Firebase with expired token

---

## Performance Testing

### Database Query Performance

**Test Scenarios:**

1. **Load Team Members (Large Team)**
   - Team with 50+ members
   - Query `/teamMembers` where `teamId == ...`
   - Expected: < 500ms response time

2. **Load Leaderboard (Many Teams)**
   - Event with 100+ teams
   - Query `/teams` ordered by score
   - Expected: < 1s response time

3. **User Profile Lookup**
   - Query `/users/{userId}`
   - Expected: < 200ms response time

**Optimization Checklist:**
- [ ] Composite indexes created for common queries
- [ ] Pagination implemented for large lists
- [ ] Data denormalized where appropriate
- [ ] Real-time listeners use efficient queries

### Frontend Performance

- [ ] Page load time < 3s (3G connection)
- [ ] Time to Interactive < 5s
- [ ] Bundle size < 500KB (gzipped)
- [ ] Images optimized and lazy-loaded
- [ ] No memory leaks from listeners

---

## Migration Testing

### Pre-Migration Dry Run

```bash
npm run migrate-users
```

**Verify Output:**
- [ ] Correct number of teams detected
- [ ] No errors in dry-run
- [ ] All teams show migration preview
- [ ] User creation previews correct
- [ ] TeamMember creation previews correct
- [ ] Submissions count accurate

### Migration Execution

```bash
npm run migrate-users:execute
```

**Monitor During Migration:**
- [ ] Progress indicators working
- [ ] No errors in console
- [ ] Backup created successfully
- [ ] Migration completes without hanging

### Post-Migration Verification

```bash
npm run migrate-users:verify
```

**Database Checks:**

1. **Users Collection**
   ```javascript
   const usersSnapshot = await getDocs(collection(db, 'users'));
   // Should have at least as many users as teams
   expect(usersSnapshot.size).toBeGreaterThanOrEqual(teamCount);
   ```

2. **TeamMembers Collection**
   ```javascript
   const membersSnapshot = await getDocs(collection(db, 'teamMembers'));
   // Should have same count as teams initially (1 owner per team)
   expect(membersSnapshot.size).toBe(teamCount);
   ```

3. **Teams Updated**
   ```javascript
   const team = await getDoc(doc(db, 'teams', teamId));
   expect(team.data().ownerUserId).toBeDefined();
   expect(team.data().memberUserIds).toBeInstanceOf(Array);
   expect(team.data().memberUserIds.length).toBeGreaterThan(0);
   ```

4. **Submissions Updated**
   ```javascript
   const submissionsSnapshot = await getDocs(collection(db, 'submissions'));
   submissionsSnapshot.forEach(doc => {
     expect(doc.data().userId).toBeDefined();
     expect(typeof doc.data().userId).toBe('string');
   });
   ```

### Rollback Testing

**Test in development environment ONLY**

```bash
# Run migration
npm run migrate-users:execute

# Test rollback
npm run migrate-users:rollback

# Verify old state restored
```

Expected after rollback:
- [ ] `/users` collection empty or removed
- [ ] `/teamMembers` collection empty or removed
- [ ] Teams have old schema (uid, displayName)
- [ ] Submissions don't have userId field

---

## Test Coverage Goals

### Minimum Coverage Requirements
- **Services:** 80%+ code coverage
- **Components:** 70%+ code coverage
- **Critical Paths:** 100% coverage
  - User registration
  - Team joining
  - Task submission
  - GDPR deletion

### Coverage Report

```bash
npm run test:coverage
```

Review `coverage/index.html` for detailed report.

---

## Continuous Testing

### Automated Testing (CI/CD)

Add to `.github/workflows/test.yml`:

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run test:run
      - run: npm run type-check
      - run: npm run lint
```

### Pre-Commit Hooks

Install Husky for automated testing:

```bash
npm install --save-dev husky
npx husky init
echo "npm run test:run && npm run type-check" > .husky/pre-commit
```

---

## Reporting Issues

### Bug Report Template

```markdown
**Description:** Brief description of the issue

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Behavior:** What should happen

**Actual Behavior:** What actually happened

**Environment:**
- Browser: Chrome 120
- OS: macOS
- User Role: Team Member
- Team Size: 5 members

**Console Errors:**
\`\`\`
Paste console errors here
\`\`\`

**Screenshots:**
Attach if relevant
```

---

## Testing Sign-Off

### Before Production Deploy

- [ ] All unit tests passing
- [ ] Integration tests passing
- [ ] Manual testing checklist complete
- [ ] Security rules tested
- [ ] Performance benchmarks met
- [ ] Migration tested successfully
- [ ] Rollback tested successfully
- [ ] Documentation updated

**Tested By:** _______________________ Date: _________  
**Approved By:** ____________________ Date: _________  

---

**Version:** 1.0  
**Last Updated:** December 7, 2024
