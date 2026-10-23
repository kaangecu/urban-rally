import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AppHeader } from './AppHeader';
import { BottomNav } from './BottomNav';
import { ScoreReadout } from '../ui/ScoreReadout';

describe('ScoreReadout', () => {
  it('shows the score with a pts label', () => {
    render(<ScoreReadout score={1250} />);
    expect(screen.getByText('1,250')).toBeInTheDocument();
    expect(screen.getByText('pts')).toBeInTheDocument();
  });
});

describe('AppHeader', () => {
  const props = { teamName: 'Night Owls', eventName: 'Campus Rally', score: 420, onLogout: () => {} };

  it('shows team, event and score', () => {
    render(<AppHeader {...props} />);
    expect(screen.getByRole('heading', { name: 'Night Owls' })).toBeInTheDocument();
    expect(screen.getByText('Campus Rally')).toBeInTheDocument();
    expect(screen.getByText('420')).toBeInTheDocument();
  });

  it('keeps Logout inside the team menu until it is opened', async () => {
    const onLogout = vi.fn();
    render(<AppHeader {...props} onLogout={onLogout} />);
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument();

    const menu = screen.getByRole('button', { name: 'Team menu' });
    expect(menu).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(menu);
    expect(menu).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(screen.getByRole('button', { name: 'Log out' }));
    expect(onLogout).toHaveBeenCalledOnce();
  });
});

describe('BottomNav', () => {
  it('marks the current view with aria-current', () => {
    render(<BottomNav viewMode="map" onViewModeChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Map' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Tasks' })).not.toHaveAttribute('aria-current');
  });

  it('switches view when a tab is pressed', async () => {
    const onViewModeChange = vi.fn();
    render(<BottomNav viewMode="list" onViewModeChange={onViewModeChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Map' }));
    expect(onViewModeChange).toHaveBeenCalledWith('map');
  });

  it('does not show points', () => {
    render(<BottomNav viewMode="list" onViewModeChange={() => {}} />);
    expect(screen.queryByText(/pts|xp/i)).not.toBeInTheDocument();
  });
});
