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
