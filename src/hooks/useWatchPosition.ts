import { useEffect, useState } from 'react';
import type { GeoLocation } from '../types/schema';

export interface WatchedPosition {
  position: GeoLocation | null;
  /** Radius of uncertainty in metres, 0 when unknown */
  accuracy: number;
  denied: boolean;
}

const NONE: WatchedPosition = { position: null, accuracy: 0, denied: false };

/**
 * Follows the player's position while enabled. The watch is cleared and the last fix forgotten
 * when disabled or unmounted, so a stopped watch never hands back an old position.
 */
export function useWatchPosition(enabled: boolean): WatchedPosition {
  const [watched, setWatched] = useState<WatchedPosition>(NONE);

  useEffect(() => {
    const geo = navigator.geolocation;
    if (!enabled || !geo) return;
    const id = geo.watchPosition(
      ({ coords }) =>
        setWatched({ position: { lat: coords.latitude, lng: coords.longitude }, accuracy: coords.accuracy ?? 0, denied: false }),
      (error) => {
        console.error('Location tracking error:', error);
        if (error.code === 1) setWatched({ ...NONE, denied: true });
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => {
      geo.clearWatch(id);
      setWatched(NONE);
    };
  }, [enabled]);

  return watched;
}
