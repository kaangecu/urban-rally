# Firestore Security Rules - User-Centric System

This document explains the security rules for the user-centric Urban Rally system.

## Overview

The security rules have been updated to support the new multi-user team system where:
- Each user has their own profile in the `users` collection
- Teams track their members via `ownerUserId` and `memberUserIds` arrays
- Individual contributions are tracked in the `teamMembers` collection
- Submissions are linked to both the team and the individual user

## Helper Functions

### `isAuthenticated()`
Returns `true` if the request is from an authenticated user.

### `isTeamOwner(teamId)`
Returns `true` if the authenticated user is the owner of the specified team.
- Checks if `request.auth.uid` matches the team's `ownerUserId`

### `isTeamMember(teamId)`
Returns `true` if the authenticated user is a member of the specified team.
- Checks if `request.auth.uid` is in the team's `memberUserIds` array

### `isUserOwner(userId)`
Returns `true` if the authenticated user owns the specified user profile.
- Checks if `request.auth.uid` matches the `userId` parameter

## Collection Rules

### Users Collection (`/users/{userId}`)

**Purpose:** Store individual user profiles with name and optional email.

**Read Rules:**
- Users can read their own profile only
- `allow read: if isUserOwner(userId)`

**Create Rules:**
- Users can create their own profile during registration
- Must be authenticated and `userId` must match `request.auth.uid`
- The user document's `uid` field must match the `userId` parameter

**Update Rules:**
- Users can only update their own profile
- Can only modify: `displayName`, `email`, `consentGiven`, `updatedAt`
- Cannot change `uid` field (prevents hijacking)

**Delete Rules:**
- Users can delete their own profile (GDPR compliance)
- `allow delete: if isUserOwner(userId)`

### Team Members Collection (`/teamMembers/{teamMemberId}`)

**Purpose:** Track individual contributions and membership in teams.

**Read Rules:**
- All members of a team can read membership records for that team
- `allow read: if isTeamMember(resource.data.teamId)`

**Create Rules:**
- Users can create their own team membership when joining
- Must be authenticated and already a member of the team
- `userId` in the document must match `request.auth.uid`

**Update Rules:**
- Users can only update their own membership record
- Can only modify: `personalScore`, `updatedAt`
- Cannot change `teamId`, `userId`, or `joinedAt`

**Delete Rules:**
- Users can leave a team by deleting their membership
- `allow delete: if request.auth.uid == resource.data.userId`

### Teams Collection (`/teams/{teamId}`)

**Purpose:** Store team information and settings.

**Read Rules:**
- Team members can read their team's data
- Unauthenticated users can query teams (for login by access code)
- ⚠️ DEVELOPMENT: Open read access enabled

**Update Rules:**
- Only the team owner can update team settings
- Cannot change: `tenantId`, `eventId`, `accessCode` (prevents hijacking)
- Can update: `teamDisplayName`, `maxMembers`, `ownerUserId`, `memberUserIds`, `score`, `completedTaskIds`, `inventory`, `currentLocation`, `lastKnownPosition`, `updatedAt`

**Create Rules:**
- ⚠️ DEVELOPMENT: Open create access for test data setup
- TODO: Change to `if false` in production

**Delete Rules:**
- Disabled: `allow delete: if false`

### Submissions Collection (`/submissions/{submissionId}`)

**Purpose:** Store task submissions (photos/videos) by users.

**Read Rules:**
- Team members can read submissions from their team
- `allow read: if isTeamMember(resource.data.teamId)`

**Create Rules:**
- Users can submit for tasks if they are team members
- The `userId` field must match `request.auth.uid`
- The `teamId` must be a team the user is a member of
- Must belong to the correct tenant

**Update/Delete Rules:**
- Disabled: Only Cloud Functions can approve/reject submissions
- `allow update, delete: if false`

### Events Collection (`/events/{eventId}`)

**Read Rules:** Public read access
**Write Rules:** ⚠️ DEVELOPMENT: Open write access (TODO: disable in production)

### Tenants Collection (`/tenants/{tenantId}`)

**Read Rules:** Public read access (for branding)
**Write Rules:** ⚠️ DEVELOPMENT: Open write access (TODO: disable in production)

### Tasks Collection (`/tasks/{taskId}`)

**Read Rules:** Authenticated users or open in development
**Write Rules:** ⚠️ DEVELOPMENT: Open write access (TODO: disable in production)

### Leaderboard Collection (`/leaderboard/{eventId}/entries/{teamId}`)

**Read Rules:** Public read access (for real-time rankings)
**Write Rules:** Disabled - Only Cloud Functions can update

### Admin Collection (`/admins/{userId}`)

**Read Rules:** Admins can read their own profile only
**Write Rules:** Disabled - Only via Admin SDK

## Migration Considerations

When running the migration script:

1. **Before Migration:**
   - Current rules allow team operations with old schema
   - Submissions work with team-only model

2. **After Migration:**
   - Updated rules enforce user-centric model
   - All submissions must have valid `userId`
   - Teams must have valid `ownerUserId` and `memberUserIds`
   - New `users` and `teamMembers` collections protected

3. **Testing:**
   - Test creating a new user profile
   - Test joining a team as a new user
   - Test submitting a task with `userId`
   - Test reading team members list
   - Test GDPR user deletion

## Security Best Practices

1. **User Ownership:** Users can only modify their own data
2. **Team Isolation:** Team members can only access their team's data
3. **Immutable Fields:** Critical fields like `uid`, `teamId`, `accessCode` cannot be changed
4. **GDPR Compliance:** Users can delete their own profiles
5. **Cloud Function Control:** Sensitive operations (approvals, leaderboard) only via backend

## Development vs Production

⚠️ **Current State:** Several collections have open write access for development/testing.

**Before Production Deploy:**
1. Change `tenants` write rules to `if false`
2. Change `events` write rules to `if false`
3. Change `tasks` write rules to `if false`
4. Change `teams` create rules to controlled creation flow
5. Review all `|| true` development overrides

## Testing the Rules

### Test User Profile Operations
```javascript
// Create user profile
await setDoc(doc(db, 'users', currentUser.uid), {
  uid: currentUser.uid,
  displayName: 'Test User',
  email: 'test@example.com',
  consentGiven: true,
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
});

// Update own profile - should succeed
await updateDoc(doc(db, 'users', currentUser.uid), {
  displayName: 'Updated Name'
});

// Try to update another user's profile - should fail
await updateDoc(doc(db, 'users', 'someOtherUserId'), {
  displayName: 'Hacker'
}); // ❌ Permission denied
```

### Test Team Member Operations
```javascript
// Read team members (as team member) - should succeed
const membersSnapshot = await getDocs(
  query(collection(db, 'teamMembers'), where('teamId', '==', myTeamId))
);

// Update own personal score - should succeed
await updateDoc(doc(db, 'teamMembers', myMemberId), {
  personalScore: 100
});

// Try to update another member's score - should fail
await updateDoc(doc(db, 'teamMembers', otherMemberId), {
  personalScore: 999
}); // ❌ Permission denied
```

### Test Submission Operations
```javascript
// Submit task as team member - should succeed
await addDoc(collection(db, 'submissions'), {
  taskId: 'task123',
  teamId: myTeamId,
  userId: currentUser.uid, // REQUIRED
  tenantId: 'tenant123',
  status: 'pending',
  // ... other fields
});

// Try to submit without userId - should fail
await addDoc(collection(db, 'submissions'), {
  taskId: 'task123',
  teamId: myTeamId,
  // missing userId
}); // ❌ Permission denied
```

## Monitoring & Debugging

1. **Firebase Console:** Check security rules tab for denied requests
2. **Rules Playground:** Test rules with sample data before deploying
3. **Client Logs:** Check for "permission-denied" errors in console
4. **Audit Trail:** Monitor who accesses what data

## Version History

- **v2.0** (Dec 2024): User-centric system with users and teamMembers collections
- **v1.0** (Previous): Team-centric system with team.uid authentication
