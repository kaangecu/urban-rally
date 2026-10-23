import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { Task, TaskType } from '../../types/schema';
import { useAuthStore } from '../../store/authStore';
import { TaskSubmission } from '../submissions/TaskSubmission';

function task(type: TaskType): Task {
  return { id: 't', title: 'Gate', description: 'Find it', type, points: 50, isActive: true } as Task;
}

describe('task type icons', () => {
  beforeEach(() => {
    useAuthStore.setState({ team: null, tenant: { id: 'urban-chase', name: 'Urban Chase' } as never });
  });

  it('names and disables the action for task types the app cannot capture yet', () => {
    render(<TaskSubmission task={task('QR_CODE')} onSuccess={() => {}} onCancel={() => {}} />);
    const button = screen.getByRole('button', { name: /QR code/ });
    expect(button).toBeDisabled();
  });
});
