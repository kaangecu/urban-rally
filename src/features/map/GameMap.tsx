import { useEffect, useRef } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet';
import { DivIcon, type LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocateFixed } from 'lucide-react';
import { useMapStore } from '../../store/mapStore';
import { useTaskStore } from '../../store/taskStore';
import { useAuthStore } from '../../store/authStore';
import { getCurrentLocation, watchLocation } from '../../utils/geo.utils';
import type { Task } from '../../types/schema';
import { formatPoints } from '../../utils/format';
import { getTaskTypeInfo } from '../../utils/taskTypes';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Sheet } from '../../components/ui/Sheet';
import { TaskTypeTag } from '../../components/ui/TaskTypeTag';
import { getInitialCenter, getMarkerLabel, getMarkerState, type MarkerState } from './markers';

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

const userIcon = new DivIcon({
  className: '',
  html: '<span class="ur-me"></span>',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// User location marker component
function UserLocationMarker() {
  const { userLocation, setUserLocation, setTrackingLocation, focusOnUser } = useMapStore();
  const watchIdRef = useRef<number | null>(null);
  const centredRef = useRef(false);

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

  // Centre on the player once, when they are first located
  useEffect(() => {
    if (userLocation && !centredRef.current) {
      centredRef.current = true;
      focusOnUser();
    }
  }, [userLocation, focusOnUser]);

  if (!userLocation) return null;

  return (
    <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} title="Your location" keyboard={false} />
  );
}

function markerIcon(task: Task, state: MarkerState, selected: boolean) {
  const { Icon } = getTaskTypeInfo(task.type);
  const icon = renderToStaticMarkup(<Icon className="ur-marker__icon" aria-hidden="true" />);
  return new DivIcon({
    className: '',
    html: `<span class="ur-marker ur-marker--${state}${selected ? ' ur-marker--selected' : ''}"><span class="ur-marker__shape"></span>${icon}</span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
  });
}

// Task marker component
interface TaskMarkerProps {
  task: Task;
  state: MarkerState;
  selected: boolean;
}

function TaskMarker({ task, state, selected }: TaskMarkerProps) {
  const { setSelectedMarkerId } = useMapStore();

  if (!task.coordinates) return null;

  return (
    <>
      <Marker
        position={[task.coordinates.lat, task.coordinates.lng]}
        icon={markerIcon(task, state, selected)}
        title={getMarkerLabel(task, state)}
        eventHandlers={{
          click: () => setSelectedMarkerId(task.id),
        }}
      />
      {/* Show radius circle for GPS tasks */}
      {(task.type === 'GPS' || task.type === 'GPS_LOCATION') && task.radius && (
        <Circle
          center={[task.coordinates.lat, task.coordinates.lng]}
          radius={task.radius}
          pathOptions={{ className: 'ur-radius', weight: 2, dashArray: '5, 5', fillOpacity: 0.1 }}
        />
      )}
    </>
  );
}

function TaskPeek({ task, completed, onClose }: { task: Task | null; completed: boolean; onClose: () => void }) {
  const { setSelectedTask } = useTaskStore();
  if (!task) return null;
  const { label, Icon } = getTaskTypeInfo(task.type);

  return (
    <Sheet
      open
      title={task.title}
      onClose={onClose}
      footer={
        <Button
          block
          onClick={() => {
            onClose();
            setSelectedTask(task);
          }}
        >
          Open
        </Button>
      }
    >
      <div className="flex flex-col items-start gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <TaskTypeTag label={label} Icon={Icon} sponsored={!!task.sponsorName} />
          {completed ? (
            <Badge variant="done">{formatPoints(task.points)} earned</Badge>
          ) : (
            <Badge variant="points">{formatPoints(task.points, { signed: true })}</Badge>
          )}
        </div>
        {task.description && <p className="line-clamp-3">{task.description}</p>}
      </div>
    </Sheet>
  );
}

export function GameMap() {
  const { team } = useAuthStore();
  const { tasks } = useTaskStore();
  const { center, zoom, userLocation, selectedMarkerId, setCenter, setSelectedMarkerId, setMapReady, focusOnUser } = useMapStore();

  // Start on the event area; the player's own position takes over once known
  useEffect(() => {
    if (!center) {
      const [lat, lng] = getInitialCenter(tasks);
      setCenter(lat, lng);
      setMapReady(true);
    }
  }, [center, tasks, setCenter, setMapReady]);

  if (!center) return null;

  const tasksWithLocation = tasks.filter((task) => task.coordinates);
  const isCompleted = (task: Task) => team?.completedTaskIds.includes(task.id) ?? false;
  const selectedTask = tasksWithLocation.find((task) => task.id === selectedMarkerId) ?? null;

  return (
    <div className="h-full relative">
      <MapContainer center={center as LatLngExpression} zoom={zoom} className="h-full w-full z-0" zoomControl={false}>
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
            state={getMarkerState(task, { completed: isCompleted(task), userLocation })}
            selected={task.id === selectedMarkerId}
          />
        ))}
      </MapContainer>

      <button
        type="button"
        aria-label="Centre on my location"
        onClick={focusOnUser}
        disabled={!userLocation}
        className="ur-glass absolute top-4 right-4 z-10 grid place-items-center size-11 rounded-pill text-text shadow-nav disabled:text-text-faint focus-visible:outline-2 focus-visible:outline-focus-ring focus-visible:outline-offset-2"
      >
        <LocateFixed className="size-6" aria-hidden="true" />
      </button>

      <TaskPeek
        task={selectedTask}
        completed={selectedTask ? isCompleted(selectedTask) : false}
        onClose={() => setSelectedMarkerId(null)}
      />
    </div>
  );
}
