# Firebase Emulator Setup - Local Cloud Functions

**Date:** December 26, 2025  
**Purpose:** Run Cloud Functions locally to avoid CORS issues during development  
**Status:** ✅ CONFIGURED AND READY

---

## Why Use Emulators?

### Problems with Production Functions:
- ❌ CORS errors persist despite multiple fixes
- ❌ Slow deploy cycle (3-5 minutes per change)
- ❌ Hard to debug (limited logging)
- ❌ Uses production quota/billing

### Benefits of Local Emulators:
- ✅ **No CORS issues** (localhost → localhost = same origin)
- ✅ **Instant testing** (no deployment needed)
- ✅ **Full console.log()** for debugging
- ✅ **Free** (no quota/billing)
- ✅ **Offline development** possible

---

## Configuration

### 1. **firebase.json** - Emulator Ports

```json
{
  "emulators": {
    "functions": {
      "port": 5001,
      "host": "127.0.0.1"
    },
    "firestore": {
      "port": 8080,
      "host": "127.0.0.1"
    },
    "ui": {
      "enabled": true,
      "port": 4000,
      "host": "127.0.0.1"
    },
    "singleProjectMode": true
  }
}
```

**Emulator URLs:**
- Functions: `http://127.0.0.1:5001/urban-rally-539bd/europe-west3/[functionName]`
- Firestore: `http://127.0.0.1:8080`
- UI Dashboard: `http://127.0.0.1:4000`

### 2. **.env.local** - Enable Emulator Mode

```bash
# Firebase Emulator Configuration
VITE_USE_EMULATOR=true
```

**How it works:**
- When `VITE_USE_EMULATOR=true` → Uses localhost emulators
- When `VITE_USE_EMULATOR=false` → Uses production functions
- When undefined → Uses production functions

### 3. **firebase.service.ts** - Auto-Connection

```typescript
// Initialize Functions
functions = getFunctions(app, 'europe-west3');

// Connect to emulators in development
if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  console.log('🔧 Connected to Firebase Emulators');
}
```

**Automatic detection:**
- Checks `import.meta.env.DEV` (Vite development mode)
- Checks `VITE_USE_EMULATOR` environment variable
- Connects to emulators if both true

---

## Usage

### Step 1: Start Firebase Emulators

**Terminal 1: Start Emulators**
```bash
cd /Users/kaangecu/Desktop/personal/urban-rally
firebase emulators:start
```

**Expected output:**
```
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! It's now safe to connect your app. │
│ i  View Emulator UI at http://127.0.0.1:4000               │
└─────────────────────────────────────────────────────────────┘

┌───────────┬────────────────┬─────────────────────────────────┐
│ Emulator  │ Host:Port      │ View in Emulator UI             │
├───────────┼────────────────┼─────────────────────────────────┤
│ Functions │ 127.0.0.1:5001 │ http://127.0.0.1:4000/functions │
│ Firestore │ 127.0.0.1:8080 │ http://127.0.0.1:4000/firestore │
└───────────┴────────────────┴─────────────────────────────────┘
```

**Keep this terminal running!** Emulators run until you stop them (Ctrl+C).

### Step 2: Start Development Server

**Terminal 2: Start Vite Dev Server**
```bash
cd /Users/kaangecu/Desktop/personal/urban-rally
npm run dev
```

**Expected output:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### Step 3: Test the App

1. **Open browser:** `http://localhost:5173`
2. **Check console:** Should see "🔧 Connected to Firebase Emulators"
3. **Test team members:** Navigate to Team tab
4. **NO CORS errors!** Functions run on localhost

---

## Verification

### Check Emulator Connection

**Browser Console (F12):**
```javascript
// Should see on page load:
✅ Firebase initialized successfully
🔧 Connected to Firebase Emulators (Firestore: 8080, Functions: 5001)
```

### Check Functions Execution

**When calling getTeamMembersSecure:**

**Browser Network Tab:**
```
Request URL: http://127.0.0.1:5001/urban-rally-539bd/europe-west3/getTeamMembersSecure
Status: 200 OK
Response Headers:
  access-control-allow-origin: * (no CORS issues!)
```

**Emulator Terminal (Terminal 1):**
```
i  functions: Beginning execution of "europe-west3-getTeamMembersSecure"
>  Fetching team members { userId: '...', teamId: '...' }
i  functions: Finished "europe-west3-getTeamMembersSecure" in ~50ms
```

---

## Debugging with Emulators

### Console Logging

Add console.log() anywhere in your Cloud Functions:

**functions/src/index.ts:**
```typescript
export const getTeamMembersSecure = onCall({...}, async (request) => {
  console.log('🔍 DEBUG: Request data:', request.data);
  console.log('🔍 DEBUG: Auth UID:', request.auth?.uid);
  
  const members = await fetchMembers();
  console.log('🔍 DEBUG: Found members:', members.length);
  
  return { members };
});
```

**Output appears in Terminal 1 (emulator terminal)** instantly!

### Emulator UI

Open `http://127.0.0.1:4000` to see:
- **Functions tab**: All function invocations with logs
- **Firestore tab**: Live database viewer
- **Request history**: See all requests/responses

---

## Switching Between Emulator and Production

### Use Emulators (Development):

**.env.local:**
```bash
VITE_USE_EMULATOR=true
```

**Terminal:**
```bash
firebase emulators:start  # Terminal 1
npm run dev              # Terminal 2
```

**Result:** All functions run on `http://127.0.0.1:5001`

### Use Production Functions:

**.env.local:**
```bash
VITE_USE_EMULATOR=false
# or just comment it out:
# VITE_USE_EMULATOR=true
```

**Terminal:**
```bash
npm run dev  # Only need dev server
```

**Result:** All functions run on `https://europe-west3-urban-rally-539bd.cloudfunctions.net`

---

## Common Issues

### Issue 1: "Emulators already running"

**Error:**
```
Port 5001 is not open on 127.0.0.1
```

**Solution:**
```bash
# Kill existing emulators
pkill -f firebase

# Or find and kill the process:
lsof -ti:5001 | xargs kill -9

# Then restart:
firebase emulators:start
```

### Issue 2: "Functions not found in emulator"

**Error:**
```
Function getTeamMembersSecure not found
```

**Solution:**
```bash
# Build functions first:
cd functions
npm run build

# Then start emulators:
cd ..
firebase emulators:start
```

### Issue 3: Still seeing CORS errors

**Check:**
1. **Emulators running?** Check Terminal 1
2. **VITE_USE_EMULATOR=true?** Check `.env.local`
3. **Dev server restarted?** Restart after changing `.env.local`
4. **Console message?** Should see "🔧 Connected to Firebase Emulators"

**Debug:**
```bash
# Check environment variable:
echo $VITE_USE_EMULATOR

# Check Network tab in browser:
# Request URL should be http://127.0.0.1:5001/...
# NOT https://europe-west3-...
```

### Issue 4: Changes not reflected

**Functions changes not updating:**
```bash
# Rebuild functions:
cd functions
npm run build

# Emulators auto-reload on rebuild
```

**Client changes not updating:**
- Vite auto-reloads (should be instant)
- If not, hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

---

## Best Practices

### 1. **Always Use Emulators for Development**

```bash
# .env.local (keep committed)
VITE_USE_EMULATOR=true
```

### 2. **Two Terminal Setup**

```bash
# Terminal 1: Emulators (leave running)
firebase emulators:start

# Terminal 2: Dev server (leave running)
npm run dev
```

### 3. **Deploy Only When Ready**

```bash
# Test everything locally first
# Then deploy to production:
cd functions
npm run deploy
```

### 4. **Check Emulator UI Regularly**

Open `http://127.0.0.1:4000` to:
- Monitor function calls
- Check firestore data
- Debug request/response

---

## Testing Workflow

### Local Testing (Fast):

1. ✅ Make code changes
2. ✅ Functions auto-rebuild (if running `npm run build --watch`)
3. ✅ Test in browser (no CORS!)
4. ✅ Check emulator logs for debugging
5. ✅ Repeat until working

### Production Deploy (When Ready):

```bash
# 1. Verify local tests pass
# 2. Build functions
cd functions
npm run build

# 3. Deploy
npm run deploy

# 4. Test production
# Change .env.local to VITE_USE_EMULATOR=false
npm run dev
```

---

## Emulator Data

### Data Persistence

**Emulator data is NOT persisted** by default. When you stop emulators, data is lost.

**To persist data:**
```bash
firebase emulators:start --import=./emulator-data --export-on-exit=./emulator-data
```

### Seeding Test Data

**Create test data script:**
```bash
# functions/scripts/seed-emulator.ts
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Connect to emulator
db.settings({
  host: '127.0.0.1:8080',
  ssl: false
});

// Add test data
await db.collection('teams').add({ name: 'Test Team' });
```

---

## Deployment Checklist

Before deploying to production:

- [ ] All functions tested locally with emulators
- [ ] No errors in emulator terminal
- [ ] Browser console clean (no errors)
- [ ] Functions return expected data
- [ ] TypeScript compiles without errors
- [ ] `.env.local` set to `VITE_USE_EMULATOR=false` for production test
- [ ] Production test successful
- [ ] Ready to deploy: `cd functions && npm run deploy`

---

## Summary

### Quick Start:
```bash
# Terminal 1:
firebase emulators:start

# Terminal 2:
npm run dev

# Browser:
http://localhost:5173
```

### Benefits:
- ✅ No CORS issues
- ✅ Instant feedback
- ✅ Full debugging
- ✅ Free testing

### When to Deploy:
- Only after local testing passes
- For production releases
- To update live functions

---

**Pro Tip:** Keep emulators running all day during development. Only stop them when shutting down. This gives you instant feedback on every change!
