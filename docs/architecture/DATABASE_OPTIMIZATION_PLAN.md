# Database Optimization & Future Task Types Plan

## 📊 Current State Analysis

### Task Schema Issues & Optimizations

#### 🔴 **Critical Issues**

1. **Type Polymorphism Problem**
   - Current schema uses optional fields for different task types
   - `quizType`, `quizOptions`, `quizCorrectAnswer` only used for QUIZ tasks
   - `coordinates`, `radius` only used for GPS tasks
   - `videoAdUrl`, `requiresVideoAd` only used for SPONSORED tasks
   - **Result:** Sparse document storage, wasted indexes, unclear validation

2. **Missing Composite Indexes**
   ```typescript
   // Common query patterns not optimized:
   - WHERE tenantId = X AND eventId = Y AND isActive = true
   - WHERE eventId = X ORDER BY order ASC
   - WHERE eventId = X AND type = Y AND isActive = true
   - WHERE eventId = X AND unlockAt <= NOW()
   ```

3. **No Geospatial Indexing**
   - `coordinates` stored as object, not GeoPoint
   - Can't use Firestore's geospatial queries
   - Inefficient radius searches (client-side filtering)

4. **Redundant Boolean Flags**
   - `requiresPhoto`, `requiresVideo`, `requiresText` can be derived from `type`
   - Violates DRY principle
   - Risk of inconsistent data (type=PHOTO but requiresPhoto=false)

5. **Hints in Task Document**
   - Hints array grows unbounded
   - Every task query fetches all hints (even if not purchased)
   - Should be separate subcollection

---

## ✅ **Recommended Optimizations**

### 1. **Polymorphic Task Types (Discriminated Union)**

Split into type-specific interfaces using TypeScript discriminated unions:

```typescript
// Base interface with common fields
interface BaseTask extends MultiTenantEntity {
  id: string;
  eventId: string;
  title: string;
  description: string;
  imageUrl?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points: number;
  bonusPoints?: number;
  order?: number;
  dependsOn?: string[];
  unlockAt?: Date;
  expiresAt?: Date;
  isActive: boolean;
  
  // Sponsor fields (optional for all types)
  sponsorId?: string;
  sponsorName?: string;
  sponsorLogoUrl?: string;
  
  // Metadata for analytics
  completionCount?: number; // Denormalized count
  averageCompletionTime?: number; // In seconds
  successRate?: number; // 0-100
}

// GPS Location Task
interface GPSTask extends BaseTask {
  type: 'GPS' | 'GPS_LOCATION';
  coordinates: FirebaseFirestore.GeoPoint; // Use native GeoPoint!
  radius: number; // Required for GPS tasks
  locationName?: string; // "Brandenburg Gate"
  locationHint?: string; // "Near the famous landmark"
  requiresPhoto?: boolean; // Optional photo proof
}

// Photo Challenge Task
interface PhotoTask extends BaseTask {
  type: 'PHOTO';
  coordinates?: FirebaseFirestore.GeoPoint; // Optional GPS requirement
  radius?: number;
  photoPrompt: string; // "Take a selfie with..."
  photoExamples?: string[]; // Example photo URLs
  requiresGPS?: boolean; // Must be at location
  minPhotos?: number; // Default 1
  maxPhotos?: number; // Default 1
}

// Video Challenge Task
interface VideoTask extends BaseTask {
  type: 'VIDEO';
  coordinates?: FirebaseFirestore.GeoPoint;
  radius?: number;
  videoPrompt: string;
  minDuration?: number; // Seconds
  maxDuration?: number; // Seconds (e.g., 30s)
  requiresGPS?: boolean;
}

// Quiz Task
interface QuizTask extends BaseTask {
  type: 'QUIZ';
  quiz: {
    questionType: 'multiple-choice' | 'text' | 'number' | 'true-false';
    question: string;
    options?: string[]; // For multiple-choice
    correctAnswer: string | number | boolean;
    hint?: string;
    explanation?: string; // Shown after submission
    timeLimit?: number; // Seconds (0 = no limit)
    allowPartialCredit?: boolean;
    partialCreditPercent?: number; // Default 50
  };
}

// QR Code Scan Task
interface QRCodeTask extends BaseTask {
  type: 'QR_CODE';
  qrCodeId: string; // Expected QR code content
  coordinates?: FirebaseFirestore.GeoPoint; // Where QR is located
  radius?: number;
  validationPattern?: string; // Regex for QR content
}

// Checkpoint Task (Sequential)
interface CheckpointTask extends BaseTask {
  type: 'CHECKPOINT';
  checkpointNumber: number; // Must complete in order
  coordinates: FirebaseFirestore.GeoPoint;
  radius: number;
  requiresPhoto?: boolean;
  requiresCheckin?: boolean; // Just GPS proof
}

// Sponsored/Branded Task
interface SponsoredTask extends BaseTask {
  type: 'SPONSORED';
  sponsorId: string; // Required for sponsored
  taskSubtype: 'GPS' | 'PHOTO' | 'VIDEO' | 'QUIZ'; // What to actually do
  requiresVideoAd: boolean;
  videoAdUrl?: string;
  adDuration?: number; // Seconds
  sponsorCallToAction?: string; // "Visit our store!"
  sponsorWebsite?: string;
  
  // Nested task details based on subtype
  taskDetails: GPSTask | PhotoTask | VideoTask | QuizTask;
}

// Wildcard/Creative Task
interface WildcardTask extends BaseTask {
  type: 'WILDCARD';
  customInstructions: string;
  acceptanceCriteria: string[];
  requiresPhoto?: boolean;
  requiresVideo?: boolean;
  requiresText?: boolean;
  judgedManually: boolean; // Needs admin approval
}

// Union type for all tasks
export type Task = 
  | GPSTask 
  | PhotoTask 
  | VideoTask 
  | QuizTask 
  | QRCodeTask 
  | CheckpointTask 
  | SponsoredTask 
  | WildcardTask;
```

**Benefits:**
- ✅ Type safety: TypeScript knows which fields exist for each type
- ✅ No sparse documents: Each task only stores relevant fields
- ✅ Clear validation rules per type
- ✅ Easier to add new task types
- ✅ Better code autocomplete

---

### 2. **Firestore Composite Indexes**

Add to `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "tenantId", "order": "ASCENDING" },
        { "fieldPath": "eventId", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" },
        { "fieldPath": "order", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "eventId", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "eventId", "order": "ASCENDING" },
        { "fieldPath": "unlockAt", "order": "ASCENDING" },
        { "fieldPath": "isActive", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "tasks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "eventId", "order": "ASCENDING" },
        { "fieldPath": "difficulty", "order": "ASCENDING" },
        { "fieldPath": "points", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

---

### 3. **Separate Hints Collection**

Instead of embedding hints in task documents:

```typescript
// tasks/{taskId}/hints/{hintId}
interface TaskHint extends MultiTenantEntity {
  taskId: string;
  eventId: string;
  hintLevel: number; // 1, 2, 3 (progressive hints)
  text: string;
  cost: number; // Points to unlock
  revealedByTeams: string[]; // Team IDs (for analytics)
  revealedCount: number; // Denormalized
}

// teams/{teamId}/purchasedHints/{purchaseId}
interface PurchasedHint {
  teamId: string;
  taskId: string;
  hintId: string;
  cost: number;
  purchasedAt: Date;
  revealed: boolean;
}
```

**Benefits:**
- ✅ Tasks stay lean
- ✅ Hints loaded on-demand
- ✅ Easy to add more hints without modifying task
- ✅ Subcollection queries are efficient

---

### 4. **Geospatial Optimization**

Use Firestore's native GeoPoint:

```typescript
import { GeoPoint } from 'firebase/firestore';

// Instead of:
coordinates?: { lat: number; lng: number };

// Use:
coordinates?: GeoPoint;
```

Then implement geohashing for radius queries:

```typescript
import { geohashQueryBounds } from 'geofire-common';

async function getTasksNearLocation(
  eventId: string, 
  center: GeoPoint, 
  radiusInKm: number
): Promise<Task[]> {
  const bounds = geohashQueryBounds(
    [center.latitude, center.longitude], 
    radiusInKm * 1000
  );
  
  const promises = bounds.map(b => {
    const q = query(
      collection(db, 'tasks'),
      where('eventId', '==', eventId),
      orderBy('geohash'),
      startAt(b[0]),
      endAt(b[1])
    );
    return getDocs(q);
  });
  
  // Merge results and filter by actual distance
  // ...
}
```

**Benefits:**
- ✅ Server-side distance filtering
- ✅ Efficient radius queries
- ✅ Standard GeoPoint type

---

### 5. **Denormalization for Performance**

Add computed fields to reduce aggregation queries:

```typescript
interface Task extends BaseTask {
  // Denormalized stats (updated via Cloud Functions)
  stats: {
    totalSubmissions: number;
    approvedSubmissions: number;
    successRate: number; // 0-100
    averageTimeToComplete: number; // Seconds
    uniqueTeamsAttempted: number;
    uniqueTeamsCompleted: number;
    lastCompletedAt?: Date;
  };
}
```

Update via Cloud Function trigger:

```typescript
// functions/src/updateTaskStats.ts
export const onSubmissionCreated = functions.firestore
  .document('submissions/{submissionId}')
  .onCreate(async (snap, context) => {
    const submission = snap.data() as TaskSubmission;
    const taskRef = db.collection('tasks').doc(submission.taskId);
    
    await taskRef.update({
      'stats.totalSubmissions': FieldValue.increment(1),
      ...(submission.status === 'approved' && {
        'stats.approvedSubmissions': FieldValue.increment(1),
      }),
    });
  });
```

---

## 🚀 **Future Task Types**

### 1. **AR/Photo Recognition Task**
```typescript
interface ARTask extends BaseTask {
  type: 'AR_RECOGNITION';
  targetImage: string; // Cloud Vision API template
  targetLabels: string[]; // ["beer", "restaurant", "outdoor"]
  minConfidence: number; // 0.8 = 80% match
  coordinates?: GeoPoint;
  radius?: number;
}
```

**Use Case:** "Find and photograph a beer garden" (AI validates it's actually a beer garden)

---

### 2. **Social Media Integration Task**
```typescript
interface SocialTask extends BaseTask {
  type: 'SOCIAL_SHARE';
  platform: 'instagram' | 'twitter' | 'tiktok';
  requiredHashtags: string[];
  requiredMention?: string; // "@ESNBerlin"
  mustBePublic: boolean;
  verificationMethod: 'screenshot' | 'api'; // API requires OAuth
}
```

**Use Case:** "Post a team photo with #ESNWelcomeWeek"

---

### 3. **Audio Recording Task**
```typescript
interface AudioTask extends BaseTask {
  type: 'AUDIO';
  audioPrompt: string; // "Record your team singing..."
  minDuration: number; // Seconds
  maxDuration: number;
  requiresTranscription?: boolean; // Speech-to-text validation
  targetKeywords?: string[]; // Must say these words
}
```

**Use Case:** "Record your team saying 'Welcome to Berlin' in 3 languages"

---

### 4. **Multi-Stage Quest Task**
```typescript
interface QuestTask extends BaseTask {
  type: 'QUEST';
  stages: Array<{
    stageNumber: number;
    title: string;
    description: string;
    taskType: 'GPS' | 'PHOTO' | 'QUIZ';
    taskDetails: GPSTask | PhotoTask | QuizTask;
    pointsForStage: number;
  }>;
  allowPartialCompletion: boolean; // Award points per stage
  mustCompleteInOrder: boolean;
}
```

**Use Case:** "Berlin History Quest: Visit 5 monuments in order"

---

### 5. **NFC Tag Scan Task**
```typescript
interface NFCTask extends BaseTask {
  type: 'NFC_SCAN';
  nfcTagId: string; // Expected NFC NDEF message
  coordinates?: GeoPoint; // Where tag is located
  radius?: number;
  validUntil?: Date; // Tags can expire
}
```

**Use Case:** Physical checkpoint validation at sponsor locations

---

### 6. **Puzzle/Cipher Task**
```typescript
interface PuzzleTask extends BaseTask {
  type: 'PUZZLE';
  puzzleType: 'cipher' | 'riddle' | 'math' | 'logic';
  puzzle: string; // Encrypted message or riddle
  cipherKey?: string; // For Caesar cipher, etc.
  correctAnswer: string;
  hint1?: string;
  hint2?: string;
  hint3?: string; // Progressive hints
  maxAttempts?: number; // Limit guesses
}
```

**Use Case:** "Decode this cipher to find your next location"

---

### 7. **Collaboration Task**
```typescript
interface CollaborationTask extends BaseTask {
  type: 'COLLABORATION';
  minTeamsRequired: number; // e.g., 3 teams must work together
  maxTeamsAllowed: number;
  sharedObjective: string;
  individualContribution: string; // What each team does
  rewardDistribution: 'equal' | 'proportional';
}
```

**Use Case:** "3 teams must meet at checkpoint and take group photo"

---

### 8. **Time Trial Task**
```typescript
interface TimeTrialTask extends BaseTask {
  type: 'TIME_TRIAL';
  baseTaskType: 'GPS' | 'PHOTO' | 'QUIZ';
  baseTask: GPSTask | PhotoTask | QuizTask;
  timeLimit: number; // Seconds to complete
  bonusPointsPerSecondSaved: number;
  penaltyForTimeout: number; // Points deducted if over time
}
```

**Use Case:** "Get to Brandenburg Gate in 15 minutes - faster = more points"

---

### 9. **Random/Lucky Dip Task**
```typescript
interface RandomTask extends BaseTask {
  type: 'RANDOM';
  possibleTasks: Array<{
    weight: number; // Probability (1-100)
    task: Task; // Any task type
  }>;
  taskSelectedPerTeam: boolean; // Each team gets different task
  revealTaskImmediately: boolean;
}
```

**Use Case:** Mystery challenges that randomize on unlock

---

### 10. **Purchase/Visit Sponsor Task**
```typescript
interface SponsorVisitTask extends BaseTask {
  type: 'SPONSOR_VISIT';
  sponsorId: string;
  sponsorLocation: {
    name: string;
    address: string;
    coordinates: GeoPoint;
    radius: number;
  };
  requiredAction: 'visit' | 'purchase' | 'checkin';
  requiresReceipt?: boolean; // Upload receipt photo
  minimumSpend?: number; // EUR amount
  discountCode?: string; // Team gets discount
  validHours?: {
    start: string; // "09:00"
    end: string; // "18:00"
    daysOfWeek: number[]; // [1,2,3,4,5] = Mon-Fri
  };
}
```

**Use Case:** "Visit Café XYZ and show your team code for a free coffee"

---

### 11. **Mini-Game Task**
```typescript
interface MiniGameTask extends BaseTask {
  type: 'MINI_GAME';
  gameType: 'memory' | 'reaction' | 'matching' | 'trivia-speed';
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  targetScore: number; // Minimum score to pass
  bonusForPerfect: number; // Extra points for high score
  gameConfig: Record<string, any>; // Game-specific settings
}
```

**Use Case:** Embedded interactive games within the app

---

### 12. **Weather-Dependent Task**
```typescript
interface WeatherTask extends BaseTask {
  type: 'WEATHER_CONDITIONAL';
  weatherConditions: {
    requiredCondition?: 'sunny' | 'rainy' | 'snowy' | 'cloudy';
    minTemperature?: number; // Celsius
    maxTemperature?: number;
    requiresDaylight?: boolean;
  };
  fallbackTask?: Task; // Alternative if weather doesn't match
  autoActivate: boolean; // Activate when weather matches
}
```

**Use Case:** "Take a photo in the rain" (only activates when raining)

---

## 📈 **Performance Recommendations**

### Query Optimization Patterns

```typescript
// ❌ BAD: Fetches all tasks then filters client-side
const allTasks = await getDocs(collection(db, 'tasks'));
const activeTasks = allTasks.docs.filter(d => d.data().isActive);

// ✅ GOOD: Server-side filtering
const q = query(
  collection(db, 'tasks'),
  where('eventId', '==', eventId),
  where('isActive', '==', true),
  orderBy('order', 'asc')
);
const activeTasks = await getDocs(q);

// ✅ BEST: Use limit for pagination
const q = query(
  collection(db, 'tasks'),
  where('eventId', '==', eventId),
  where('isActive', '==', true),
  orderBy('order', 'asc'),
  limit(20) // Load first 20
);
```

### Caching Strategy

```typescript
// Use React Query or SWR for client-side caching
import { useQuery } from '@tanstack/react-query';

function useTasks(eventId: string) {
  return useQuery({
    queryKey: ['tasks', eventId],
    queryFn: () => getTasksByEvent(eventId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  });
}
```

### Real-time Subscriptions (Use Sparingly)

```typescript
// ❌ BAD: Subscribe to all tasks
onSnapshot(collection(db, 'tasks'), callback);

// ✅ GOOD: Only subscribe to active event's tasks
const q = query(
  collection(db, 'tasks'),
  where('eventId', '==', currentEventId),
  where('isActive', '==', true)
);
onSnapshot(q, callback);

// ✅ BEST: Subscribe only to critical updates (leaderboard, etc.)
// Use polling or manual refresh for less critical data
```

---

## 🗂️ **Collection Structure Recommendation**

```
tenants/{tenantId}
  └─ events/{eventId}
      ├─ tasks/{taskId}
      │   └─ hints/{hintId}
      ├─ teams/{teamId}
      │   ├─ purchasedHints/{purchaseId}
      │   └─ inventory/{itemId}
      ├─ submissions/{submissionId}
      └─ leaderboard/{entryId}
```

**Benefits:**
- ✅ Security rules inherit from parent
- ✅ Batch deletes when event ends
- ✅ Clear data hierarchy
- ✅ Automatic tenantId/eventId from path

---

## 🔐 **Security Rules Optimization**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isTeam(teamId) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/teams/$(teamId)).data.uid == request.auth.uid;
    }
    
    // Optimized task rules
    match /tasks/{taskId} {
      // Anyone can read active tasks (public game)
      allow read: if resource.data.isActive == true;
      
      // Only admins can write
      allow write: if false; // Add admin check
    }
    
    // Submission rules with validation
    match /submissions/{submissionId} {
      allow create: if isAuthenticated() &&
                       request.resource.data.teamId == request.auth.uid &&
                       request.resource.data.status == 'pending';
      
      allow read: if isTeam(resource.data.teamId);
      
      allow update: if false; // Only Cloud Functions update
    }
  }
}
```

---

## 📊 **Monitoring & Analytics**

Add to each task type:

```typescript
interface TaskAnalytics {
  views: number; // How many teams viewed
  attempts: number; // How many tried
  completions: number; // How many succeeded
  abandonmentRate: number; // (attempts - completions) / attempts
  averageAttempts: number; // Avg tries before success
  hintPurchases: number;
  
  // Time-based metrics
  fastestCompletion: number; // Seconds
  slowestCompletion: number;
  averageCompletion: number;
  
  // Difficulty calibration
  calibratedDifficulty?: 'easier' | 'harder' | 'accurate';
}
```

Use Cloud Functions to aggregate:

```typescript
export const updateTaskAnalytics = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async () => {
    // Aggregate submission data
    // Update task analytics fields
  });
```

---

## ✅ **Migration Strategy**

1. **Phase 1: Add new fields** (non-breaking)
   - Add `stats` object
   - Add `geohash` field
   - Deploy Cloud Functions

2. **Phase 2: Create indexes**
   - Deploy `firestore.indexes.json`
   - Wait for index build

3. **Phase 3: Migrate hints** (breaking)
   - Script to move hints to subcollection
   - Update app to read from subcollection
   - Remove hints array after migration

4. **Phase 4: Type refactor** (breaking)
   - Update TypeScript types
   - Update task creation forms
   - Update task display components

---

## 📝 **Summary**

### Immediate Optimizations (Do Now)
1. ✅ Add composite indexes for common queries
2. ✅ Use GeoPoint instead of {lat, lng}
3. ✅ Move hints to subcollection
4. ✅ Add denormalized stats fields

### Medium-term (Next Sprint)
1. ⏳ Implement discriminated union types
2. ⏳ Add geohashing for radius queries
3. ⏳ Set up Cloud Functions for analytics

### Long-term (Future Features)
1. 🔮 AR/Photo recognition tasks
2. 🔮 Multi-stage quest tasks
3. 🔮 Social media integration
4. 🔮 Mini-games and puzzles

---

**Estimated Performance Gains:**
- 🚀 Query speed: **3-5x faster** (with proper indexes)
- 💾 Storage efficiency: **20-30% reduction** (hints subcollection)
- 📉 Client bandwidth: **40% reduction** (selective field fetching)
- ⚡ Real-time costs: **50% reduction** (targeted subscriptions)
