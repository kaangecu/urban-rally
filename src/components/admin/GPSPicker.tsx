import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface GPSPickerProps {
  coordinates?: { lat: number; lng: number };
  radius?: number;
  onCoordinatesChange: (coords: { lat: number; lng: number }) => void;
  onRadiusChange: (radius: number) => void;
  disabled?: boolean;
}

export function GPSPicker({
  coordinates,
  radius = 50,
  onCoordinatesChange,
  onRadiusChange,
  disabled,
}: GPSPickerProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const circleRef = useRef<L.Circle | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const [localRadius, setLocalRadius] = useState(radius);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const defaultCenter: [number, number] = coordinates
      ? [coordinates.lat, coordinates.lng]
      : [52.52, 13.405]; // Berlin default

    const map = L.map(mapContainerRef.current).setView(defaultCenter, 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;

    // Add marker if coordinates provided
    if (coordinates) {
      const marker = L.marker([coordinates.lat, coordinates.lng], {
        draggable: !disabled,
      }).addTo(map);

      const circle = L.circle([coordinates.lat, coordinates.lng], {
        radius: radius,
        color: '#3b82f6',
        fillColor: '#3b82f6',
        fillOpacity: 0.2,
      }).addTo(map);

      markerRef.current = marker;
      circleRef.current = circle;

      // Handle marker drag
      if (!disabled) {
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onCoordinatesChange({ lat: pos.lat, lng: pos.lng });
          if (circleRef.current) {
            circleRef.current.setLatLng(pos);
          }
        });
      }
    }

    // Handle map click to place marker
    if (!disabled) {
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        onCoordinatesChange({ lat, lng });

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          if (circleRef.current) {
            circleRef.current.setLatLng([lat, lng]);
          }
        } else {
          const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
          const circle = L.circle([lat, lng], {
            radius: localRadius,
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 0.2,
          }).addTo(map);

          markerRef.current = marker;
          circleRef.current = circle;

          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onCoordinatesChange({ lat: pos.lat, lng: pos.lng });
            if (circleRef.current) {
              circleRef.current.setLatLng(pos);
            }
          });
        }
      });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
      circleRef.current = null;
    };
  }, []); // Only run once on mount

  // Update marker position when coordinates prop changes
  useEffect(() => {
    if (coordinates && markerRef.current) {
      markerRef.current.setLatLng([coordinates.lat, coordinates.lng]);
      if (circleRef.current) {
        circleRef.current.setLatLng([coordinates.lat, coordinates.lng]);
      }
      mapRef.current?.setView([coordinates.lat, coordinates.lng]);
    }
  }, [coordinates]);

  // Update circle radius
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius);
    }
    setLocalRadius(radius);
  }, [radius]);

  const handleRadiusChange = (newRadius: number) => {
    setLocalRadius(newRadius);
    onRadiusChange(newRadius);
    if (circleRef.current) {
      circleRef.current.setRadius(newRadius);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-slate-300 mb-2">
          Location Picker
        </label>
        <p className="text-xs text-slate-500 mb-3">
          Click on the map to place the marker, or drag it to adjust the location
        </p>
        <div
          ref={mapContainerRef}
          className="h-[300px] md:h-[400px] rounded-lg overflow-hidden border border-slate-700"
        />
      </div>

      <div>
        <label htmlFor="radius" className="block text-sm font-bold text-slate-300 mb-2">
          Acceptance Radius: {localRadius}m
        </label>
        <input
          id="radius"
          type="range"
          min="10"
          max="500"
          step="10"
          value={localRadius}
          onChange={(e) => handleRadiusChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 touch-manipulation"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>10m</span>
          <span>500m</span>
        </div>
      </div>

      {coordinates && (
        <div className="bg-slate-800/50 rounded-lg p-3 text-xs font-mono">
          <div className="grid grid-cols-2 gap-2 text-slate-400">
            <div>
              <span className="text-slate-500">Latitude:</span> {coordinates.lat.toFixed(6)}
            </div>
            <div>
              <span className="text-slate-500">Longitude:</span> {coordinates.lng.toFixed(6)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
