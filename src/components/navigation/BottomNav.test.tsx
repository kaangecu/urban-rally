import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Task } from '../../types/schema';
import { TaskCard } from '../../features/tasks/TaskCard';
import { BottomNav } from './BottomNav';

describe('points in the nav and on cards', () => {
  it('shows the nav score with a thousands separator and a lowercase "pts"', () => {
    render(<BottomNav viewMode="list" onViewModeChange={() => {}} teamScore={1250} completedTasks={3} />);
    expect(screen.getByText('1,250')).toBeInTheDocument();
    expect(screen.getByText('pts')).not.toHaveClass('uppercase');
  });

  it('groups thousands on a task card', () => {
    const task = { id: 'a', title: 'Big one', description: '', type: 'PHOTO', points: 1250, isActive: true } as Task;
    render(<TaskCard task={task} isCompleted={false} />);
    expect(screen.getByText('1,250')).toBeInTheDocument();
  });
});
