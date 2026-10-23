import '@testing-library/jest-dom/vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '../../types/schema';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { ScoreReadout } from '../../components/ui/ScoreReadout';
import { TaskDetail } from './TaskDetail';

vi.mock('../submissions/TaskSubmission', () => ({
  TaskSubmission: ({ onSuccess }: { onSuccess: (points: number) => void }) => (
    <button type="button" onClick={() => onSuccess(150)}>Finish upload</button>
  ),
}));

const task = { id: 'gate', title: 'Gate', description: '', type: 'PHOTO', points: 150, isActive: true } as Task;

beforeEach(() => {
  useAuthStore.setState({
    isAuthenticated: true,
    team: { id: 'team', eventId: 'e', tenantId: 'x', score: 100, completedTaskIds: [] } as never,
    tenant: { id: 'x', name: 'Rally' } as never,
  });
  useTaskStore.setState({ selectedTask: task, notice: null });
});

describe('recordCompletion', () => {
  it('adds the points and marks the task done once', () => {
    useAuthStore.getState().recordCompletion('gate', 150);
    useAuthStore.getState().recordCompletion('gate', 150);
    const team = useAuthStore.getState().team!;
    expect(team.score).toBe(250);
    expect(team.completedTaskIds).toEqual(['gate']);
  });
});

describe('Task done', () => {
  it('updates the stores and returns to the list without a reload', async () => {
    render(<TaskDetail />);
    await userEvent.click(screen.getByRole('button', { name: 'Take photo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Finish upload' }));

    const team = useAuthStore.getState().team!;
    expect(team.score).toBe(250);
    expect(team.completedTaskIds).toContain('gate');
    expect(useTaskStore.getState().selectedTask).toBeNull();
    expect(useTaskStore.getState().notice).toMatch(/organisers can still reject/i);
  });
});

describe('ScoreReadout delta', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows the new score and a "+150 pts" delta, without counting up under reduced motion', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), media: query }));
    const { rerender } = render(<ScoreReadout score={100} />);
    act(() => rerender(<ScoreReadout score={250} />));
    expect(screen.getByText('250')).toBeInTheDocument();
    expect(screen.getByText('+150 pts')).toBeInTheDocument();
  });
});
