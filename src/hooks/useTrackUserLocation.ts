import { useEffect } from 'react';
import { useMapStore } from '../store/mapStore';
import { getCurrentLocation, watchLocation } from '../utils/geo.utils';

/**
 * Keeps mapStore.userLocation live while the calling view is mounted.
 * Used by both the task list and the map so distances never come from an old map visit.
 */
export function useTrackUserLocation() {
  const setUserLocation = useMapStore((state) => state.setUserLocation);
  const setTrackingLocation = useMapStore((state) => state.setTrackingLocation);

  useEffect(() => {
    if (!navigator.geolocation) return;

    getCurrentLocation()
      .then(setUserLocation)
      .catch((error) => console.error('Error getting location:', error));

    const watchId = watchLocation(setUserLocation, (error) => {
      console.error('Location tracking error:', error);
      setTrackingLocation(false);
    });

    return () => navigator.geolocation.clearWatch(watchId);
  }, [setUserLocation, setTrackingLocation]);
}
