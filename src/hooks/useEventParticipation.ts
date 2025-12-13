/**
 * useEventParticipation Hook
 * Checks if user is already in a specific event
 * Used for validation (1 team per event rule)
 */

import { useState, useEffect } from 'react';
import { getUserParticipationInEvent } from '../services/teamMember.service';
import { getFirebaseAuth } from '../services/firebase.service';
import type { TeamMember } from '../types/schema';

/**
 * Hook to check if user is already in an event
 * 
 * @param eventId - Event ID to check (null to skip check)
 * @returns Participation status and loading state
 */
export function useEventParticipation(eventId: string | null) {
  const auth = getFirebaseAuth();
  const user = auth.currentUser;
  const [participation, setParticipation] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!user || !eventId) {
      setIsLoading(false);
      setParticipation(null);
      return;
    }
    
    async function checkParticipation() {
      if (!user || !eventId) return;
      
      try {
        setIsLoading(true);
        const result = await getUserParticipationInEvent(user.uid, eventId);
        setParticipation(result);
        setError(null);
      } catch (err) {
        console.error('Error checking participation:', err);
        setError('Failed to check event participation');
      } finally {
        setIsLoading(false);
      }
    }
    
    checkParticipation();
  }, [user, eventId]);
  
  return {
    participation,
    isInEvent: participation !== null,
    isLoading,
    error,
  };
}
