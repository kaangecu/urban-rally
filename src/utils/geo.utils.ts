/**
 * Geolocation Utilities
 * Helper functions for GPS and location-based features
 */

import type { GeoLocation } from '../types/schema';
import { appConfig } from '../config/app.config';

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param point1 - First coordinate
 * @param point2 - Second coordinate
 * @returns Distance in meters
 */
export const calculateDistance = (
  point1: GeoLocation,
  point2: GeoLocation
): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Check if user is within task completion radius
 * @param userLocation - Current user GPS position
 * @param taskLocation - Target task location
 * @param radius - Acceptance radius in meters (optional, uses config default)
 * @returns true if within radius
 */
export const isWithinRadius = (
  userLocation: GeoLocation,
  taskLocation: GeoLocation,
  radius: number = appConfig.taskCompletionRadius
): boolean => {
  const distance = calculateDistance(userLocation, taskLocation);
  return distance <= radius;
};

/**
 * Get current user location
 * @returns Promise with current coordinates
 */
export const getCurrentLocation = (): Promise<GeoLocation> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        let message = 'Unable to get your location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please enable location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out.';
            break;
        }
        reject(new Error(message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
};

/**
 * Watch user location continuously
 * @param callback - Called when location updates
 * @returns watchId to clear the watch later
 */
export const watchLocation = (
  callback: (location: GeoLocation) => void,
  errorCallback?: (error: Error) => void
): number => {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported');
  }

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    (error) => {
      if (errorCallback) {
        errorCallback(new Error(error.message));
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    }
  );
};

/**
 * Clear location watch
 * @param watchId - The ID returned from watchLocation
 */
export const clearLocationWatch = (watchId: number): void => {
  navigator.geolocation.clearWatch(watchId);
};

/**
 * Format distance for display
 * @param meters - Distance in meters
 * @returns Formatted string (e.g., "150m" or "1.2km")
 */
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

/**
 * Check if GPS accuracy is acceptable
 * @param accuracy - GPS accuracy in meters
 * @returns true if accuracy is good enough
 */
export const isAccuracyAcceptable = (accuracy: number): boolean => {
  return accuracy <= appConfig.gpsAccuracyThreshold;
};
