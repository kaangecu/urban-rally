import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Sheet } from './Sheet';

function Harness({ onClose = () => {} }: { onClose?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open terms</button>
      <Sheet open={open} title="Terms" onClose={() => { onClose(); setOpen(false); }}>
        <p>Rules of the game</p>
        <button type="button">Accept</button>
      </Sheet>
    </>
  );
}

describe('Sheet', () => {
  it('is a labelled modal dialog', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open terms' }));
    const dialog = screen.getByRole('dialog', { name: 'Terms' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('moves focus into the sheet on open and back to the trigger on close', async () => {
    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open terms' });
    await userEvent.click(trigger);
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('keeps focus inside while open', async () => {
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open terms' }));
    const dialog = screen.getByRole('dialog');
    for (let i = 0; i < 4; i++) {
      await userEvent.tab();
      expect(dialog).toContainElement(document.activeElement as HTMLElement);
    }
    await userEvent.tab({ shift: true });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open terms' }));
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes when the backdrop is pressed', async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open terms' }));
    await userEvent.click(screen.getByTestId('sheet-backdrop'));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('keeps the trap and Escape working after a tap on non-focusable sheet content', async () => {
    const onClose = vi.fn();
    render(<Harness onClose={onClose} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open terms' }));
    const dialog = screen.getByRole('dialog');

    await userEvent.click(screen.getByText('Rules of the game'));
    await userEvent.tab();
    expect(dialog).toContainElement(document.activeElement as HTMLElement);

    await userEvent.click(screen.getByText('Rules of the game'));
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('locks page scroll while open and restores it on close', async () => {
    document.body.style.overflow = 'auto';
    render(<Harness />);
    await userEvent.click(screen.getByRole('button', { name: 'Open terms' }));
    expect(document.body.style.overflow).toBe('hidden');

    await userEvent.keyboard('{Escape}');
    expect(document.body.style.overflow).toBe('auto');
    document.body.style.overflow = '';
  });
});
