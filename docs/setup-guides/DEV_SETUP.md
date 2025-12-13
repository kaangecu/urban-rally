# Development Setup Guide

This guide explains how to set up the development environment with proper Firebase configuration.

---

## 🔧 Prerequisites

1. **Node.js 22.16.0+** installed
2. **Firebase CLI** installed globally:
   ```bash
   npm install -g firebase-tools
   ```
3. **Firebase project access** (urban-rally-app)

---

## 🚀 Quick Setup

### Option 1: Automated Setup (Recommended)

Run the automated setup script:

```bash
npm run dev-setup
```

This will:
1. ✅ Check Firebase CLI installation
2. ✅ Login to Firebase (if needed)
3. ✅ Deploy development Firestore rules
4. ✅ Add test tasks to database

### Option 2: Manual Setup

1. **Login to Firebase:**
   ```bash
   firebase login
   ```

2. **Select project:**
   ```bash
   firebase use urban-rally-app
   ```

3. **Deploy development rules:**
   ```bash
   npm run deploy:rules:dev
   ```

4. **Add test tasks:**
   ```bash
   npm run add-tasks
   ```

---

## 📋 Firestore Rules

### Development Rules (`firestore.dev.rules`)

**Location:** `firestore.dev.rules`

**Features:**
- ✅ Open read/write access for all collections
- ✅ Allows scripts to add test data
- ✅ Allows authenticated users to create submissions
- ⚠️ **DO NOT USE IN PRODUCTION**

**Deploy:**
```bash
npm run deploy:rules:dev
```

### Production Rules (`firestore.rules.prod`)

**Location:** `firestore.rules.prod`

**Features:**
- ✅ Strict access control
- ✅ Team ownership verification
- ✅ Multi-tenant isolation
- ✅ Secure submission creation

**Deploy:**
```bash
npm run deploy:rules:prod
```

---

## 🗄️ Adding Test Data

### Add Quiz and Photo Tasks

```bash
npm run add-tasks
```

This script:
1. Authenticates with Firebase (anonymous auth)
2. Adds 13 test tasks:
   - 5 photo challenges
   - 3 multiple choice quizzes
   - 3 text answer quizzes
   - 2 number answer quizzes

**Tasks added:**
- ✅ All with proper tenantId and eventId
- ✅ Various difficulty levels
- ✅ Points ranging from 25-100
- ✅ Hints included for most quizzes

### Manual Test Data Setup

If you need to add more test data:

```bash
npm run setup-test-data
```

---

## 🔄 Switching Between Environments

### Development Mode

```bash
# Deploy dev rules (permissive)
npm run deploy:rules:dev

# Add test data
npm run add-tasks

# Start dev server
npm run dev
```

### Production Mode

```bash
# Deploy production rules (strict)
npm run deploy:rules:prod

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 📁 File Structure

```
urban-rally/
├── firestore.dev.rules        # Development rules (permissive)
├── firestore.rules.prod       # Production rules (strict)
├── firestore.rules            # Currently deployed rules
├── firestore.backup.rules     # Auto-generated backup
├── scripts/
│   ├── dev-setup.sh          # Automated setup script
│   └── add-quiz-photo-tasks.ts # Task import script
└── package.json              # NPM scripts
```

---

## 🛡️ Security

### Development Rules

**⚠️ WARNING:** Development rules allow open access!

```javascript
// Example from firestore.dev.rules
match /tasks/{taskId} {
  allow read, write: if true;  // ⚠️ Open access!
}
```

**Use for:**
- ✅ Local development
- ✅ Running scripts
- ✅ Testing new features

**DO NOT use for:**
- ❌ Production deployment
- ❌ Public demos
- ❌ Shared testing environments

### Production Rules

**Strict access control:**

```javascript
// Example from firestore.rules.prod
match /tasks/{taskId} {
  allow read: if isAuthenticated();
  allow write: if false;  // Only admins in production
}
```

**Use for:**
- ✅ Production deployment
- ✅ Public events
- ✅ Real user data

---

## 🧪 Testing Workflow

### 1. Initial Setup

```bash
# One-time setup
npm run dev-setup
```

### 2. Daily Development

```bash
# Start dev server
npm run dev

# Server runs on http://localhost:5174
# HTTPS also available (for camera access)
```

### 3. Testing Features

**Test Quiz Submissions:**
1. Login with team code
2. Find quiz tasks (look for ❓ icon)
3. Try multiple choice, text, and number questions
4. Verify scoring (correct = full points, wrong = 50%)

**Test Photo Submissions:**
1. Login with team code
2. Find photo tasks (look for 📸 icon)
3. Take photo and submit
4. Verify compression and upload

### 4. Resetting Test Data

If you need to reset:

1. Delete tasks from Firebase Console
2. Re-run: `npm run add-tasks`

---

## 📝 Available NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run dev-setup` | Automated dev environment setup |
| `npm run add-tasks` | Add test quiz/photo tasks |
| `npm run deploy:rules:dev` | Deploy development rules |
| `npm run deploy:rules:prod` | Deploy production rules |
| `npm run firebase:backup-rules` | Backup current rules |

---

## 🐛 Troubleshooting

### "Permission Denied" when running scripts

**Problem:** Scripts can't write to Firestore

**Solution:**
```bash
# Deploy dev rules first
npm run deploy:rules:dev

# Then run the script
npm run add-tasks
```

### Firebase CLI not found

**Problem:** `firebase: command not found`

**Solution:**
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Verify installation
firebase --version
```

### Not logged in to Firebase

**Problem:** `Error: Authentication required`

**Solution:**
```bash
# Login to Firebase
firebase login

# Select project
firebase use urban-rally-app
```

### Tasks not appearing in app

**Problem:** Added tasks but not visible

**Solution:**
1. Check Firebase Console (https://console.firebase.google.com)
2. Verify tasks collection has documents
3. Check tenantId matches "esn-berlin"
4. Check eventId matches "winter-scavenger-hunt"
5. Refresh the app (Cmd+R)

### Script hangs or times out

**Problem:** Script doesn't complete

**Solution:**
1. Check internet connection
2. Verify Firebase project access
3. Check authentication worked (look for UID in output)
4. Try running with more verbose logging:
   ```bash
   DEBUG=* npm run add-tasks
   ```

---

## 🔐 Authentication Flow

The `add-quiz-photo-tasks.ts` script uses Firebase Anonymous Auth:

```typescript
// 1. Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 2. Sign in anonymously
await signInAnonymously(auth);

// 3. Now authenticated - can write to Firestore
await addDoc(collection(db, 'tasks'), taskData);
```

This works because:
- ✅ Anonymous auth is enabled in Firebase Console
- ✅ Development rules allow authenticated writes
- ✅ No credentials needed for testing

---

## 📚 Resources

- [Firebase CLI Documentation](https://firebase.google.com/docs/cli)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Anonymous Auth](https://firebase.google.com/docs/auth/web/anonymous-auth)

---

## ⚠️ Important Reminders

1. **Always use development rules locally**
   - Easier testing
   - Scripts can run
   - No production data affected

2. **Never deploy dev rules to production**
   - Open access is dangerous
   - Use `npm run deploy:rules:prod` instead

3. **Backup before deploying rules**
   - Run `npm run firebase:backup-rules` first
   - Keeps a copy of current rules

4. **Test locally before deploying**
   - Use localhost:5174
   - Verify features work
   - Check console for errors

---

**Last Updated:** December 6, 2025  
**Environment:** Development  
**Firebase Project:** urban-rally-app
