import '@testing-library/jest-dom/vitest';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '../../types/schema';
import { useAuthStore } from '../../store/authStore';
import { useMapStore } from '../../store/mapStore';
import { useTaskStore } from '../../store/taskStore';
import { TaskDetail } from './TaskDetail';

const GATE = { lat: 52.5163, lng: 13.3777 };
const checkIn = {
  id: 'gate', title: 'Brandenburg Gate', description: '', type: 'GPS', points: 50, isActive: true,
  coordinates: GATE, radius: 50,
} as Task;

let emit: (lat: number, lng: number, accuracy?: number) => void = () => {};
let fail: (code: number) => void = () => {};
const clearWatch = vi.fn();

beforeEach(() => {
  vi.stubGlobal('navigator', {
    ...navigator,
    geolocation: {
      getCurrentPosition: vi.fn(),
      watchPosition: vi.fn((onPosition: PositionCallback, onError: PositionErrorCallback) => {
        emit = (lat, lng, accuracy = 5) =>
          act(() => onPosition({ coords: { latitude: lat, longitude: lng, accuracy } } as GeolocationPosition));
        fail = (code) => act(() => onError({ code, message: 'denied' } as GeolocationPositionError));
        return 7;
      }),
      clearWatch,
    },
  });
  useAuthStore.setState({
    isAuthenticated: true,
    team: { id: 'team', eventId: 'e', tenantId: 'x', score: 0, completedTaskIds: [] } as never,
    tenant: { id: 'x', name: 'Rally' } as never,
  });
  useMapStore.setState({ userLocation: null });
  useTaskStore.setState({ selectedTask: checkIn });
});

afterEach(() => {
  vi.unstubAllGlobals();
  clearWatch.mockReset();
});

describe('TaskDetail distance', () => {
  it('disables Check in with the exact distance until the player is in range', () => {
    render(<TaskDetail />);
    const button = screen.getByRole('button', { name: 'Check in' });

    emit(GATE.lat + 0.00216, GATE.lng); // about 240 m north
    expect(button).toBeDisabled();
    expect(screen.getByText(/^You're 2\d\d m away\. Get within 50 m\.$/)).toBeInTheDocument();

    emit(GATE.lat + 0.0002, GATE.lng); // about 22 m
    expect(button).toBeEnabled();
    expect(screen.queryByText(/m away\. Get within/)).not.toBeInTheDocument();
  });

  it('stops watching the position when the detail closes', () => {
    const { unmount } = render(<TaskDetail />);
    unmount();
    expect(clearWatch).toHaveBeenCalledWith(7);
  });

  it('forgets the watched fix when the detail closes, so the next check-in starts from the live location', () => {
    const { rerender } = render(<TaskDetail />);
    emit(GATE.lat + 0.00216, GATE.lng); // 240 m away at the first visit

    act(() => useTaskStore.setState({ selectedTask: null }));
    rerender(<TaskDetail />);
    act(() => {
      useMapStore.setState({ userLocation: { lat: GATE.lat + 0.0002, lng: GATE.lng } }); // walked to the gate
      useTaskStore.setState({ selectedTask: checkIn });
    });
    rerender(<TaskDetail />);
    expect(screen.getByRole('button', { name: 'Check in' })).toBeEnabled();
  });

  it('keeps the changing distance out of the live region', () => {
    render(<TaskDetail />);
    emit(GATE.lat + 0.00216, GATE.lng);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Too far away');
    expect(status).not.toHaveTextContent(/\d+ m away/);
  });

  it('does not block Check in when the fix is too coarse to tell', () => {
    render(<TaskDetail />);
    emit(GATE.lat + 0.00216, GATE.lng, 500); // 240 m away, but ±500 m
    expect(screen.getByRole('button', { name: 'Check in' })).toBeEnabled();
  });

  it('asks the player to turn on location when permission is denied', () => {
    render(<TaskDetail />);
    fail(1);
    expect(screen.getByText('Turn on location to check in')).toBeInTheDocument();
  });
});
