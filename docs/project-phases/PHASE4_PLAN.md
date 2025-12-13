# Phase 4: Task Submission System

## Overview
Implement the ability for teams to complete tasks by submitting photos, videos, GPS verification, and text answers.

## Goals
- Camera/photo capture from device
- Video recording capability
- GPS location verification
- Text input for quiz answers
- Image compression before upload
- File upload to Firebase Storage
- Create submission records in Firestore
- Update team score and completedTaskIds
- Submission status tracking

## Components to Build

### 1. TaskSubmission.tsx
**Location:** `src/features/tasks/TaskSubmission.tsx`

Main submission interface that shows based on task type:
- GPS tasks: Show distance, "Check In" button
- Photo tasks: Camera capture interface
- Video tasks: Video recording interface
- Quiz tasks: Text input form

**Features:**
- Auto-detect task type
- Show submission requirements
- Display current location vs task location
- Real-time GPS distance calculation
- Submission success/error feedback

### 2. CameraCapture.tsx
**Location:** `src/components/CameraCapture.tsx`

Reusable camera component:
- Access device camera
- Preview before capture
- Retake functionality
- Image compression
- Support both front/back camera

### 3. VideoCapture.tsx
**Location:** `src/components/VideoCapture.tsx`

Video recording component:
- Access device camera for video
- Recording controls (start/stop)
- Time limit (e.g., 30 seconds)
- Preview recorded video
- Video compression/optimization

### 4. QuizInput.tsx
**Location:** `src/components/QuizInput.tsx`

Text input for quiz answers:
- Text area input
- Character limit
- Validation
- Submit button

## Services to Build

### 1. submission.service.ts
**Location:** `src/services/submission.service.ts`

Handle all submission operations:
```typescript
- createSubmission(taskId, teamId, data)
- uploadMedia(file, path)
- verifyGPSLocation(userLat, userLng, taskLat, taskLng, radius)
- updateTeamScore(teamId, points)
- getSubmissionsByTeam(teamId)
- getSubmissionsByTask(taskId)
```

### 2. storage.service.ts
**Location:** `src/services/storage.service.ts`

Firebase Storage operations:
```typescript
- uploadImage(file, path)
- uploadVideo(file, path)
- deleteFile(path)
- getDownloadURL(path)
```

## Implementation Steps

### Step 1: Submission Service ✅
- [x] Create submission.service.ts
- [x] Implement GPS verification
- [x] Implement createSubmission
- [x] Implement updateTeamScore

### Step 2: Storage Service
- [ ] Create storage.service.ts
- [ ] Implement image upload with compression
- [ ] Implement video upload
- [ ] Handle upload progress

### Step 3: Camera Component
- [ ] Create CameraCapture.tsx
- [ ] HTML5 getUserMedia API
- [ ] Canvas for image capture
- [ ] Image preview
- [ ] Retake functionality

### Step 4: Video Component
- [ ] Create VideoCapture.tsx
- [ ] MediaRecorder API
- [ ] Recording controls
- [ ] Time limit enforcement
- [ ] Video preview

### Step 5: Quiz Component
- [ ] Create QuizInput.tsx
- [ ] Text area with validation
- [ ] Character count
- [ ] Submit handling

### Step 6: Main Submission Component
- [ ] Create TaskSubmission.tsx
- [ ] Task type detection
- [ ] Route to correct input component
- [ ] GPS distance display
- [ ] Submission state management

### Step 7: Integration
- [ ] Add submission button to TaskDetail
- [ ] Update team store on completion
- [ ] Refresh task list after submission
- [ ] Show completion status
- [ ] Handle errors gracefully

### Step 8: Testing
- [ ] Test GPS submission
- [ ] Test photo submission
- [ ] Test video submission
- [ ] Test quiz submission
- [ ] Test offline handling
- [ ] Test error cases

## Technical Details

### GPS Verification
```typescript
// Check if user is within task radius
const distance = calculateDistance(
  userLocation.lat, 
  userLocation.lng,
  task.coordinates.lat,
  task.coordinates.lng
);

if (distance <= task.radius) {
  // Allow submission
} else {
  // Show "too far" error
}
```

### Image Compression
Using `browser-image-compression` library:
```typescript
const options = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true
};
const compressedFile = await imageCompression(file, options);
```

### Firebase Storage Structure
```
/submissions/{tenantId}/{eventId}/{teamId}/{taskId}/{timestamp}.jpg
/submissions/{tenantId}/{eventId}/{teamId}/{taskId}/{timestamp}.mp4
```

### Submission Schema
```typescript
interface TaskSubmission {
  id: string;
  taskId: string;
  teamId: string;
  tenantId: string;
  eventId: string;
  type: 'photo' | 'video' | 'gps' | 'text';
  
  // Media fields
  photoUrl?: string;
  videoUrl?: string;
  textAnswer?: string;
  
  // Location data
  submittedLocation?: GeoLocation;
  distanceFromTask?: number;
  
  // Metadata
  status: 'pending' | 'approved' | 'rejected';
  points: number;
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  reviewNotes?: string;
}
```

## Security Considerations

### Firestore Rules
```javascript
match /submissions/{submissionId} {
  // Teams can create submissions
  allow create: if isAuthenticated()
                && request.resource.data.teamId == request.auth.uid;
  
  // Teams can read their own submissions
  allow read: if isAuthenticated()
              && resource.data.teamId == request.auth.uid;
  
  // Only admins can update/delete
  allow update, delete: if false; // Admin SDK only
}
```

### Storage Rules
```javascript
match /submissions/{tenantId}/{eventId}/{teamId}/{fileName} {
  // Teams can upload to their own folder
  allow write: if request.auth != null 
               && request.auth.uid == teamId
               && request.resource.size < 10 * 1024 * 1024; // 10MB limit
  
  // Teams can read their own files
  allow read: if request.auth != null
              && request.auth.uid == teamId;
}
```

## UX Flow

### Photo Task Completion
1. User clicks "Complete Task" button
2. Task detail shows submission interface
3. Camera opens (or file picker on desktop)
4. User takes photo
5. Preview shows with Retake/Submit buttons
6. On Submit:
   - Image compresses
   - Uploads to Storage
   - Creates Firestore submission
   - Updates team score
   - Marks task as completed
7. Success message shows
8. Returns to task list

### GPS Task Completion
1. User navigates to task location
2. App continuously shows distance
3. When within radius, "Check In" button enables
4. User clicks "Check In"
5. GPS location verified
6. Submission created
7. Points awarded immediately
8. Task marked complete

## Error Handling

- **No camera access:** Fallback to file picker
- **Upload fails:** Retry mechanism with exponential backoff
- **GPS disabled:** Prompt user to enable location
- **Outside radius:** Show current distance and required distance
- **Network offline:** Queue submission for later (future enhancement)

## Performance Optimizations

1. **Image Compression:** Reduce file size before upload
2. **Lazy Loading:** Load camera only when needed
3. **Progressive Upload:** Show progress bar for large files
4. **Thumbnail Generation:** Create thumbnails for photo submissions
5. **Caching:** Cache completed submissions locally

## Future Enhancements

- [ ] Offline submission queue
- [ ] Admin approval workflow
- [ ] Photo filters/editing
- [ ] Multiple photo uploads
- [ ] Voice recording for tasks
- [ ] AR features for location tasks
- [ ] Social sharing of submissions

---

**Ready to start implementation!** 🚀
