import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BootError } from './BootError';

describe('BootError', () => {
  const error = Object.assign(new Error('Firebase: internal details (projects/secret-123)'), {
    code: 'auth/network-request-failed',
  });

  it('shows the message, a short code and Reload, never the raw error', () => {
    render(<BootError error={error} />);
    expect(screen.getByRole('heading', { name: "Urban Rally couldn't start" })).toBeInTheDocument();
    expect(screen.getByText('Check your connection and reload.')).toBeInTheDocument();
    expect(screen.getByText('auth/network-request-failed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reload' })).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/internal details|secret-123/);
  });

  it('uses a generic code when the error has none', () => {
    render(<BootError error={new Error('boom')} />);
    expect(screen.getByText('boot/unknown')).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent('boom');
  });

  it('reloads the page on Reload', async () => {
    const onReload = vi.fn();
    render(<BootError error={error} onReload={onReload} />);
    await userEvent.click(screen.getByRole('button', { name: 'Reload' }));
    expect(onReload).toHaveBeenCalledOnce();
  });
});
