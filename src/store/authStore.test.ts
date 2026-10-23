import { describe, expect, it } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore.setLoading', () => {
  it('keeps an error that was set while loading when the load finishes', () => {
    useAuthStore.getState().setLoading(true);
    useAuthStore.getState().setError('That code does not match a team.');
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().error).toBe('That code does not match a team.');
  });

  it('clears the last error when a new load starts', () => {
    useAuthStore.getState().setError('old');
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().error).toBeNull();
  });
});
