import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '../../types/schema';
import { getTasksByEvent } from '../../services/task.service';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { TaskList } from './TaskList';

vi.mock('../../services/task.service', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../services/task.service')>()),
  getTasksByEvent: vi.fn(),
}));

const loadTasks = vi.mocked(getTasksByEvent);
const openTask = { id: 'a', title: 'Task a', type: 'PHOTO', points: 50, isActive: true } as Task;

describe('TaskList states', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      team: { id: 't', eventId: 'e', tenantId: 'x', score: 0, completedTaskIds: [] } as never,
      tenant: { id: 'x', name: 'Rally' } as never,
    });
    useTaskStore.setState(useTaskStore.getInitialState());
  });

  it('shows skeleton cards while loading, not the empty state', () => {
    loadTasks.mockReturnValue(new Promise(() => {}));
    render(<TaskList />);
    expect(screen.getByRole('status', { name: 'Loading tasks' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
  });

  it('shows the empty state and hides progress when there are no tasks', async () => {
    loadTasks.mockResolvedValue([]);
    render(<TaskList />);
    expect(await screen.findByRole('heading', { name: 'No tasks yet' })).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('links back to To do from an empty Done filter', async () => {
    loadTasks.mockResolvedValue([openTask]);
    render(<TaskList />);
    await userEvent.click(await screen.findByRole('button', { name: 'Done 0' }));
    expect(screen.getByRole('heading', { name: 'Nothing done yet' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Show tasks to do' }));
    expect(screen.getByRole('button', { name: 'To do 1' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Task a')).toBeInTheDocument();
  });
});
