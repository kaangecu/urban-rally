# Firebase Storage Rules Setup Guide

## Problem
Storage rules were blocking photo/video uploads for task submissions with error:
```
Firebase Storage: User does not have permission to access 'submissions/...' (storage/unauthorized)
```

## Solution

### Update Storage Rules

The storage rules need to match the actual upload paths used by the application.

**Current Upload Path:**
```
submissions/{tenantId}/{eventId}/{teamId}/{taskId}/{fileName}
```

**Example:**
```
submissions/urban-chase/night-chase-2025/team-test-02/task-east-side-gallery/photo-1234567890.jpg
```

### Steps to Update

#### Option A: Firebase Console (Recommended)

1. **Open Firebase Console:**
   - Go to: https://console.firebase.google.com/
   - Select project: **urban-rally-539bd**

2. **Navigate to Storage Rules:**
   - Click **Storage** in left sidebar
   - Click **Rules** tab at top

3. **Update Rules:**
   Replace the entire content with the rules from `storage.rules` file.

4. **Publish:**
   - Click **Publish** button
   - Wait for confirmation: "Rules published successfully"

#### Option B: Firebase CLI

```bash
# Deploy storage rules only
firebase deploy --only storage
```

### Current Rules Configuration

The updated `storage.rules` file includes:

1. **Task Submissions** (`/submissions/...`)
   - ✅ Teams can upload their own photos/videos
   - ✅ Authenticated users can read submissions
   - ✅ Images: Max 5MB
   - ✅ Videos: Max 50MB
   - ✅ Validates content type (image/* or video/*)

2. **General Uploads** (`/uploads/...`)
   - ✅ Teams can upload photos
   - ✅ Public read access
   - ✅ Images only, max 5MB

3. **Tenant/Sponsor Assets** (`/tenants/...`, `/sponsors/...`)
   - ✅ Public read access
   - ❌ Admin SDK write only

### Security Features

**Authentication Required:**
```javascript
function isAuthenticated() {
  return request.auth != null;
}
```

**Team Ownership Verification:**
```javascript
// Only allow teams to upload their own submissions
request.auth.uid == teamId
```

**File Size Limits:**
```javascript
// Images: 5MB max
function isValidImageSize() {
  return request.resource.size < 5 * 1024 * 1024;
}

// Videos: 50MB max
function isValidVideoSize() {
  return request.resource.size < 50 * 1024 * 1024;
}
```

**Content Type Validation:**
```javascript
function isImage() {
  return request.resource.contentType.matches('image/.*');
}

function isVideo() {
  return request.resource.contentType.matches('video/.*');
}
```

### Testing Upload Functionality

After updating rules:

1. **Start Dev Server:**
   ```bash
   npm run dev
   ```

2. **Login:**
   - Use team code: **CHASE2025** or **BERLIN2025**

3. **Test Photo Upload:**
   - Click a PHOTO task
   - Click "Start Task"
   - Click "Enable Camera"
   - Take a photo
   - Click "Use Photo"
   - ✅ Should upload successfully

4. **Test Video Upload:**
   - Click a VIDEO task
   - Click "Start Task"
   - Click "Enable Camera & Mic"
   - Record a short video (3-5 seconds)
   - Click "Stop Recording"
   - Click "Use Video"
   - ✅ Should upload successfully

### Verification

Check that uploads succeeded:

1. **Firebase Console:**
   - Go to Storage → Files
   - Navigate to: `submissions/urban-chase/night-chase-2025/team-test-02/`
   - You should see uploaded files

2. **Browser Console:**
   - Should see: "Upload complete: [download URL]"
   - No 403 errors

3. **Firestore:**
   - Go to Firestore Database
   - Navigate to: `submissions` collection
   - Check for new submission documents

### Troubleshooting

**Still getting 403 errors?**

1. **Check rules are published:**
   - Firebase Console → Storage → Rules
   - Verify the updated rules are shown
   - Check timestamp shows recent update

2. **Check authentication:**
   ```javascript
   // In browser console
   firebase.auth().currentUser
   // Should show user object with uid matching team ID
   ```

3. **Check path format:**
   ```javascript
   // Correct path structure
   submissions/{tenantId}/{eventId}/{teamId}/{taskId}/{fileName}
   ```

4. **Check file size:**
   - Images must be < 5MB
   - Videos must be < 50MB
   - Check actual file size in DevTools → Network tab

5. **Hard refresh:**
   - Clear browser cache
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

**Upload works but download fails?**

Make sure `allow read` is included:
```javascript
match /submissions/{tenantId}/{eventId}/{teamId}/{taskId}/{fileName} {
  allow read: if isAuthenticated(); // ← This line is required
}
```

### Production Considerations

For production deployment, consider:

1. **Stricter file validation:**
   - Check specific MIME types
   - Validate image dimensions
   - Scan for malicious content

2. **Rate limiting:**
   - Limit uploads per team per hour
   - Prevent spam/abuse

3. **Quota management:**
   - Monitor storage usage
   - Set up billing alerts
   - Implement cleanup for old submissions

4. **CDN integration:**
   - Use Firebase CDN for faster delivery
   - Consider image optimization service

### Related Documentation

- `docs/HTTPS_SETUP.md` - Required for camera access
- `docs/MOBILE_CAMERA_FIXES.md` - Camera UI fixes
- `docs/FIREBASE_SETUP_GUIDE.md` - Firestore rules setup
- `firestore.rules` - Database security rules
- `storage.rules` - Storage security rules (this file)

### File Locations

- **Storage Rules:** `/storage.rules`
- **Upload Service:** `/src/services/storage.service.ts`
- **Submission Logic:** `/src/features/submissions/TaskSubmission.tsx`

### Support

If issues persist:
1. Check Firebase Console → Storage → Usage for quota limits
2. Verify Firebase project billing is enabled
3. Check browser console for detailed error messages
4. Test with different file sizes/types
5. Try uploading from different browsers/devices
