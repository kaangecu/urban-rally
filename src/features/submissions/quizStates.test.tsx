import '@testing-library/jest-dom/vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '../../types/schema';
import { useAuthStore } from '../../store/authStore';
import { useTaskStore } from '../../store/taskStore';
import { QuizInput } from './QuizInput';
import { TaskSubmission } from './TaskSubmission';

vi.mock('../../services/storage.service', () => ({ uploadImage: vi.fn(), uploadVideo: vi.fn() }));
vi.mock('../../services/submission.service', () => ({ createSubmission: vi.fn(), verifyGPSLocation: vi.fn() }));

const RIVERS = ['Spree', 'Rhine', 'Elbe', 'Main'];

describe('QuizInput choices', () => {
  it('is a radio group with A to D keys, moved with the arrow keys', async () => {
    render(<QuizInput question="Which river?" type="multiple-choice" options={RIVERS} onSubmit={() => {}} onCancel={() => {}} />);
    const group = screen.getByRole('radiogroup', { name: 'Which river?' });
    expect(within(group).getAllByRole('radio')).toHaveLength(4);
    expect(within(group).getByText('A')).toBeInTheDocument();
    expect(within(group).getByText('D')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: /Spree/ }));
    expect(screen.getByRole('radio', { name: /Spree/ })).toBeChecked();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: /Rhine/ })).toBeChecked();

    expect(screen.getByRole('button', { name: 'Check answer' })).toBeEnabled();
  });

  it('states the matching rule for text answers', () => {
    render(<QuizInput question="Name the tower" type="text" onSubmit={() => {}} onCancel={() => {}} />);
    expect(screen.getByText("Capitals don't matter and small typos are OK.")).toBeInTheDocument();
  });
});

describe('Quiz attempts', () => {
  const quiz = {
    id: 'q', title: 'River', description: 'Which river runs through Berlin?', type: 'QUIZ', points: 60,
    isActive: true, quizType: 'multiple-choice', quizOptions: RIVERS, quizCorrectAnswer: 'Spree',
    quizHint: 'It starts with S',
  } as Task;

  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: true,
      team: { id: 'team', eventId: 'e', tenantId: 'x', score: 0, completedTaskIds: [] } as never,
      tenant: { id: 'x', name: 'Rally' } as never,
    });
    useTaskStore.setState({ quizProgress: {} });
  });

  async function answer(option: string) {
    await userEvent.click(screen.getByRole('radio', { name: new RegExp(option) }));
    await userEvent.click(screen.getByRole('button', { name: 'Check answer' }));
  }

  it('marks a wrong answer, counts down attempts and shows the task hint', async () => {
    render(<TaskSubmission task={quiz} onSuccess={() => {}} onCancel={() => {}} />);
    expect(screen.queryByText('It starts with S')).not.toBeInTheDocument();

    await answer('Rhine');
    expect(screen.getByRole('radio', { name: /Rhine.*Wrong/ })).toBeInTheDocument();
    expect(screen.getByText('2 attempts left')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('It starts with S')).toBeInTheDocument();
    expect(screen.queryByText(/think carefully/i)).not.toBeInTheDocument();

    await answer('Elbe');
    expect(screen.getByText('1 attempt left')).toBeInTheDocument();
  });

  it('shows a failed view after the last miss', async () => {
    render(<TaskSubmission task={quiz} onSuccess={() => {}} onCancel={() => {}} />);
    await answer('Rhine');
    await answer('Elbe');
    await answer('Main');
    expect(screen.getByRole('heading', { name: 'Out of attempts' })).toBeInTheDocument();
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('clears a wrong choice and locks it, so it cannot be sent again', async () => {
    render(<TaskSubmission task={quiz} onSuccess={() => {}} onCancel={() => {}} />);
    await answer('Rhine');
    const rhine = screen.getByRole('radio', { name: /Rhine/ });
    expect(rhine).not.toBeChecked();
    expect(rhine).toBeDisabled();
    expect(rhine.closest('label')).toHaveClass('border-dashed');
    expect(screen.getByRole('button', { name: 'Check answer' })).toBeDisabled();
  });

  it('keeps every miss marked, not only the latest', async () => {
    render(<TaskSubmission task={quiz} onSuccess={() => {}} onCancel={() => {}} />);
    await answer('Rhine');
    await answer('Elbe');
    expect(screen.getByRole('radio', { name: /Rhine.*Wrong/ })).toBeDisabled();
    expect(screen.getByRole('radio', { name: /Elbe.*Wrong/ })).toBeDisabled();
  });

  it('has the attempts live region in place before the first miss, so the first change is announced', () => {
    const { container } = render(<TaskSubmission task={quiz} onSuccess={() => {}} onCancel={() => {}} />);
    const live = container.ownerDocument.querySelector('[aria-live="polite"]');
    expect(live).toBeInTheDocument();
    expect(live).toBeEmptyDOMElement();
  });

  it('remembers attempts when the quiz is closed and opened again', async () => {
    const first = render(<TaskSubmission task={quiz} onSuccess={() => {}} onCancel={() => {}} />);
    await answer('Rhine');
    first.unmount();

    const second = render(<TaskSubmission task={quiz} onSuccess={() => {}} onCancel={() => {}} />);
    expect(screen.getByText('2 attempts left')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Rhine.*Wrong/ })).toBeInTheDocument();
    await answer('Elbe');
    await answer('Main');
    second.unmount();

    render(<TaskSubmission task={quiz} onSuccess={() => {}} onCancel={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Out of attempts' })).toBeInTheDocument();
  });
});
