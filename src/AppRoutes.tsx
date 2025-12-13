/**
 * Main Application Routes
 * Handles multi-tenant, multi-event URL structure
 */

import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useFirebaseAuthListener } from './hooks/useFirebaseAuthListener';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PageLoading } from './components/LoadingSpinner';
import { LoginMethodSelector } from './features/auth/LoginMethodSelector';
import { EventCodeEntry } from './features/auth/EventCodeEntry';
import { LoginPage } from './components/auth/LoginPage';
import { EventSelector } from './pages/EventSelector';
import { TeamBrowser } from './features/teams/TeamBrowser';
import { Dashboard } from './pages/Dashboard';
import { AccountSettings } from './pages/AccountSettings';

export function AppRoutes() {
  const { isAuthenticated } = useAuthStore();
  
  // Listen to Firebase auth state changes (restores session on refresh)
  useFirebaseAuthListener();

  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
