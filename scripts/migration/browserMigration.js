/**
 * Browser-Based Migration for Multi-Event Fields
 * 
 * This script runs in the browser console while logged into the app.
 * It migrates the current user's document to include multi-event fields.
 * 
 * USAGE:
 * 1. Login to the app
 * 2. Open browser DevTools (F12)
 * 3. Copy and paste this entire script into the Console
 * 4. Press Enter
 * 
 * The script will:
 * - Check if your user document needs migration
 * - Add accountType, recoveryCode fields if missing
 * - Show success/error messages
 */

(async function migrateSelfToMultiEvent() {
  console.log('🔄 Starting Multi-Event Migration for Current User...\n');

  try {
    // Get current user from Zustand store
    const authStore = window.useAuthStore?.getState();
    
    if (!authStore || !authStore.user) {
      console.error('❌ Not logged in!');
      console.log('💡 Please login first, then run this script again\n');
      return;
    }

    const currentUser = authStore.user;
    console.log(`👤 Current User: ${currentUser.displayName} (${currentUser.id})\n`);

    // Check if already migrated
    if (currentUser.accountType !== undefined) {
      console.log('✅ User already has multi-event fields!');
      console.log(`   Account Type: ${currentUser.accountType}`);
      console.log(`   Recovery Code: ${currentUser.recoveryCode ? 'Set' : 'Not set'}\n`);
      return;
    }

    console.log('📝 User needs migration...');
    console.log('   Adding: accountType, recoveryCode fields\n');

    // Import Firestore functions (assumes they're available globally)
    const { getFirestore, doc, updateDoc } = window.firebase?.firestore || {};
    
    if (!getFirestore) {
      console.error('❌ Firebase Firestore not available');
      console.log('💡 Make sure you\'re running this in the app with Firebase loaded\n');
      return;
    }

    const db = getFirestore();
    const userRef = doc(db, 'users', currentUser.id);

    // Update user document
    const updates = {
      accountType: 'anonymous',
      recoveryCode: null,
      recoveryCodeExpiresAt: null,
      recoveryCodeGeneratedAt: null,
      updatedAt: new Date(),
    };

    await updateDoc(userRef, updates);

    console.log('✅ Migration successful!');
    console.log('   accountType: anonymous');
    console.log('   recoveryCode: null (generate one in Settings)\n');
    
    // Reload user data
    console.log('🔄 Reloading user data...');
    window.location.reload();

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n💡 If you see permission errors, the migration already happened');
    console.log('💡 Try refreshing the page\n');
  }
})();
