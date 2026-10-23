import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Task, TaskType } from '../../types/schema';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { TaskDetail } from './TaskDetail';

function task(type: TaskType): Task {
  return { id: 't', title: 'Gate', description: 'Find it', type, points: 50, isActive: true } as Task;
}

describe('task type icons', () => {
  beforeEach(() => {
    useAuthStore.setState({ team: null, tenant: { id: 'urban-chase', name: 'Urban Chase' } as never });
  });

  it('disables the action for task types the app cannot capture yet', () => {
    useTaskStore.setState({ selectedTask: task('QR_CODE') });
    render(<TaskDetail />);
    expect(screen.getByRole('button', { name: 'Start task' })).toBeDisabled();
  });
});
