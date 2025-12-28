# First Super Admin Setup Guide

**Purpose:** This guide walks you through creating the first super admin account for Urban Rally. This is a one-time manual process that requires Firebase project owner access.

**Estimated Time:** 15-20 minutes

**Prerequisites:**
- Firebase project owner or editor access
- Email/password authentication enabled in Firebase Console
- Cloud Functions deployed to Firebase

---

## Step 1: Enable Email/Password Authentication

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your Urban Rally project
3. Navigate to **Authentication** → **Sign-in method** (left sidebar)
4. Find **Email/Password** in the provider list
5. Click the row, toggle **Enable** to ON
6. Click **Save**

**Verification:** You should see "Email/Password" status as "Enabled" in the provider list.

---

## Step 2: Create First Admin User Account

### Option A: Via Firebase Console (Recommended)

1. In Firebase Console, stay in **Authentication** section
2. Click **Users** tab at the top
3. Click **Add user** button (top-right)
4. Fill in the form:
   - **Email:** Your admin email (e.g., `admin@yourorganization.com`)
   - **Password:** Strong password (min 8 characters)
   - **User UID:** Leave auto-generated
5. Click **Add user**
6. **Copy the UID** from the user list (you'll need this in Step 3)

### Option B: Via Application (If Auth is Already Live)

1. Open your Urban Rally app at `/admin/login`
2. Click **"Create account"** link (if available)
3. Enter admin email and password
4. Submit the form
5. Open Firebase Console → Authentication → Users
6. Find your newly created user and **copy the UID**

**Verification:** User appears in Authentication > Users list with status "Enabled".

---

## Step 3: Set Super Admin Role via Cloud Function

Now we need to set Firebase Custom Claims to grant super admin privileges.

### Method 1: Using Firebase Functions Emulator (Development)

1. Open terminal in your Urban Rally project directory
2. Start Firebase emulators if not already running:
   ```bash
   firebase emulators:start
   ```
3. Open another terminal tab/window
4. Run the following command (replace `[USER_UID]` with the UID from Step 2):
   ```bash
   curl -X POST http://127.0.0.1:5001/[YOUR_PROJECT_ID]/[REGION]/setUserRole \
     -H "Content-Type: application/json" \
     -d '{
       "data": {
         "uid": "[USER_UID]",
         "role": "superadmin",
         "tenantId": "global"
       }
     }'
   ```
   
   **Example:**
   ```bash
   curl -X POST http://127.0.0.1:5001/urban-rally-dev/europe-west3/setUserRole \
     -H "Content-Type: application/json" \
     -d '{
       "data": {
         "uid": "ABC123xyz456",
         "role": "superadmin",
         "tenantId": "global"
       }
     }'
   ```

### Method 2: Using Firebase Console (Production)

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Navigate to **Functions** section (left sidebar)
3. Find the `setUserRole` function in the list
4. Click the function name → Open **Logs** tab
5. Click **Test function** (top-right)
6. Paste this JSON payload (replace `[USER_UID]` with actual UID):
   ```json
   {
     "data": {
       "uid": "[USER_UID]",
       "role": "superadmin",
       "tenantId": "global"
     }
   }
   ```
7. Click **Run**
8. Check logs for success message: "Role set successfully"

### Method 3: Using Node.js Script (Advanced)

If you prefer automation, create a script:

```javascript
// scripts/create-superadmin.js
const admin = require('firebase-admin');
const serviceAccount = require('../path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function createSuperAdmin(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, {
      role: 'superadmin',
      tenantId: 'global'
    });
    console.log('✅ Super admin role set successfully for UID:', uid);
    
    // Verify claims
    const user = await admin.auth().getUser(uid);
    console.log('Custom claims:', user.customClaims);
  } catch (error) {
    console.error('❌ Error setting super admin role:', error);
  }
  process.exit();
}

// Replace with your user UID
createSuperAdmin('YOUR_USER_UID_HERE');
```

Run with:
```bash
node scripts/create-superadmin.js
```

**Verification:** Check Cloud Functions logs for success message. Logs should show:
```
Role set successfully for user: [UID]
Custom claims: { role: 'superadmin', tenantId: 'global' }
```

---

## Step 4: Verify Super Admin Access

1. Open your Urban Rally app at `/admin/login`
2. Enter the email and password from Step 2
3. Click **Sign In**
4. You should be redirected to `/admin` (Admin Dashboard)
5. Verify you see the 🛡️ **Admin View** toggle button (bottom-right)
6. Click the toggle to enter admin mode
7. Verify you can access:
   - `/admin/events` (Event Management)
   - `/admin/tasks` (Task Management)
   - `/admin/review` (Submission Review)

**Success Indicators:**
- No "Permission Denied" errors
- Admin sidebar appears on desktop
- Admin routes are accessible
- User role badge shows "Super Admin" in UI

---

## Step 5: Create Additional Admin Users (Optional)

Now that you have super admin access, you can create other admin users via the UI:

1. Log in as super admin
2. Navigate to `/admin/users` (if implemented)
3. Click **"Add Admin"** button
4. Fill in form:
   - Email
   - Role (admin/organizer/moderator)
   - Tenant (select from list)
5. Submit form
6. System sends email invite to new admin

**Note:** In MVP, this feature is manual. Use Step 3 (Cloud Function) to create additional admins until User Management UI is built in Phase 2.

---

## Troubleshooting

### Issue: "Email/password is not enabled"
**Solution:** Revisit Step 1. Ensure Email/Password provider is toggled ON and saved.

### Issue: "User not found" after login
**Solution:** 
- Check Firebase Console → Authentication → Users
- Verify user email matches exactly (case-sensitive)
- Try password reset if locked out

### Issue: "Permission denied" when accessing /admin routes
**Solution:**
- Verify custom claims were set correctly:
  ```javascript
  // In browser console after login
  firebase.auth().currentUser.getIdTokenResult().then(idTokenResult => {
    console.log(idTokenResult.claims);
  });
  ```
- Claims should include `{ role: 'superadmin', tenantId: 'global' }`
- If missing, repeat Step 3

### Issue: Cloud Function `setUserRole` returns error
**Possible Causes:**
1. **Function not deployed:** Run `firebase deploy --only functions`
2. **Invalid UID format:** Check UID has no spaces or special characters
3. **Insufficient permissions:** Ensure you're project owner/editor
4. **CORS error:** Add `{cors: true}` to function options (should be default)

**Debug Steps:**
- Check Cloud Functions logs in Firebase Console
- Look for error stack traces
- Verify function deployed: `firebase functions:list`

### Issue: Login works but admin routes show 404
**Solution:**
- Check React Router configuration in `src/App.tsx`
- Verify `isAdminMode` state is true
- Check `AdminModeToggle` component renders
- Inspect browser console for routing errors

---

## Security Best Practices

1. **Use a Strong Password:**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Use password manager (1Password, Bitwarden)

2. **Enable 2FA (Two-Factor Authentication):**
   - Firebase Console → Authentication → Sign-in method
   - Enable "Email link (passwordless sign-in)"
   - Or use third-party 2FA provider

3. **Restrict Super Admin Count:**
   - Ideally 1-2 super admins per organization
   - Use `admin` or `organizer` roles for day-to-day operations
   - Super admin reserved for system-level changes only

4. **Audit Log Monitoring:**
   - Regularly check Firestore `auditLogs` collection
   - Look for suspicious role changes or data modifications
   - Set up Cloud Monitoring alerts for failed login attempts

5. **Rotate Service Account Keys:**
   - If using Method 3 (Node.js script), never commit `serviceAccountKey.json` to Git
   - Rotate keys every 90 days in Firebase Console
   - Store keys in secure vault (Google Secret Manager, AWS Secrets Manager)

---

## Next Steps

After super admin is set up:

1. **Create First Tenant:**
   - Navigate to `/admin/tenants` (if implemented)
   - Click "Create Tenant"
   - Fill in organization details (name, subdomain, branding)

2. **Create First Event:**
   - Navigate to `/admin/events`
   - Click "Create Event"
   - Fill in event details (name, date, location)
   - Generate event code (auto-suggested)

3. **Create Admin Team:**
   - Test player experience by joining event with team code
   - Toggle between admin/player modes to verify dual-mode navigation

4. **Invite Moderators:**
   - Use Step 3 (Cloud Function) to create moderator accounts
   - Share admin login URL: `https://yourdomain.com/admin/login`
   - Provide onboarding doc for moderators

---

## Emergency Account Recovery

If you lose access to the super admin account:

### Option 1: Firebase Console Override (Project Owner Only)
1. Open Firebase Console → Authentication → Users
2. Find the locked user
3. Click three-dot menu → **Reset password**
4. Enter new password
5. Optionally: Click **Disable** → **Enable** to unlock account

### Option 2: Create New Super Admin (Project Owner Only)
1. Repeat Steps 2-3 with a new email
2. Disable the old super admin account in Firebase Console
3. Update internal documentation with new super admin email

### Option 3: Export/Import Users (Last Resort)
1. Export users from Firebase Console
2. Manually edit JSON to add custom claims
3. Re-import users
4. **Warning:** This is destructive. Test in staging environment first.

---

## Reference: Custom Claims Structure

Urban Rally uses the following custom claims schema:

```typescript
interface CustomClaims {
  role: 'superadmin' | 'admin' | 'organizer' | 'moderator' | 'player';
  tenantId: string; // 'global' for super admin, specific tenant ID for others
}
```

**Role Hierarchy:**
- **superadmin:** Full access across all tenants (system-level)
- **admin:** Full access within assigned tenant
- **organizer:** Can create/manage events and tasks for their tenant
- **moderator:** Can review submissions and manage teams for their tenant
- **player:** Can join events, submit tasks, view leaderboards

**Permission Matrix:**

| Action | Super Admin | Admin | Organizer | Moderator | Player |
|--------|-------------|-------|-----------|-----------|--------|
| Create Tenant | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Event | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create Task | ✅ | ✅ | ✅ | ❌ | ❌ |
| Review Submission | ✅ | ✅ | ✅ | ✅ | ❌ |
| Join Event | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit Task | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## FAQ

**Q: Can I create super admin via the app UI?**  
A: No. Super admin creation is intentionally manual to prevent security exploits. Only Firebase project owners can create super admins via Console or Cloud Functions.

**Q: How many super admins should we have?**  
A: Recommend 1-2 per organization. Super admin is for system administration. Day-to-day operations should use `admin` or `organizer` roles.

**Q: Can a super admin participate in events as a player?**  
A: Yes! Use the Admin/Player Mode Toggle button (🛡️/👤) to switch between admin and player views. Your role doesn't restrict player functionality.

**Q: What if I forget the super admin password?**  
A: Use Firebase Console → Authentication → Users → Reset password. Or create a new super admin and disable the old one.

**Q: Can I delete the super admin account later?**  
A: Yes, but ensure you have at least one other super admin first. Never delete the last super admin account.

**Q: How do I check if custom claims are set correctly?**  
A: Log in to the app, open browser console, run:
```javascript
firebase.auth().currentUser.getIdTokenResult().then(r => console.log(r.claims));
```
You should see `{ role: 'superadmin', tenantId: 'global' }`.

**Q: Can I automate super admin creation in CI/CD?**  
A: Not recommended. Super admin should be created once manually. For testing, use Firebase Emulator with seeded data.

---

**Document Version:** 1.0  
**Last Updated:** December 28, 2025  
**Maintained By:** Urban Rally Dev Team

**Related Docs:**
- [Admin Portal Development Plan](./ADMIN_PORTAL_DEVELOPMENT_PLAN.md)
- [Admin UI Design System](./admin_portal_style.md)
- [Multi-Tenant Architecture](../architecture/MULTI_TENANT.md)
