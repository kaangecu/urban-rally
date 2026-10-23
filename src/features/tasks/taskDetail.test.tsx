import '@testing-library/jest-dom/vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task, TaskType } from '../../types/schema';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { getTaskAction } from '../../utils/taskTypes';
import { TaskDetail } from './TaskDetail';

vi.mock('../submissions/CameraCapture', () => ({ CameraCapture: () => <div>Camera open</div> }));
vi.mock('../submissions/VideoCapture', () => ({ VideoCapture: () => <div>Video camera open</div> }));

function task(type: TaskType, overrides: Partial<Task> = {}): Task {
  return { id: 't1', title: 'Brandenburg Gate', description: 'Photo of the gate', type, points: 80, isActive: true, ...overrides } as Task;
}

describe('getTaskAction', () => {
  it('names the action for each task type', () => {
    expect(getTaskAction('PHOTO')).toBe('Take photo');
    expect(getTaskAction('VIDEO')).toBe('Record video');
    expect(getTaskAction('QUIZ')).toBe('Answer quiz');
    expect(getTaskAction('GPS')).toBe('Check in');
    expect(getTaskAction('GPS_LOCATION')).toBe('Check in');
  });
});

describe('TaskDetail', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      team: { id: 'team', eventId: 'e', tenantId: 'x', score: 0, completedTaskIds: [] } as never,
      tenant: { id: 'x', name: 'Rally' } as never,
    });
  });

  it('shows one primary button named after the task type', () => {
    useTaskStore.setState({ selectedTask: task('VIDEO') });
    render(<TaskDetail />);
    expect(screen.getByRole('dialog', { name: 'Brandenburg Gate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Record video' })).toBeInTheDocument();
  });

  it('goes straight to the camera, without a confirmation sheet', async () => {
    useTaskStore.setState({ selectedTask: task('PHOTO') });
    render(<TaskDetail />);
    await userEvent.click(screen.getByRole('button', { name: 'Take photo' }));
    expect(screen.getByText('Camera open')).toBeInTheDocument();
    expect(screen.queryByText(/ready to complete/i)).not.toBeInTheDocument();
  });

  it('shows what a hint costs before it is unlocked', () => {
    useTaskStore.setState({ selectedTask: task('PHOTO', { hints: [{ id: 'h1', text: 'Look up', cost: 20 }] }) });
    render(<TaskDetail />);
    expect(screen.getByText('Costs 20 pts')).toBeInTheDocument();
    expect(screen.queryByText('Look up')).not.toBeInTheDocument();
  });

  describe('check-in location check', () => {
    let report: PositionCallback = () => {};
    beforeEach(() => {
      vi.stubGlobal('navigator', {
        ...navigator,
        geolocation: {
          getCurrentPosition: vi.fn((cb: PositionCallback) => { report = cb; }),
          watchPosition: vi.fn(() => 1),
          clearWatch: vi.fn(),
        },
      });
      return () => vi.unstubAllGlobals();
    });
    const gate = { lat: 52.5163, lng: 13.3777 };
    const fix = (lat: number, lng: number) =>
      ({ coords: { latitude: lat, longitude: lng, accuracy: 5 } }) as GeolocationPosition;

    it('waits for the location check before opening the camera', async () => {
      useTaskStore.setState({ selectedTask: task('GPS', { coordinates: gate, radius: 50 }) });
      render(<TaskDetail />);
      await userEvent.click(screen.getByRole('button', { name: 'Check in' }));
      expect(screen.getByText('Checking your location…')).toBeInTheDocument();
      expect(screen.queryByText('Camera open')).not.toBeInTheDocument();

      act(() => report(fix(gate.lat, gate.lng)));
      expect(screen.getByText('Camera open')).toBeInTheDocument();
    });

    it('never opens the camera when the check says too far', async () => {
      useTaskStore.setState({ selectedTask: task('GPS', { coordinates: gate, radius: 50 }) });
      render(<TaskDetail />);
      await userEvent.click(screen.getByRole('button', { name: 'Check in' }));
      act(() => report(fix(52.53, 13.4)));
      expect(screen.queryByText('Camera open')).not.toBeInTheDocument();
      expect(screen.queryByText('Checking your location…')).not.toBeInTheDocument();
    });
  });
});
