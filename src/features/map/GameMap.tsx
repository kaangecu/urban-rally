import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { Icon, type LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMapStore } from '../../store/mapStore';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import { getCurrentLocation, watchLocation } from '../../utils/geo.utils';
import type { Task } from '../../types/schema';

// Fix for default marker icons in React-Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-expect-error _getIconUrl is a private Leaflet field missing from its types
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Map controller component to handle center/zoom updates
function MapController() {
  const map = useMap();
  const { center, zoom } = useMapStore();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
}

// User location marker component
function UserLocationMarker() {
  const { userLocation, setUserLocation, setTrackingLocation } = useMapStore();
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Get initial location
    getCurrentLocation()
      .then((location) => {
        setUserLocation(location);
      })
      .catch((error) => {
        console.error('Error getting location:', error);
      });

    // Start watching location
    watchIdRef.current = watchLocation(
      (location) => {
        setUserLocation(location);
      },
      (error) => {
        console.error('Location tracking error:', error);
        setTrackingLocation(false);
      }
    );

    return () => {
      // Cleanup: stop watching location
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  if (!userLocation) return null;

  const userSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="8" fill="#3B82F6" stroke="white" stroke-width="3"/>
      <circle cx="16" cy="16" r="3" fill="white"/>
    </svg>
  `;

  const userIcon = new Icon({
    iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(userSvg),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <>
      <Marker 
        position={[userLocation.lat, userLocation.lng]} 
        icon={userIcon}
      >
        <Popup>
          <div className="text-center">
            <p className="font-semibold">Your Location</p>
            <p className="text-[13px] text-gray-600">
              {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
            </p>
          </div>
        </Popup>
      </Marker>
      {/* Accuracy circle */}
      <Circle
        center={[userLocation.lat, userLocation.lng]}
        radius={20}
        pathOptions={{
          fillColor: '#3B82F6',
          fillOpacity: 0.1,
          color: '#3B82F6',
          weight: 1,
        }}
      />
    </>
  );
}

// Task marker component
interface TaskMarkerProps {
  task: Task;
  isCompleted: boolean;
}

function TaskMarker({ task, isCompleted }: TaskMarkerProps) {
  const { setSelectedTask } = useTaskStore();
  const { setSelectedMarkerId } = useMapStore();

  if (!task.coordinates) return null;

  const getTaskIcon = (task: Task, isCompleted: boolean) => {
    const color = isCompleted ? '#10B981' : '#3B82F6';
    
    // Use letter abbreviations instead of emojis
    let iconText = 'T';
    if (task.type === 'GPS' || task.type === 'GPS_LOCATION') {
      iconText = 'G';
    } else if (task.type === 'PHOTO') {
      iconText = 'P';
    } else if (task.type === 'VIDEO') {
      iconText = 'V';
    } else if (task.type === 'QUIZ') {
      iconText = 'Q';
    } else if (task.type === 'SPONSORED') {
      iconText = 'S';
    }

    // Use URL encoding instead of btoa to avoid emoji issues
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="52" viewBox="0 0 40 52">
        <path d="M20,0 C8.95,0 0,8.95 0,20 C0,32 20,52 20,52 C20,52 40,32 40,20 C40,8.95 31.05,0 20,0 Z" 
              fill="${color}" stroke="white" stroke-width="2"/>
        <text x="20" y="26" font-size="18" font-weight="bold" text-anchor="middle" fill="white">${iconText}</text>
        ${isCompleted ? '<circle cx="32" cy="8" r="6" fill="#10B981" stroke="white" stroke-width="2"/><text x="32" y="12" font-size="10" font-weight="bold" text-anchor="middle" fill="white">✓</text>' : ''}
      </svg>
    `;

    return new Icon({
      iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      iconSize: [40, 52],
      iconAnchor: [20, 52],
      popupAnchor: [0, -52],
    });
  };

  return (
    <>
      <Marker
        position={[task.coordinates.lat, task.coordinates.lng]}
        icon={getTaskIcon(task, isCompleted)}
        eventHandlers={{
          click: () => {
            setSelectedMarkerId(task.id);
            // setSelectedTask(task);
          },
        }}
      >
        <Popup>
          <div className="min-w-[200px]">
            <h3 className="font-bold text-gray-900 mb-1">{task.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{task.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-blue-600">{task.points} pts</span>
              {isCompleted && (
                <span className="text-[13px] bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
                  ✓ Completed
                </span>
              )}
            </div>
            <button
              onClick={() => setSelectedTask(task)}
              className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
            >
              View Details
            </button>
          </div>
        </Popup>
      </Marker>
      {/* Show radius circle for GPS tasks */}
      {(task.type === 'GPS' || task.type === 'GPS_LOCATION') && task.radius && (
        <Circle
          center={[task.coordinates.lat, task.coordinates.lng]}
          radius={task.radius}
          pathOptions={{
            fillColor: isCompleted ? '#10B981' : '#3B82F6',
            fillOpacity: 0.1,
            color: isCompleted ? '#10B981' : '#3B82F6',
            weight: 2,
            dashArray: '5, 5',
          }}
        />
      )}
    </>
  );
}

export function GameMap() {
  const { tenant } = useAuthStore();
  const { team } = useAuthStore();
  const { tasks } = useTaskStore();
  const { center, zoom, setCenter, setZoom, setMapReady } = useMapStore();

  // Initialize map center from event data
  useEffect(() => {
    if (tenant && !center) {
      // You would typically get this from the event
      // For now, use a default location (Berlin)
      setCenter(52.52, 13.405);
      setZoom(13);
      setMapReady(true);
    }
  }, [tenant, center]);

  if (!center) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  // Filter tasks with coordinates
  const tasksWithLocation = tasks.filter(task => task.coordinates);

  return (
    <div className="h-full relative">
      <MapContainer
        center={center as LatLngExpression}
        zoom={zoom}
        className="h-full w-full z-0"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapController />
        <UserLocationMarker />
        
        {tasksWithLocation.map((task) => (
          <TaskMarker
            key={task.id}
            task={task}
            isCompleted={team?.completedTaskIds.includes(task.id) || false}
          />
        ))}
      </MapContainer>

      {/* Map controls overlay */}
      <div className="absolute top-4 right-4 z-10 space-y-2">
        <button
          onClick={() => useMapStore.getState().focusOnUser()}
          className="bg-white hover:bg-gray-50 text-gray-700 p-3 rounded-lg shadow-lg transition-colors"
          title="Center on my location"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Task count badge */}
      <div className="absolute bottom-4 left-4 z-10 bg-white rounded-lg shadow-lg px-4 py-2">
        <p className="text-sm text-gray-600">
          <span className="font-bold text-blue-600">{tasksWithLocation.length}</span>
          {' '}tasks on map
        </p>
      </div>
    </div>
  );
}
