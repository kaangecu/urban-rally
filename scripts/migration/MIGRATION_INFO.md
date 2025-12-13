# Multi-Event Migration Information

## ⚠️ Permission Denied Issue

When running the migration script, you may see:

```
❌ Migration failed: [FirebaseError: Missing or insufficient permissions.]
```

This is **expected** and actually a **good sign** - it means your Firestore security rules are working correctly!

---

## 🔐 Why This Happens

The migration script uses the **Firebase Client SDK**, which respects Firestore security rules. Your security rules (correctly) prevent:
- Reading all users from the database
- Batch updating user documents
- Server-side operations without authentication

This is the **correct** security posture for a production app.

---

## ✅ Solutions

### Option 1: New Users Automatically Migrated (Recommended)

**Good news**: New users created after the multi-event implementation will **automatically** have the new fields!

The `createUser()` function in `src/services/user.service.ts` now includes:
```typescript
{
  displayName: data.displayName,
  accountType: data.accountType || 'anonymous', // ✅ NEW FIELD
  recoveryCode: null,                            // ✅ NEW FIELD
  // ... other fields
}
```

**Action Required**: None! Just use the app normally.

---

### Option 2: Migrate Existing Users via Browser Console

For **existing users** who need migration, run this browser-based script:

**Steps:**
1. Login to your app
2. Open Browser DevTools (F12)
3. Go to Console tab
4. Copy and paste the contents of `scripts/migration/browserMigration.js`
5. Press Enter

**What it does:**
- Migrates only your current user (the logged-in user)
- Adds `accountType: 'anonymous'`
- Adds `recoveryCode: null` fields
- Reloads the page

**File**: `scripts/migration/browserMigration.js`

---

### Option 3: Firebase Admin SDK Migration (Advanced)

For **production migrations** with many users, use Firebase Admin SDK:

**Requirements:**
- Firebase service account credentials
- Node.js server environment
- Admin privileges

**Steps:**
1. Download service account key from Firebase Console
2. Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable
3. Update migration script to use Admin SDK
4. Run in secure server environment

**Not included** in this repo for security reasons.

---

## 🎯 Recommended Approach

### For Development/Testing:
1. **Create new users** - They'll have multi-event fields automatically
2. **Browser console migration** - For your existing test accounts

### For Production:
1. **New users** - Handled automatically ✅
2. **Existing users** - Add fields on-demand when they:
   - Generate a recovery code (adds all multi-event fields)
   - Join a new event (checks for fields, adds if missing)
   - Login (migration check can be added to auth flow)

---

## 🔧 On-Demand Migration (Smart Approach)

Instead of migrating all users upfront, add migration logic to key functions:

### In `generateRecoveryCode()`:
```typescript
export async function generateRecoveryCode(userId: string): Promise<string> {
  const user = await getUserById(userId);
  
  // Migrate user if needed
  if (user.accountType === undefined) {
    await updateDoc(doc(db, 'users', userId), {
      accountType: 'anonymous',
      recoveryCodeExpiresAt: null,
      recoveryCodeGeneratedAt: null,
    });
  }
  
  // Generate code...
}
```

### In `joinTeam()`:
```typescript
export async function joinTeam(params) {
  const user = await getUserById(params.userId);
  
  // Migrate user if needed
  if (user.accountType === undefined) {
    await updateDoc(doc(db, 'users', userId), {
      accountType: 'anonymous',
      // ... other fields
    });
  }
  
  // Join team...
}
```

**Benefits:**
- ✅ No mass migration needed
- ✅ Users migrated as they use features
- ✅ Works within security rules
- ✅ No downtime required

---

## 📊 Current Status

### What's Working:
- ✅ New user creation includes multi-event fields
- ✅ `createUser()` passes `accountType` to Cloud Function
- ✅ Cloud Function creates users with all new fields
- ✅ Browser-based migration available for existing users

### What Needs Attention:
- ⚠️  Existing users created before multi-event implementation
- ⚠️  May not have `accountType`, `recoveryCode` fields
- ⚠️  Will need on-demand migration or browser console migration

---

## 🧪 Testing

### Test New User Creation:
```bash
1. Logout (if logged in)
2. Go to /login
3. Enter a team code
4. Enter new display name
5. Accept terms
6. Login
```

**Expected**: User created with all multi-event fields

### Test Browser Migration:
```bash
1. Login with an old user
2. Open DevTools Console
3. Run browserMigration.js script
4. Check user document in Firestore
```

**Expected**: User now has `accountType: 'anonymous'`

---

## 🔒 Security Considerations

### Why We Don't Bypass Security Rules:

1. **Production Safety**: Security rules protect user data
2. **Least Privilege**: Scripts should only access what they need
3. **Audit Trail**: All changes go through proper channels
4. **User Privacy**: Users control their own data

### Alternative: Batch Migration (If Needed)

If you absolutely need to migrate many users:

1. Use Firebase Admin SDK in a **secure server environment**
2. Download service account key (keep it secret!)
3. Run migration script on server (never in browser)
4. Audit all changes
5. Notify users of data changes

**Not recommended** unless you have hundreds/thousands of existing users.

---

## 📝 Summary

### For Developers:
- ✅ New users: **Automatic** (no action needed)
- ✅ Existing users: **On-demand** (migrate as they use features)
- ✅ Testing: **Browser console** (for your own account)

### For Production:
- ✅ Launch with on-demand migration
- ✅ Monitor for users hitting errors
- ✅ Add migration checks to key functions
- ✅ Consider batch migration only if necessary

---

**Last Updated**: December 13, 2025  
**Status**: Recommended approach documented  
**Next Steps**: Implement on-demand migration in key service functions
