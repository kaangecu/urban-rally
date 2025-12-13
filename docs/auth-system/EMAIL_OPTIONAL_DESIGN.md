# User Email Field - Design Decision

## Question: Should email be optional?

**Answer: YES ✅** - Email should remain optional.

---

## Rationale

### 1. Anonymous Authentication Model
- Urban Rally uses **Firebase Anonymous Authentication**
- Each session creates a **new anonymous user ID**
- Users don't log in with email/password
- Email is **not** used for authentication

### 2. Email Purpose
Email is used for:
- ✅ Optional notifications (if user provides it)
- ✅ Optional contact information
- ✅ Team coordination (optional)

Email is **NOT** used for:
- ❌ Authentication
- ❌ User identification
- ❌ Session management
- ❌ Finding existing accounts

### 3. User Experience
**Without email requirement:**
- ✅ Faster onboarding (one less field)
- ✅ Privacy-friendly (GDPR compliant)
- ✅ Lower friction for students
- ✅ No validation errors
- ✅ Works for users without email access

**With email requirement:**
- ❌ Extra barrier to entry
- ❌ Users might provide fake emails
- ❌ Privacy concerns
- ❌ Not needed for core functionality

### 4. Technical Implementation

#### User Creation Flow
```typescript
// 1. User enters team access code
// 2. User provides display name
// 3. User optionally provides email  ← OPTIONAL
// 4. User accepts terms
// 5. Create anonymous Firebase Auth user
// 6. Create User document with data
// 7. Add user to team
```

#### Email Handling
```typescript
const user = await getOrCreateUser({
  displayName: 'John Doe',
  email: formData.email || undefined,  // ← Optional, can be undefined
  tenantId: tenant.id,
  consentGiven: { /* ... */ }
});
```

#### Database Schema
```typescript
interface User {
  uid: string;
  displayName: string;  // Required
  email?: string;       // Optional ← Notice the ?
  // ...
}
```

### 5. Previous Bug (Now Fixed)

**The Problem:**
```typescript
// OLD CODE - BROKEN
if (data.email) {
  // Try to find existing user by email
  const existingUser = await getUserByEmail(data.email, tenantId);
  // ❌ This failed with "permission denied" because:
  // - Query runs BEFORE user is authenticated
  // - Firestore rules require authentication to query users
  // - Chicken-and-egg problem!
}
```

**The Solution:**
```typescript
// NEW CODE - FIXED
export async function getOrCreateUser(data) {
  // Just create a new user - no email lookup needed
  // Anonymous auth means new user per session anyway
  return await createUser(data);
}
```

---

## Use Cases

### Scenario 1: User WITHOUT Email
```
User: "Max"
Email: [blank]
Result: ✅ Account created successfully
```

### Scenario 2: User WITH Email
```
User: "Anna"  
Email: "anna@example.com"
Result: ✅ Account created successfully (email stored for notifications)
```

### Scenario 3: Multiple Sessions (Same Person)
```
Session 1: Max creates account (UserID: abc123)
Session 2: Max creates account again (UserID: def456)
Result: ✅ Two separate accounts (anonymous auth behavior)
Note: This is expected! User should rejoin team with access code
```

---

## Firestore Security Rules

### Users Collection Rules
```javascript
match /users/{userId} {
  // Users can read their own profile
  allow read: if isUserOwner(userId);
  
  // Authenticated users can list/query users (e.g., team members)
  allow list: if isAuthenticated();
  
  // Users can create their own profile
  allow create: if isAuthenticated() 
                && request.auth.uid == userId;
}
```

**Why no pre-auth queries?**
- Security: Prevent data scraping
- Privacy: User emails not publicly queryable
- Design: Email not used for authentication

---

## Best Practices

### ✅ DO
- Keep email optional
- Validate email format if provided (client-side)
- Use email for notifications only
- Store email as lowercase
- Allow users to update email later

### ❌ DON'T
- Make email required
- Use email as primary identifier
- Query users by email before authentication
- Assume email is unique across users
- Use email for login/authentication

---

## FAQ

**Q: What if the same person joins multiple times?**  
A: They'll have multiple user accounts (anonymous auth). They can join the same team multiple times with different names if needed, or use the same access code to rejoin.

**Q: Can we find a user by their email?**  
A: Only after authentication, and only if they're in your team (for privacy).

**Q: Should we prevent duplicate emails?**  
A: No - email is optional metadata, not a unique identifier.

**Q: What if a user wants to change their email?**  
A: They can update it in their profile settings.

**Q: Can we send notifications without email?**  
A: Yes - use push notifications or in-app notifications instead.

**Q: Should we validate email format?**  
A: Yes, on the client-side for UX, but it's optional so validation failures should not block submission.

---

## Migration Impact

**Existing Teams:**
- Users created during migration have email set to `undefined` (optional)
- No data loss
- All users can update email later if desired

**New Users:**
- Can sign up with or without email
- No difference in functionality
- Email only affects notification preferences

---

## Future Considerations

### If You Want Email-Based Login Later:
1. Add email/password authentication
2. Make email required for that flow
3. Keep anonymous auth for quick play
4. Allow account linking

### If You Want to Prevent Duplicates:
1. Add server-side duplicate detection
2. Use email + tenant ID as compound key
3. Show warning: "Email already registered, continue anyway?"
4. Don't block creation (users might share emails)

---

## Conclusion

**Email should remain OPTIONAL because:**
1. ✅ Not needed for core functionality
2. ✅ Anonymous auth doesn't use email
3. ✅ Better user experience
4. ✅ More privacy-friendly
5. ✅ Fewer errors and friction

**Current implementation is correct ✅**

---

**Last Updated:** December 7, 2024  
**Decision:** Email remains optional  
**Status:** Working as intended
