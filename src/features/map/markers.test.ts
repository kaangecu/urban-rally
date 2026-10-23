import { describe, expect, it } from 'vitest';
import type { Task } from '../../types/schema';
import { getInitialCenter, getMarkerLabel, getMarkerState } from './markers';

const NOW = new Date('2026-10-23T12:00:00Z');
const here = { lat: 52.5186, lng: 13.3762 };

function task(overrides: Partial<Task> = {}): Task {
  return {
    id: 'r',
    title: 'Reichstag Building',
    type: 'GPS',
    points: 80,
    isActive: true,
    coordinates: { lat: 52.5186, lng: 13.3762 },
    radius: 50,
    ...overrides,
  } as Task;
}

describe('getMarkerState', () => {
  it('is done when the team completed the task, even if it is near', () => {
    expect(getMarkerState(task(), { completed: true, userLocation: here, now: NOW })).toBe('done');
  });

  it('is locked before the task unlocks', () => {
    const later = new Date('2026-10-23T13:00:00Z');
    expect(getMarkerState(task({ unlockAt: later }), { completed: false, userLocation: here, now: NOW })).toBe('locked');
  });

  it('is in range when the player is inside the task radius', () => {
    expect(getMarkerState(task(), { completed: false, userLocation: here, now: NOW })).toBe('in-range');
  });

  it('is open when the player is outside the radius or not located', () => {
    const far = { lat: 52.5206, lng: 13.3862 }; // about 700 m away
    expect(getMarkerState(task(), { completed: false, userLocation: far, now: NOW })).toBe('open');
    expect(getMarkerState(task(), { completed: false, userLocation: null, now: NOW })).toBe('open');
  });
});

describe('getMarkerLabel', () => {
  it('names the task, its type and its state', () => {
    expect(getMarkerLabel(task(), 'open')).toBe('Reichstag Building, check-in, open');
    expect(getMarkerLabel(task({ type: 'PHOTO' }), 'in-range')).toBe('Reichstag Building, photo, in range');
  });
});

describe('getInitialCenter', () => {
  const tasks = [task({ coordinates: { lat: 52.5, lng: 13.4 } }), task({ coordinates: { lat: 52.6, lng: 13.6 } })];

  it('uses the event area when it is set', () => {
    expect(getInitialCenter(tasks, { lat: 48.137, lng: 11.575 })).toEqual([48.137, 11.575]);
  });

  it('falls back to the middle of the tasks', () => {
    const [lat, lng] = getInitialCenter(tasks);
    expect(lat).toBeCloseTo(52.55);
    expect(lng).toBeCloseTo(13.5);
  });

  it('falls back to the app default without tasks', () => {
    expect(getInitialCenter([])).toEqual([52.52, 13.405]);
  });
});
