/**
 * Main Application Routes
 * Handles multi-tenant, multi-event URL structure
 */

import { Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { AuthProvider } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageLoading } from './components/LoadingSpinner';
import { LoginMethodSelector } from './features/auth/LoginMethodSelector';
import { EventCodeEntry } from './features/auth/EventCodeEntry';
import { LoginPage } from './components/auth/LoginPage';
import { EventSelector } from './pages/EventSelector';
import { TeamBrowser } from './features/teams/TeamBrowser';
import { Dashboard } from './pages/Dashboard';
import { AccountSettings } from './pages/AccountSettings';
import { useProfileGuard } from './hooks/useProfileGuard';
import { IdentityUplinkModal } from './components/auth/IdentityUplinkModal';
import { appConfig } from './config/app.config';
import type { User } from './types/schema';

// Admin imports
import { AdminRoute } from './components/admin/AdminRoute';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { EventList } from './pages/admin/EventList';
import { EventForm } from './pages/admin/EventForm';

/**
 * RoutesWithProfileGuard
 * Wraps routes with profile guard logic (must be inside AuthProvider)
 */
function RoutesWithProfileGuard() {
  const { isAuthenticated } = useAuthStore();
  const { needsProfile, isChecking } = useProfileGuard();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show onboarding modal when profile check completes and user needs profile
  useEffect(() => {
    if (!isChecking && needsProfile) {
      console.log('🎯 Showing onboarding modal');
      setShowOnboarding(true);
    }
  }, [isChecking, needsProfile]);

  // Show loading state while checking profile
  if (isChecking) {
    return <PageLoading message="Getting ready..." />;
  }

  const handleOnboardingSuccess = (user: User) => {
    console.log('✅ Onboarding completed for user', user.id);
    setShowOnboarding(false);
  };

  // Get tenant ID from URL params or use default
  const getTenantId = (): string => {
    const urlParams = new URLSearchParams(window.location.search);
    const tenantIdFromUrl = urlParams.get('tenantId');
    
    if (tenantIdFromUrl) {
      return tenantIdFromUrl;
    }
    
    // Use default tenant from config
    return appConfig.defaultTenantId || 'esn-berlin';
  };

  return (
    <>
      {/* Global onboarding modal - shown to new users on app launch */}
      <IdentityUplinkModal
        isOpen={showOnboarding}
        onClose={() => {}} // Non-dismissible during initial onboarding
        onSuccess={handleOnboardingSuccess}
        tenantId={getTenantId()}
        required={true} // Makes modal non-dismissible
      />
      
      {/* Main routes */}
      <BrowserRouter>
        <Suspense fallback={<PageLoading />}>
        <Routes>
            {/* Public Routes - New Hybrid Login Flow */}
            <Route 
              path="/" 
              element={!isAuthenticated ? <LoginMethodSelector /> : <Navigate to="/events" />} 
            />
            <Route 
              path="/join/event" 
              element={!isAuthenticated ? <EventCodeEntry /> : <Navigate to="/events" />} 
            />
            <Route 
              path="/join/team" 
              element={!isAuthenticated ? <LoginPage /> : <Navigate to="/events" />} 
            />
            <Route 
              path="/login" 
              element={<Navigate to="/" />}
            />
            
            {/* Semi-Public Route - Can browse teams without auth, but need auth to join */}
            <Route 
              path="/tenant/:tenantId/event/:eventId/teams" 
              element={<TeamBrowser />} 
            />

            {/* Admin Routes - Public login */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Routes - Protected */}
            <Route 
              path="/admin" 
              element={
                <AdminRoute requiredRole="moderator">
                  <AdminDashboard />
                </AdminRoute>
              } 
            />
            
            <Route 
              path="/admin/events" 
              element={
                <AdminRoute requiredRole="organizer">
                  <EventList />
                </AdminRoute>
              } 
            />
            
            <Route 
              path="/admin/events/new" 
              element={
                <AdminRoute requiredRole="organizer">
                  <EventForm />
                </AdminRoute>
              } 
            />
            
            <Route 
              path="/admin/events/:eventId/edit" 
              element={
                <AdminRoute requiredRole="organizer">
                  <EventForm />
                </AdminRoute>
              } 
            />

            {/* Protected Routes */}
            {isAuthenticated ? (
              <>
                {/* Event Selection */}
                <Route path="/events" element={<EventSelector />} />
                
                {/* Account Settings */}
                <Route path="/settings" element={<AccountSettings />} />
                
                {/* Dashboard (Main App) */}
                <Route 
                  path="/tenant/:tenantId/event/:eventId/dashboard" 
                  element={<Dashboard />} 
                />
          </>
        ) : (
          <Route path="*" element={<Navigate to="/" />} />
        )}
      </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
}

export function AppRoutes() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RoutesWithProfileGuard />
      </AuthProvider>
    </ErrorBoundary>
  );
}
