import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '../../types/schema';
import { sortTasks } from '../../services/task.service';
import { useAuthStore } from '../../store/authStore';
import { useMapStore } from '../../store/mapStore';
import { useTaskStore } from '../../store/taskStore';
import { TaskCard } from './TaskCard';
import { TaskList } from './TaskList';

function task(id: string, points: number, coordinates?: { lat: number; lng: number }): Task {
  return {
    id,
    title: `Task ${id}`,
    description: '',
    type: 'PHOTO',
    points,
    coordinates,
    isActive: true,
    requiresPhoto: true,
    requiresVideo: false,
    requiresText: false,
  } as Task;
}

const TASKS = [task('a', 50, { lat: 52.53, lng: 13.4 }), task('b', 80, { lat: 52.5201, lng: 13.405 }), task('c', 30)];

vi.mock('../../services/task.service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/task.service')>()),
  getTasksByEvent: vi.fn(async () => TASKS),
}));

describe('sortTasks by distance', () => {
  it('orders tasks nearest first, tasks without a location last', () => {
    const here = { lat: 52.52, lng: 13.405 };
    expect(sortTasks(TASKS, 'distance', here).map((t) => t.id)).toEqual(['b', 'a', 'c']);
  });
});

describe('TaskList', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      team: { id: 't', eventId: 'e', tenantId: 'x', score: 50, completedTaskIds: ['a'] } as never,
      tenant: { id: 'x', name: 'Rally' } as never,
    });
    useTaskStore.setState({ tasks: [], filter: 'available' });
    useMapStore.setState({ userLocation: null });
  });

  it('shows one progress line for tasks and points', async () => {
    render(<TaskList />);
    expect(await screen.findByText('1 / 3 tasks · 50 / 160 pts')).toBeInTheDocument();
  });

  it('shows counts on the filter chips and filters the list', async () => {
    render(<TaskList />);
    const todo = await screen.findByRole('button', { name: 'To do 2' });
    const done = screen.getByRole('button', { name: 'Done 1' });
    expect(todo).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Task b')).toBeInTheDocument();
    expect(screen.queryByText('Task a')).not.toBeInTheDocument();

    await userEvent.click(done);
    expect(done).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Task a')).toBeInTheDocument();
    expect(screen.queryByText('Task b')).not.toBeInTheDocument();
  });

  it('sorts nearest first when the location is known', async () => {
    useMapStore.setState({ userLocation: { lat: 52.53, lng: 13.4 } });
    useTaskStore.setState({ filter: 'all' });
    render(<TaskList />);
    await screen.findByText('Task a');
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual(['Task a', 'Task b', 'Task c']);
  });

  it('tracks the location itself while the list is on screen and stops on unmount', async () => {
    let report: PositionCallback = () => {};
    const clearWatch = vi.fn();
    vi.stubGlobal('navigator', {
      ...navigator,
      geolocation: {
        getCurrentPosition: vi.fn(),
        watchPosition: vi.fn((cb: PositionCallback) => {
          report = cb;
          return 7;
        }),
        clearWatch,
      },
    });
    useTaskStore.setState({ filter: 'all' });
    const { unmount } = render(<TaskList />);
    await screen.findByText('Task a');

    report({ coords: { latitude: 52.5201, longitude: 13.405 } } as GeolocationPosition);
    expect(await screen.findByText('0m')).toBeInTheDocument();
    expect(useMapStore.getState().userLocation).toEqual({ lat: 52.5201, lng: 13.405 });

    unmount();
    expect(clearWatch).toHaveBeenCalledWith(7);
    vi.unstubAllGlobals();
  });

  it('formats both sides of the points total', async () => {
    useAuthStore.setState({
      team: { id: 't', eventId: 'e', tenantId: 'x', score: 0, completedTaskIds: ['a', 'b'] } as never,
    });
    const big = [task('a', 1000), task('b', 250), task('c', 350)];
    useTaskStore.setState({ tasks: big });
    const { getTasksByEvent } = await import('../../services/task.service');
    vi.mocked(getTasksByEvent).mockResolvedValueOnce(big);
    render(<TaskList />);
    expect(await screen.findByText('2 / 3 tasks · 1,250 / 1,600 pts')).toBeInTheDocument();
  });
});

describe('TaskCard', () => {
  it('shows the reward and distance for an open task', () => {
    render(<TaskCard task={TASKS[1]} isCompleted={false} distance={240} />);
    expect(screen.getByRole('button', { name: 'Task b' })).toBeInTheDocument();
    expect(screen.getByText('+80 pts')).toBeInTheDocument();
    expect(screen.getByText('240m')).toBeInTheDocument();
  });

  it('shows "earned" instead of a reward for a done task', () => {
    render(<TaskCard task={TASKS[1]} isCompleted />);
    expect(screen.getByText(/earned/i)).toBeInTheDocument();
    expect(screen.queryByText('+80 pts')).not.toBeInTheDocument();
  });
});
