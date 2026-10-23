import { renderToStaticMarkup } from 'react-dom/server';
import { DivIcon } from 'leaflet';
import type { Task } from '../../types/schema';
import { getTaskTypeInfo } from '../../utils/taskTypes';
import { getMarkerLabel, type MarkerState } from './markers';

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Leaflet replaces the marker element whenever it gets a new icon object, which drops keyboard focus,
// so hand back the same DivIcon until the marker's look or name actually changes
const cache = new Map<string, DivIcon>();

export function markerIcon(task: Task, state: MarkerState, selected: boolean): DivIcon {
  const label = getMarkerLabel(task, state);
  const key = `${task.type}|${state}|${selected}|${label}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const { Icon } = getTaskTypeInfo(task.type);
  const icon = renderToStaticMarkup(<Icon className="ur-marker__icon" aria-hidden="true" />);
  const divIcon = new DivIcon({
    className: '',
    // The name lives in the icon (Leaflet gives it role="button"), so it updates whenever the icon does
    html: `<span class="ur-marker ur-marker--${state}${selected ? ' ur-marker--selected' : ''}"><span class="ur-marker__shape"></span>${icon}<span class="sr-only">${escapeHtml(label)}</span></span>`,
    iconSize: [44, 44],
    iconAnchor: [22, 44],
  });
  cache.set(key, divIcon);
  return divIcon;
}
