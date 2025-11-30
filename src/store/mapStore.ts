import { create } from 'zustand';
import type { Task } from '../types/schema';

interface MapState {
  // Map state
  center: [number, number] | null;
  zoom: number;
  userLocation: { lat: number; lng: number } | null;
  isTrackingLocation: boolean;
  
  // Task markers
  selectedMarkerId: string | null;
  hoveredMarkerId: string | null;
  
  // Map controls
  isMapReady: boolean;
  mapError: string | null;

  // Actions
  setCenter: (lat: number, lng: number) => void;
  setZoom: (zoom: number) => void;
  setUserLocation: (location: { lat: number; lng: number } | null) => void;
  setTrackingLocation: (tracking: boolean) => void;
  setSelectedMarkerId: (id: string | null) => void;
  setHoveredMarkerId: (id: string | null) => void;
  setMapReady: (ready: boolean) => void;
  setMapError: (error: string | null) => void;
  focusOnTask: (task: Task) => void;
  focusOnUser: () => void;
}

export const useMapStore = create<MapState>((set, get) => ({
  // Initial state
  center: null,
  zoom: 13,
  userLocation: null,
  isTrackingLocation: false,
  selectedMarkerId: null,
  hoveredMarkerId: null,
  isMapReady: false,
  mapError: null,

  // Actions
  setCenter: (lat, lng) =>
    set({
      center: [lat, lng],
    }),

  setZoom: (zoom) =>
    set({
      zoom,
    }),

  setUserLocation: (userLocation) =>
    set({
      userLocation,
    }),

  setTrackingLocation: (isTrackingLocation) =>
    set({
      isTrackingLocation,
    }),

  setSelectedMarkerId: (selectedMarkerId) =>
    set({
      selectedMarkerId,
    }),

  setHoveredMarkerId: (hoveredMarkerId) =>
    set({
      hoveredMarkerId,
    }),

  setMapReady: (isMapReady) =>
    set({
      isMapReady,
    }),

  setMapError: (mapError) =>
    set({
      mapError,
    }),

  focusOnTask: (task) => {
    if (task.coordinates) {
      set({
        center: [task.coordinates.lat, task.coordinates.lng],
        zoom: 16,
        selectedMarkerId: task.id,
      });
    }
  },

  focusOnUser: () => {
    const { userLocation } = get();
    if (userLocation) {
      set({
        center: [userLocation.lat, userLocation.lng],
        zoom: 16,
      });
    }
  },
}));
