/**
 * AccountSettings Component
 * User account management page
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getUserEvents } from '../services/user.service';
import { generateRecoveryCode } from '../services/user.service';
import { getFirebaseAuth, getFirebaseFirestore } from '../services/firebase.service';
import { doc, deleteDoc } from 'firebase/firestore';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorState } from '../components/ErrorState';
import type { Event } from '../types/schema';

export function AccountSettings() {
  const navigate = useNavigate();
  const auth = getFirebaseAuth();
  const db = getFirebaseFirestore();
  const { user, logout } = useAuthStore();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRecoveryCode, setShowRecoveryCode] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function loadUserData() {
      try {
        setError(null);
        const userEvents = await getUserEvents(user!.id);
        setEvents(userEvents as Event[]);
      } catch (err) {
        console.error('Error loading user data:', err);
        setError('Failed to load your account data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    loadUserData();
  }, [user]);

  const handleGenerateRecoveryCode = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      'Generate a new recovery code? This will invalidate any previous code.'
    );
    
    if (!confirmed) return;
    
    setIsGeneratingCode(true);
    try {
      await generateRecoveryCode(user.id);
      setShowRecoveryCode(true);
      alert('Recovery code generated! Make sure to save it in a safe place.');
    } catch (error) {
      console.error('Error generating recovery code:', error);
      alert('Failed to generate recovery code. Please try again.');
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCopyRecoveryCode = () => {
    if (!user?.recoveryCode) return;
    
    navigator.clipboard.writeText(user.recoveryCode);
    setCopiedToClipboard(true);
    setTimeout(() => setCopiedToClipboard(false), 2000);
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      '⚠️ WARNING: This will permanently delete your account and all associated data. This action cannot be undone. Are you sure?'
    );
    
    if (!confirmed) return;
    
    const doubleConfirm = window.prompt(
      'Type "DELETE" to confirm account deletion:'
    );
    
    if (doubleConfirm !== 'DELETE') {
      alert('Account deletion cancelled.');
      return;
    }
    
    try {
      // Delete user document
      await deleteDoc(doc(db, 'users', user.id));
      
      // Delete Firebase Auth account
      const currentUser = auth.currentUser;
      if (currentUser) {
        await currentUser.delete();
      }
      
      // Logout
      await logout();
      navigate('/login');
      
      alert('Your account has been deleted.');
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again or contact support.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="large" text="Loading settings..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <ErrorState 
          title="Failed to load settings"
          message={error}
          onRetry={() => window.location.reload()}
          showHomeButton={true}
        />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-2">Manage your account and preferences</p>
        </div>

        {/* Account Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Account Information
          </h2>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-500">Display Name</label>
              <p className="text-gray-900">{user.displayName}</p>
            </div>
            
            {user.email && (
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{user.email}</p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-500">Account Type</label>
              <p className="text-gray-900">
                {user.accountType === 'linked' ? (
                  <span className="inline-flex items-center gap-2">
                    🔗 Linked Account
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    👤 Anonymous Account
                  </span>
                )}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Member Since</label>
              <p className="text-gray-900">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Recovery Code */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Recovery Code
          </h2>
          
          <p className="text-gray-600 mb-4">
            Your recovery code allows you to regain access to your account if you lose your device or clear your browser.
          </p>

          {user.recoveryCode && showRecoveryCode ? (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-yellow-900 mb-2">
                ⚠️ Save this code in a safe place
              </p>
              <div className="flex items-center gap-3">
                <code className="flex-1 font-mono text-2xl font-bold text-gray-900 bg-white p-3 rounded border-2 border-gray-200 text-center tracking-widest">
                  {user.recoveryCode}
                </code>
                <button
                  onClick={handleCopyRecoveryCode}
                  className="px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  {copiedToClipboard ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerateRecoveryCode}
              disabled={isGeneratingCode}
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
            >
              {isGeneratingCode ? 'Generating...' : user.recoveryCode ? 'Show Recovery Code' : 'Generate Recovery Code'}
            </button>
          )}

          {user.recoveryCode && !showRecoveryCode && (
            <button
              onClick={() => setShowRecoveryCode(true)}
              className="mt-3 text-blue-600 hover:text-blue-700 text-sm"
            >
              Reveal existing code
            </button>
          )}
        </div>

        {/* Events */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            My Events
          </h2>
          
          {events.length === 0 ? (
            <p className="text-gray-500">You haven't joined any events yet.</p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-3 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{event.name}</p>
                    <p className="text-sm text-gray-500">
                      {event.isActive ? '🟢 Active' : '🔴 Ended'}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/tenant/${event.tenantId}/event/${event.id}/dashboard`)}
                    className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    View Event →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-900 mb-4">
            Danger Zone
          </h2>
          
          <p className="text-red-700 mb-4">
            Once you delete your account, there is no going back. All your data will be permanently deleted.
          </p>

          <button
            onClick={handleDeleteAccount}
            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
