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
  browserLocalPersistence 
} from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  connectFirestoreEmulator 
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import type { Functions } from 'firebase/functions';
import { firebaseConfig } from '../config/app.config';

// Firebase instances
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let functions: Functions;

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
    await setPersistence(auth, browserLocalPersistence);
    
    // Initialize Firestore
    db = getFirestore(app);
    
    // Initialize Storage
    storage = getStorage(app);
    
    // Initialize Functions
    functions = getFunctions(app, 'europe-west3');
    
    // Connect to emulators in development
    if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      connectFunctionsEmulator(functions, '127.0.0.1', 5001);
      console.log('🔧 Connected to Firebase Emulators (Firestore: 8080, Functions: 5001)');
    }
    
    // Enable offline persistence (CRITICAL for offline-first)
    try {
      await enableIndexedDbPersistence(db);
      console.log('✅ Firestore offline persistence enabled');
    } catch (err: any) {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️ Multiple tabs open, persistence enabled in first tab only');
      } else if (err.code === 'unimplemented') {
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
 * Get Firebase Functions instance
 * Automatically configured for emulator in development when VITE_USE_EMULATOR=true
 */
export const getFirebaseFunctions = (): Functions => {
  if (!functions) {
    throw new Error('Firebase not initialized. Call initializeFirebase() first.');
  }
  return functions;
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

export { app, auth, db, storage, functions };
