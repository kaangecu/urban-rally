# 🔥 Firebase Setup Guide - UrbanRally

Complete step-by-step guide to set up Firebase for your multi-tenant scavenger hunt app.

---

## 📋 Prerequisites

- [ ] Google Account (Gmail)
- [ ] Browser (Chrome/Firefox/Safari)
- [ ] Project scaffolding complete ✅

---

## 🚀 STEP 1: Create Firebase Project

### 1.1 Access Firebase Console
```
👉 https://console.firebase.google.com
```

### 1.2 Create New Project
1. Click **"Add project"** or **"Create a project"**
2. **Project name**: `urban-rally` (or your preferred name)
3. Click **"Continue"**
4. **Google Analytics**: Enable (recommended for tracking) or skip
5. Click **"Create project"**
6. Wait ~30 seconds for setup
7. Click **"Continue"**

✅ **Checkpoint**: You should now see the Firebase Console dashboard

---

## 🌐 STEP 2: Register Web App

### 2.1 Add Web App
1. In Firebase Console, click the **</> (Web)** icon
2. **App nickname**: `urban-rally-web`
3. ✅ Check **"Also set up Firebase Hosting"** (for PWA deployment)
4. Click **"Register app"**

### 2.2 Save Firebase Config
You'll see a config object like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "urban-rally.firebaseapp.com",
  projectId: "urban-rally",
  storageBucket: "urban-rally.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

**IMPORTANT**: Keep this tab open! You'll need these values in Step 8.

---

## 🔐 STEP 3: Enable Authentication

### 3.1 Navigate to Authentication
1. In left sidebar, click **"Build"** → **"Authentication"**
2. Click **"Get started"**

### 3.2 Enable Anonymous Sign-In
1. Go to **"Sign-in method"** tab
2. Click **"Anonymous"**
3. Toggle **"Enable"**
4. Click **"Save"**

✅ **Why Anonymous?** Team code authentication uses Firebase Anonymous Auth + team document linking.

---

## 🗄️ STEP 4: Create Firestore Database

### 4.1 Navigate to Firestore
1. In left sidebar, click **"Build"** → **"Firestore Database"**
2. Click **"Create database"**

### 4.2 Security Rules
1. Choose **"Start in production mode"**
   - We'll deploy custom rules later
2. Click **"Next"**

### 4.3 Choose Location
1. Select a location close to your users:
   - **Europe**: `eur3 (europe-west)`
   - **USA**: `nam5 (us-central)`
   - **Asia**: `asia-southeast1`
2. Click **"Enable"**
3. Wait ~1 minute for database creation

✅ **Checkpoint**: You should see "Cloud Firestore" dashboard

---

## 📁 STEP 5: Enable Cloud Storage

### 5.1 Navigate to Storage
1. In left sidebar, click **"Build"** → **"Storage"**
2. Click **"Get started"**

### 5.2 Security Rules
1. Choose **"Start in production mode"**
   - We'll deploy custom rules later
2. Click **"Next"**

### 5.3 Storage Location
1. Use **same location** as Firestore (auto-selected)
2. Click **"Done"**

✅ **Checkpoint**: Storage bucket created

---

## 💳 STEP 6: Install Stripe Extension (Optional - For Payments)

### 6.1 Navigate to Extensions
1. In left sidebar, click **"Build"** → **"Extensions"**
2. Search for **"Run Payments with Stripe"**
3. Click on the extension

### 6.2 Install Extension
1. Click **"Install"**
2. Click **"Next"** (review APIs)
3. Click **"Next"** (billing - Blaze plan required)

### 6.3 Configure Extension
You'll need a **Stripe account** for this:
1. Sign up at https://stripe.com
2. Get your **Stripe Secret Key** from Stripe Dashboard
3. Configure extension with:
   - Products and pricing collection: `products`
   - Customer collection: `customers`
   - Stripe webhook secret: (auto-generated)
4. Click **"Install extension"**
5. Wait ~3-5 minutes

⚠️ **Note**: Skip this step if you don't need payments yet. You can install later.

---

## 🔧 STEP 7: Initialize Firebase CLI (Local Setup)

### 7.1 Install Firebase Tools
```bash
npm install -g firebase-tools
```

### 7.2 Login to Firebase
```bash
firebase login
```
- Opens browser for Google account login
- Authorize Firebase CLI

### 7.3 Initialize Firebase in Project
```bash
# Make sure you're in the project directory
cd /Users/kaangecu/Desktop/personal/urban-rally

# Initialize Firebase
firebase init
```

### 7.4 Firebase Init Configuration
You'll be asked several questions:

**1. Which Firebase features?**
```
◉ Firestore
◉ Hosting
◉ Storage
```
Use **SPACE** to select, **ENTER** to confirm

**2. Use existing project?**
```
→ Use an existing project
→ Select: urban-rally
```

**3. Firestore Rules file?**
```
→ firestore.rules (default)
```

**4. Firestore Indexes file?**
```
→ firestore.indexes.json (default)
```

**5. Storage Rules file?**
```
→ storage.rules (default)
```

**6. Public directory for Hosting?**
```
→ dist (NOT public!)
```

**7. Configure as single-page app?**
```
→ Yes
```

**8. Set up automatic builds with GitHub?**
```
→ No (for now)
```

✅ **Checkpoint**: Firebase initialized! You'll see `firebase.json` created

---

## 🔑 STEP 8: Configure Environment Variables

### 8.1 Copy Environment Template
```bash
cp .env.example .env
```

### 8.2 Edit .env File
Open `.env` and paste your Firebase config from Step 2:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=urban-rally.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=urban-rally
VITE_FIREBASE_STORAGE_BUCKET=urban-rally.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# Optional: Analytics
# VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# Environment
VITE_APP_ENV=development
```

⚠️ **IMPORTANT**: 
- Never commit `.env` to Git
- Use `VITE_` prefix for all variables (Vite requirement)

---

## 🛡️ STEP 9: Deploy Security Rules

### 9.1 Deploy Firestore Rules
```bash
firebase deploy --only firestore:rules
```

You should see:
```
✔  Deploy complete!
```

### 9.2 Deploy Storage Rules
```bash
firebase deploy --only storage:rules
```

✅ **Checkpoint**: Security rules deployed!

---

## 🧪 STEP 10: Test Firebase Connection

### 10.1 Create Test Script
Create `src/test-firebase.ts`:

```typescript
import { initializeFirebase, getFirebaseFirestore } from './services/firebase.service';
import { collection, getDocs } from 'firebase/firestore';

async function testFirebase() {
  try {
    console.log('🔥 Testing Firebase connection...');
    
    // Initialize Firebase
    await initializeFirebase();
    console.log('✅ Firebase initialized');
    
    // Test Firestore connection
    const db = getFirebaseFirestore();
    const tenantsRef = collection(db, 'tenants');
    await getDocs(tenantsRef);
    console.log('✅ Firestore connected');
    
    console.log('🎉 Firebase setup successful!');
  } catch (error) {
    console.error('❌ Firebase test failed:', error);
  }
}

testFirebase();
```

### 10.2 Run Test
```bash
npm run dev
```

Then open browser console and check for:
```
✅ Firestore offline persistence enabled
✅ Firebase initialized successfully
```

---

## 📊 STEP 11: Create Initial Data Structure

### 11.1 Create Test Tenant
Go to Firestore Console:
1. Click **"Start collection"**
2. Collection ID: `tenants`
3. Document ID: `esn-berlin` (or auto-generate)
4. Add fields:
   ```
   tenantId: "esn-berlin"
   name: "ESN Berlin"
   slug: "esn-berlin"
   primaryColor: "#1a56db"
   isActive: true
   createdAt: [Current timestamp]
   updatedAt: [Current timestamp]
   ```
5. Click **"Save"**

### 11.2 Create Test Event
1. Create collection: `events`
2. Document ID: `welcome-week-2025`
3. Add fields:
   ```
   tenantId: "esn-berlin"
   eventId: "welcome-week-2025"
   name: "Welcome Week 2025"
   isActive: true
   mapCenter: (geopoint with lat: 52.52, lng: 13.405)
   mapZoom: 13
   startDate: [Future timestamp]
   endDate: [Future timestamp]
   createdAt: [Current timestamp]
   updatedAt: [Current timestamp]
   ```
4. Click **"Save"**

---

## ✅ STEP 12: Verify Setup Checklist

Check all boxes:

### Firebase Console
- [ ] Project created
- [ ] Web app registered
- [ ] Authentication → Anonymous enabled
- [ ] Firestore database created
- [ ] Storage bucket created
- [ ] (Optional) Stripe extension installed

### Local Setup
- [ ] Firebase CLI installed (`firebase --version`)
- [ ] Logged in (`firebase login`)
- [ ] Project initialized (`firebase init`)
- [ ] `.env` file created with credentials
- [ ] Security rules deployed
- [ ] Test data created in Firestore

### Test Connection
- [ ] `npm run dev` runs without errors
- [ ] Console shows "Firebase initialized successfully"
- [ ] Console shows "Firestore offline persistence enabled"

---

## 🎯 Next Steps

Once Firebase is set up, you're ready to build features!

**Recommended order:**
1. ✅ Firebase Setup (DONE!)
2. 🔐 Build Authentication (Team Code Login)
3. 🗺️ Implement Map Integration
4. ✅ Create Task System
5. 🏆 Add Leaderboard

---

## 🆘 Troubleshooting

### Issue: "Firebase not initialized" error
**Solution**: Make sure you call `initializeFirebase()` in `main.tsx` before rendering the app

### Issue: "Permission denied" in Firestore
**Solution**: Deploy security rules: `firebase deploy --only firestore:rules`

### Issue: Can't find `.env` variables
**Solution**: Variables must start with `VITE_` prefix for Vite to expose them

### Issue: Firestore offline persistence fails
**Solution**: This is normal if you have multiple tabs open. Only one tab gets persistence.

---

## 📚 Useful Commands

```bash
# View Firebase projects
firebase projects:list

# Switch Firebase project
firebase use urban-rally

# Deploy all rules
firebase deploy --only firestore:rules,storage:rules

# Deploy hosting
firebase deploy --only hosting

# Open Firebase Console
firebase open

# View logs
firebase functions:log
```

---

## 🔗 Resources

- [Firebase Console](https://console.firebase.google.com)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)
- [Firebase Auth Anonymous](https://firebase.google.com/docs/auth/web/anonymous-auth)
- [Stripe Firebase Extension](https://firebase.google.com/products/extensions/firestore-stripe-payments)

---

**Setup Guide Version:** 1.0  
**Last Updated:** 2025-11-30  
**Status:** 🟢 Ready to Build
