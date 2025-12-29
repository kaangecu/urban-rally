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
  persistentLocalCache,
  persistentMultipleTabManager,
  initializeFirestore,
  connectFirestoreEmulator 
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
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
    
    // Initialize Auth (but DON'T configure persistence yet)
    auth = getAuth(app);
    
    // IMPORTANT: Connect to emulators BEFORE any auth operations
    // This ensures the emulator connection is established before auth tries to restore session
    if (import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true') {
      connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
      console.log('🔧 Connected to Auth Emulator (9099)');
    }
    
    // NOW set persistence after emulator is connected
    await setPersistence(auth, browserLocalPersistence);
    
    // Initialize Firestore
    // CRITICAL: For emulators, we must connect BEFORE any queries run
    const useEmulator = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATOR === 'true';
    
    if (useEmulator) {
      // For emulators: Use getFirestore() then connect to emulator immediately
      // This prevents the SDK from trying to reach production backend
      db = getFirestore(app);
      connectFirestoreEmulator(db, '127.0.0.1', 8080);
      console.log('🔧 Connected to Firestore Emulator (8080)');
    } else {
      // For production: Use persistent cache for offline-first PWA
      db = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager()
        })
      });
      console.log('✅ Firestore initialized with persistent cache');
    }
    
    // Initialize Storage
    storage = getStorage(app);
    
    // Initialize Functions
    functions = getFunctions(app, 'europe-west3');
    
    // Connect remaining emulators in development
    if (useEmulator) {
      connectFunctionsEmulator(functions, '127.0.0.1', 5001);
      connectStorageEmulator(storage, '127.0.0.1', 9199);
      console.log('🔧 Connected to Functions (5001) and Storage (9199) Emulators');
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
