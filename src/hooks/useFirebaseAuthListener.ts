/**
 * Firebase Auth State Listener Hook
 * Restores authentication session when user returns
 */

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getFirebaseAuth } from '../services/firebase.service';
import { useAuthStore } from '../store/authStore';
import { getUserById } from '../services/user.service';
import { getTeamById } from '../services/team.service';
import { getTenantById } from '../services/tenant.service';
import { getUserTeams, getTeamMembership } from '../services/teamMember.service';

export function useFirebaseAuthListener() {
  const { setUser, setTeam, setTenant, setLoading, logout } = useAuthStore();

  useEffect(() => {
    const auth = getFirebaseAuth();
    
    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        // User signed out
        await logout();
        return;
      }

      try {
        setLoading(true);

        // 1. Get user document from Firestore
        const userDoc = await getUserById(firebaseUser.uid);
        
        if (!userDoc) {
          console.warn('Firebase user exists but no Firestore user document found');
          await logout();
          return;
        }

        // Set user in store
        setUser(userDoc);

        // 2. Check if user has active team memberships
        const userTeams = await getUserTeams(firebaseUser.uid);
        
        if (userTeams.length === 0) {
          // No active teams - BUT don't clear if team/tenant were just set programmatically
          // This handles the race condition when a new user is created and joins a team
          const currentState = useAuthStore.getState();
          
          if (!currentState.team && !currentState.tenant) {
            // Truly no teams, safe to clear
            setTeam(null);
            setTenant(null);
            console.log('ℹ️ User authenticated but has no active teams');
          } else {
            // Team/tenant were set programmatically (user just joined), keep them
            console.log('ℹ️ User has no teams yet, but team/tenant already set (new join)');
          }
          return;
        }

        // 3. Try to restore last team from persisted state
        const persistedState = useAuthStore.getState();
        
        if (persistedState.team) {
          // Check if user is still in this team
          const membership = await getTeamMembership(
            persistedState.team.id,
            firebaseUser.uid
          );
          
          if (membership && membership.isActive) {
            // Refresh team and tenant data
            const [team, tenant] = await Promise.all([
              getTeamById(persistedState.team.id),
              getTenantById(persistedState.tenant?.id || ''),
            ]);

            if (team && tenant) {
              setTeam(team);
              setTenant(tenant);
              console.log('✅ Session restored for team:', team.teamName || team.accessCode);
              return;
            }
          }
        }

        // 4. If can't restore persisted team, load first active team
        if (userTeams.length > 0) {
          const firstTeamData = userTeams[0];
          const [firstTeam, tenant] = await Promise.all([
            getTeamById(firstTeamData.teamId),
            getTenantById(firstTeamData.eventId), // Note: This might need tenantId instead
          ]);
          
          if (firstTeam && tenant) {
            setTeam(firstTeam);
            setTenant(tenant);
            console.log('✅ Loaded first active team:', firstTeam.teamName || firstTeam.accessCode);
          } else {
            console.warn('Could not load first team data');
          }
        }

        console.log('✅ Auth session restored for user:', firebaseUser.uid);
      } catch (error) {
        console.error('Error restoring auth session:', error);
        await logout();
      } finally {
        setLoading(false);
      }
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [setUser, setTeam, setTenant, setLoading, logout]);
}
