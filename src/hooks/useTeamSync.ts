import { useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFirebaseFirestore } from '../services/firebase.service';
import { useAuthStore } from '../store/authStore';
import type { Team } from '../types/schema';

/**
 * Real-time sync hook for team data
 * Listens to Firestore team document changes and updates local state
 * This ensures UI reflects task completion status immediately
 */
export function useTeamSync() {
  const { team, setTeam } = useAuthStore();

  useEffect(() => {
    // Only sync if user is authenticated and has a team
    if (!team?.id) {
      console.log('[useTeamSync] No team to sync');
      return;
    }

    console.log('[useTeamSync] Setting up real-time listener for team:', team.id);

    // Get Firestore instance
    const db = getFirebaseFirestore();

    // Set up real-time listener on team document
    const teamRef = doc(db, 'teams', team.id);
    
    const unsubscribe = onSnapshot(
      teamRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          console.error('[useTeamSync] Team document not found');
          return;
        }

        const updatedTeam = { 
          ...snapshot.data(), 
          id: snapshot.id 
        } as Team;

        // Log changes for debugging
        const oldScore = team.score;
        const oldCompleted = team.completedTaskIds?.length || 0;
        const newScore = updatedTeam.score;
        const newCompleted = updatedTeam.completedTaskIds?.length || 0;

        if (oldScore !== newScore || oldCompleted !== newCompleted) {
          console.log('[useTeamSync] Team data updated:', {
            score: `${oldScore} → ${newScore}`,
            completed: `${oldCompleted} → ${newCompleted}`,
            newCompletedTasks: updatedTeam.completedTaskIds
          });
        }

        // Update local state
        setTeam(updatedTeam);
      },
      (error) => {
        console.error('[useTeamSync] Error syncing team data:', error);
      }
    );

    // Cleanup listener on unmount or team change
    return () => {
      console.log('[useTeamSync] Cleaning up listener for team:', team.id);
      unsubscribe();
    };
  }, [team?.id]); // Only re-subscribe if team ID changes

  return null;
}
