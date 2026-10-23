import { useEffect, useState } from 'react';
import type { GeoLocation } from '../types/schema';

/** Follows the player's position while enabled; the watch is cleared when disabled or unmounted. */
export function useWatchPosition(enabled: boolean): GeoLocation | null {
  const [position, setPosition] = useState<GeoLocation | null>(null);

  useEffect(() => {
    const geo = navigator.geolocation;
    if (!enabled || !geo) return;
    const id = geo.watchPosition(
      ({ coords }) => setPosition({ lat: coords.latitude, lng: coords.longitude }),
      (error) => console.error('Location tracking error:', error),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => geo.clearWatch(id);
  }, [enabled]);

  return position;
}
