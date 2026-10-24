import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Team } from '../types/schema';

type AuthListener = (user: { uid: string } | null) => void;

const auth = vi.hoisted(() => ({
  listener: null as ((user: { uid: string } | null) => void) | null,
  signOut: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: (_auth: unknown, listener: AuthListener) => {
    auth.listener = listener;
    return () => {
      auth.listener = null;
    };
  },
  signOut: auth.signOut,
}));

vi.mock('../services/firebase.service', () => ({
  getFirebaseAuth: () => ({}),
}));

const { useAuthSession } = await import('./useAuthSession');
const { useAuthStore } = await import('../store/authStore');

const team = { id: 'team-1', accessCode: 'ABCD2345' } as Team;

function emitAuth(user: { uid: string } | null) {
  act(() => auth.listener?.(user));
}

describe('useAuthSession', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({ team: null, tenant: null });
    auth.signOut.mockReset().mockResolvedValue(undefined);
  });

  it('is loading until Firebase reports the auth state', () => {
    const { result } = renderHook(() => useAuthSession());
    expect(result.current.status).toBe('loading');
  });

  it('shows join when signed out, even with a team left in the store', () => {
    useAuthStore.setState({ team });
    const { result } = renderHook(() => useAuthSession());

    emitAuth(null);

    expect(result.current.status).toBe('join');
    expect(useAuthStore.getState().team).toBeNull();
  });

  it('shows join when signed in without a team', () => {
    const { result } = renderHook(() => useAuthSession());

    emitAuth({ uid: 'u1' });

    expect(result.current.status).toBe('join');
  });

  it('shows the game when signed in with a team', () => {
    useAuthStore.setState({ team });
    const { result } = renderHook(() => useAuthSession());

    emitAuth({ uid: 'u1' });

    expect(result.current.status).toBe('game');
  });

  it('logout clears the store and localStorage and signs out of Firebase', async () => {
    useAuthStore.getState().setTeam(team);
    const { result } = renderHook(() => useAuthSession());
    emitAuth({ uid: 'u1' });

    await act(() => result.current.logout());

    expect(auth.signOut).toHaveBeenCalledOnce();
    expect(useAuthStore.getState().team).toBeNull();
    expect(localStorage.getItem('urban-rally-auth') ?? '').not.toContain('team-1');
  });

  it('does not persist a login flag', () => {
    useAuthStore.getState().setTeam(team);
    expect(localStorage.getItem('urban-rally-auth')).not.toContain('isAuthenticated');
  });
});
