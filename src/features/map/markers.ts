/**
 * What a task marker shows on the map: its state, its accessible name and where the map starts.
 */

import type { GeoLocation, Task } from '../../types/schema';
import { appConfig } from '../../config/app.config';
import { calculateDistance } from '../../utils/geo.utils';
import { getTaskTypeInfo } from '../../utils/taskTypes';

export type MarkerState = 'open' | 'in-range' | 'done' | 'locked';

interface MarkerContext {
  completed: boolean;
  userLocation: GeoLocation | null;
  now?: Date;
}

export function getMarkerState(task: Task, { completed, userLocation, now = new Date() }: MarkerContext): MarkerState {
  if (completed) return 'done';
  if (task.unlockAt && task.unlockAt > now) return 'locked';
  if (userLocation && task.coordinates) {
    const radius = task.radius ?? appConfig.taskCompletionRadius;
    if (calculateDistance(userLocation, task.coordinates) <= radius) return 'in-range';
  }
  return 'open';
}

export function getMarkerLabel(task: Task, state: MarkerState): string {
  return `${task.title}, ${getTaskTypeInfo(task.type).label.toLowerCase()}, ${state.replace('-', ' ')}`;
}

/** The event area when set, else the middle of the tasks, else the app default. */
export function getInitialCenter(tasks: Task[], eventCenter?: GeoLocation): [number, number] {
  if (eventCenter) return [eventCenter.lat, eventCenter.lng];
  const points = tasks.flatMap((task) => (task.coordinates ? [task.coordinates] : []));
  if (points.length === 0) return [appConfig.defaultMapCenter.lat, appConfig.defaultMapCenter.lng];
  const sum = points.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 });
  return [sum.lat / points.length, sum.lng / points.length];
}
