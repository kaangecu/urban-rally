/**
 * Firebase Initialization and Configuration
 * Handles Firebase app initialization with offline persistence
 */

import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously,
  setPersistence,
  browserLocalPersistence,
  connectAuthEmulator
} from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  connectFirestoreEmulator 
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from '../config/app.config';

// Firebase instances
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

/**
 * Initialize Firebase with offline persistence
 * This MUST be called before any Firebase operations
 */
export const initializeFirebase = async (): Promise<void> => {
  try {
    // Initialize Firebase App
    app = initializeApp(firebaseConfig);
    
    // Initialize Auth with local persistence
    auth = getAuth(app);
    
    // Initialize Firestore
    db = getFirestore(app);
    
    // Initialize Storage
    storage = getStorage(app);

    // Connect to the local emulators in development (npm run emulators)
    if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
      connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      connectFirestoreEmulator(db, 'localhost', 8080);
      connectStorageEmulator(storage, 'localhost', 9199);
      console.log('🔧 Connected to Auth, Firestore and Storage emulators');
    }
    await setPersistence(auth, browserLocalPersistence);

    // Enable offline persistence (CRITICAL for offline-first)
    try {
      await enableIndexedDbPersistence(db);
      console.log('✅ Firestore offline persistence enabled');
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'failed-precondition') {
        console.warn('⚠️ Multiple tabs open, persistence enabled in first tab only');
      } else if (code === 'unimplemented') {
        console.warn('⚠️ Browser does not support persistence');
      }
    }
    
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
};

/**
 * Get Firebase Auth instance
 */
export const getFirebaseAuth = (): Auth => {
  if (!auth) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return auth;
};

/**
 * Get Firestore instance
 */
export const getFirebaseFirestore = (): Firestore => {
  if (!db) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return db;
};

/**
 * Get Firebase Storage instance
 */
export const getFirebaseStorage = (): FirebaseStorage => {
  if (!storage) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return storage;
};

/**
 * Sign in anonymously (used for team code authentication)
 */
export const signInAnonymousUser = async (): Promise<string> => {
  const auth = getFirebaseAuth();
  const result = await signInAnonymously(auth);
  return result.user.uid;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const auth = getFirebaseAuth();
  return !!auth.currentUser;
};

/**
 * Get current user UID
 */
export const getCurrentUserId = (): string | null => {
  const auth = getFirebaseAuth();
  return auth.currentUser?.uid || null;
};

export { app, auth, db, storage };
