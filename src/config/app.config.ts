// Firebase Configuration
// Copy this file to firebase.config.ts and add your actual Firebase credentials

export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// App Configuration
export const appConfig = {
  appName: 'UrbanRally',
  version: '1.0.0',
  
  // Image upload constraints
  maxImageSize: 200 * 1024, // 200KB in bytes
  imageQuality: 0.8,
  maxImageWidth: 1920,
  maxImageHeight: 1920,
  
  // Offline storage
  enableOfflinePersistence: true,
  
  // Multi-tenancy
  defaultTenantId: 'demo',
  
  // Map configuration
  defaultMapCenter: { lat: 52.52, lng: 13.405 }, // Berlin
  defaultZoom: 13,
  
  // Game mechanics
  gpsAccuracyThreshold: 50, // meters
  taskCompletionRadius: 30, // meters
  
  // Touch UI
  minTouchTargetSize: 44, // pixels
} as const;
