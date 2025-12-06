/**
 * Geospatial Utilities
 * Efficient location-based queries using geohashing
 */

import { GeoPoint } from 'firebase/firestore';

/**
 * Calculate distance between two points using Haversine formula
 * @param point1 First GeoPoint
 * @param point2 Second GeoPoint
 * @returns Distance in meters
 */
export function calculateDistance(point1: GeoPoint, point2: GeoPoint): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.latitude * Math.PI) / 180;
  const φ2 = (point2.latitude * Math.PI) / 180;
  const Δφ = ((point2.latitude - point1.latitude) * Math.PI) / 180;
  const Δλ = ((point2.longitude - point1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Check if a point is within radius of target
 * @param userLocation User's current location
 * @param targetLocation Target location
 * @param radiusMeters Acceptance radius in meters
 * @returns True if within radius
 */
export function isWithinRadius(
  userLocation: GeoPoint,
  targetLocation: GeoPoint,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(userLocation, targetLocation);
  return distance <= radiusMeters;
}

/**
 * Generate geohash for a location
 * Used for efficient radius queries in Firestore
 * @param latitude Latitude
 * @param longitude Longitude
 * @param precision Geohash precision (default 7 for ~150m precision)
 * @returns Geohash string
 */
export function generateGeohash(
  latitude: number,
  longitude: number,
  precision: number = 7
): string {
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let idx = 0;
  let bit = 0;
  let evenBit = true;
  let geohash = '';

  let latMin = -90;
  let latMax = 90;
  let lonMin = -180;
  let lonMax = 180;

  while (geohash.length < precision) {
    if (evenBit) {
      // Longitude
      const lonMid = (lonMin + lonMax) / 2;
      if (longitude > lonMid) {
        idx = (idx << 1) + 1;
        lonMin = lonMid;
      } else {
        idx = idx << 1;
        lonMax = lonMid;
      }
    } else {
      // Latitude
      const latMid = (latMin + latMax) / 2;
      if (latitude > latMid) {
        idx = (idx << 1) + 1;
        latMin = latMid;
      } else {
        idx = idx << 1;
        latMax = latMid;
      }
    }
    evenBit = !evenBit;

    if (++bit === 5) {
      geohash += BASE32[idx];
      bit = 0;
      idx = 0;
    }
  }

  return geohash;
}

/**
 * Generate geohash from GeoPoint
 * @param point GeoPoint
 * @param precision Geohash precision
 * @returns Geohash string
 */
export function geohashFromGeoPoint(point: GeoPoint, precision: number = 7): string {
  return generateGeohash(point.latitude, point.longitude, precision);
}

/**
 * Calculate geohash query bounds for radius search
 * Returns array of [start, end] bounds for each geohash prefix
 * @param center Center point
 * @param radiusMeters Radius in meters
 * @returns Array of geohash bounds
 */
export function getGeohashQueryBounds(
  center: GeoPoint,
  radiusMeters: number
): Array<[string, string]> {
  const lat = center.latitude;
  const lon = center.longitude;

  const latDegrees = radiusMeters / 110574; // Degrees latitude per meter
  const lonDegrees = radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180));

  const queries: Array<[string, string]> = [];
  const precision = getPrecisionForRadius(radiusMeters);

  // Generate geohashes for the 9 cells around center
  const offsets = [
    [0, 0], // Center
    [-latDegrees, 0], // North
    [latDegrees, 0], // South
    [0, -lonDegrees], // West
    [0, lonDegrees], // East
    [-latDegrees, -lonDegrees], // NW
    [-latDegrees, lonDegrees], // NE
    [latDegrees, -lonDegrees], // SW
    [latDegrees, lonDegrees], // SE
  ];

  const geohashes = new Set<string>();
  
  for (const [latOffset, lonOffset] of offsets) {
    const hash = generateGeohash(lat + latOffset, lon + lonOffset, precision);
    geohashes.add(hash);
  }

  // Convert to range queries
  for (const hash of geohashes) {
    queries.push([hash, hash + '~']); // ~ is the last ASCII character
  }

  return queries;
}

/**
 * Get appropriate geohash precision for radius
 * @param radiusMeters Radius in meters
 * @returns Geohash precision level
 */
function getPrecisionForRadius(radiusMeters: number): number {
  if (radiusMeters <= 20) return 8; // ±19m
  if (radiusMeters <= 150) return 7; // ±76m
  if (radiusMeters <= 1200) return 6; // ±610m
  if (radiusMeters <= 5000) return 5; // ±2.4km
  return 4; // ±20km
}

/**
 * Format distance for display
 * @param meters Distance in meters
 * @returns Formatted string
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
}

/**
 * Validate GPS accuracy
 * @param accuracy GPS accuracy in meters
 * @returns True if accuracy is acceptable (< 100m)
 */
export function isGPSAccuracyAcceptable(accuracy: number): boolean {
  return accuracy <= 100; // 100m threshold
}

/**
 * Get bearing between two points
 * @param from Starting point
 * @param to Destination point
 * @returns Bearing in degrees (0-360)
 */
export function getBearing(from: GeoPoint, to: GeoPoint): number {
  const φ1 = (from.latitude * Math.PI) / 180;
  const φ2 = (to.latitude * Math.PI) / 180;
  const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  const θ = Math.atan2(y, x);
  const bearing = ((θ * 180) / Math.PI + 360) % 360;

  return bearing;
}

/**
 * Get cardinal direction from bearing
 * @param bearing Bearing in degrees
 * @returns Cardinal direction (N, NE, E, etc.)
 */
export function getCardinalDirection(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(bearing / 45) % 8;
  return directions[index];
}

/**
 * Create GeoPoint from coordinates
 * @param lat Latitude
 * @param lng Longitude
 * @returns GeoPoint
 */
export function createGeoPoint(lat: number, lng: number): GeoPoint {
  return new GeoPoint(lat, lng);
}

/**
 * Validate coordinate bounds
 * @param lat Latitude
 * @param lng Longitude
 * @returns True if valid
 */
export function areCoordinatesValid(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}
