import '@testing-library/jest-dom/vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OfflineBanner } from './OfflineBanner';
import { Toast } from './Toast';

function goOffline(offline: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(!offline);
  act(() => {
    window.dispatchEvent(new Event(offline ? 'offline' : 'online'));
  });
}

describe('OfflineBanner', () => {
  afterEach(() => vi.restoreAllMocks());

  it('appears when the phone goes offline and hides when it is back online', () => {
    render(<OfflineBanner />);
    expect(screen.queryByText("You're offline")).not.toBeInTheDocument();

    goOffline(true);
    expect(screen.getByRole('status')).toHaveTextContent("You're offline");
    expect(screen.getByText(/uploads need a connection/i)).toBeInTheDocument();

    goOffline(false);
    expect(screen.queryByText("You're offline")).not.toBeInTheDocument();
  });
});

describe('Toast', () => {
  it('announces its message and can be dismissed', async () => {
    const onDismiss = vi.fn();
    render(<Toast message="Photo sent" onDismiss={onDismiss} />);
    expect(screen.getByRole('status')).toHaveTextContent('Photo sent');
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
