import '@testing-library/jest-dom/vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '../../types/schema';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { ScoreReadout } from '../../components/ui/ScoreReadout';
import { TaskNotice } from './TaskNotice';
import { TaskDetail } from './TaskDetail';

type SubmissionProps = {
  onSent: (points: number | null) => void;
  onSuccess: () => void;
  onSendFailed: () => void;
  onCancel: () => void;
};
// The first capture's callbacks, so a test can land its upload after the player moved on
const firstCapture: { props: SubmissionProps | null } = { props: null };

// onSent: the submission landed (also after the player left); onSuccess: close this capture
vi.mock('../submissions/TaskSubmission', () => ({
  TaskSubmission: (props: SubmissionProps) => {
    firstCapture.props ??= props;
    const { onSent, onSuccess, onSendFailed, onCancel } = props;
    return (
    <>
      <button type="button" onClick={() => { onSent(150); onSuccess(); }}>Finish upload</button>
      <button type="button" onClick={onCancel}>Keep playing</button>
      <button type="button" onClick={() => { onSent(null); onSuccess(); }}>Teammate was first</button>
      <button type="button" onClick={() => onSendFailed()}>Upload fails after leaving</button>
    </>
    );
  },
}));

const task = { id: 'gate', title: 'Gate', description: '', type: 'PHOTO', points: 150, isActive: true } as Task;

beforeEach(() => {
  useAuthStore.setState({
    isAuthenticated: true,
    team: { id: 'team', eventId: 'e', tenantId: 'x', score: 100, completedTaskIds: [] } as never,
    tenant: { id: 'x', name: 'Rally' } as never,
  });
  useTaskStore.setState({ selectedTask: task, notice: null });
  firstCapture.props = null;
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

describe('Task done, review fixes', () => {
  it('does not close the capture that is open when an earlier upload lands', async () => {
    render(<TaskDetail />);
    await userEvent.click(screen.getByRole('button', { name: 'Take photo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Keep playing' }));

    // The player opens another task and starts its capture
    act(() => useTaskStore.setState({ selectedTask: { ...task, id: 'tower', title: 'Tower' } }));
    await userEvent.click(screen.getByRole('button', { name: 'Take photo' }));
    act(() => firstCapture.props!.onSent(150));

    expect(screen.getByRole('button', { name: 'Finish upload' })).toBeInTheDocument();
    expect(useAuthStore.getState().team!.score).toBe(250);
  });

  it('says the task is already done, without "+0 pts", when a teammate got there first', async () => {
    render(<TaskDetail />);
    await userEvent.click(screen.getByRole('button', { name: 'Take photo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Teammate was first' }));

    expect(useTaskStore.getState().notice).toBe('Your team already did this task.');
    expect(useAuthStore.getState().team!.completedTaskIds).toContain('gate');
    expect(useAuthStore.getState().team!.score).toBe(100);
  });

  it('tells the player when an upload they left fails', async () => {
    render(<TaskDetail />);
    await userEvent.click(screen.getByRole('button', { name: 'Take photo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Upload fails after leaving' }));

    expect(useTaskStore.getState().notice).toBe("“Gate” wasn't sent. Open it and try again.");
    expect(useTaskStore.getState().noticeTone).toBe('danger');
  });
});

describe('TaskNotice', () => {
  it('shows the notice wherever the player is and can be dismissed', async () => {
    useTaskStore.getState().setNotice('Sent! +150 pts.');
    render(<TaskNotice />);
    expect(screen.getByRole('status')).toHaveTextContent('Sent! +150 pts.');
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(useTaskStore.getState().notice).toBeNull();
  });

  it('is cleared on logout, so the next team never sees it', () => {
    useTaskStore.getState().setNotice('Sent! +150 pts.');
    useAuthStore.getState().logout();
    expect(useTaskStore.getState().notice).toBeNull();
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

  it('drops the delta when the score goes down before it hides', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('reduce'), media: query }));
    const { rerender } = render(<ScoreReadout score={100} />);
    act(() => rerender(<ScoreReadout score={250} />));
    act(() => rerender(<ScoreReadout score={200} />));
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.queryByText(/\+150 pts/)).not.toBeInTheDocument();
  });
});
