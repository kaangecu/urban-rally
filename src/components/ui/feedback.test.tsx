import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Alert } from './Alert';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';

describe('Alert', () => {
  it('uses role="alert" for danger so it is announced at once', () => {
    render(<Alert variant="danger" title="Couldn't save your photo." />);
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't save your photo.");
  });

  it('uses role="status" for info, success and warning', () => {
    render(
      <>
        <Alert variant="info" title="Heads up" />
        <Alert variant="success" title="Task done" />
        <Alert variant="warning" title="You're 240 m away" />
      </>
    );
    expect(screen.getAllByRole('status')).toHaveLength(3);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows its text under the title', () => {
    render(<Alert variant="success" title="Task done" text="Organisers can still reject it." />);
    expect(screen.getByRole('status')).toHaveTextContent('Organisers can still reject it.');
  });
});

describe('EmptyState', () => {
  it('renders its action and calls it on click', async () => {
    const onAction = vi.fn();
    render(<EmptyState title="Nothing done yet" text="Your finished tasks show up here." actionLabel="See tasks to do" onAction={onAction} />);
    expect(screen.getByRole('heading', { name: 'Nothing done yet' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'See tasks to do' }));
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('has no button without an action', () => {
    render(<EmptyState title="No tasks yet" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('Skeleton', () => {
  it('is hidden from screen readers', () => {
    const { container } = render(<Skeleton shape="card" />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });
});
