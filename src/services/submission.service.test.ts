import { describe, expect, it, vi } from 'vitest';

vi.mock('./firebase.service', () => ({ getFirebaseFirestore: () => ({}) }));
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  doc: vi.fn(() => ({})),
  setDoc: vi.fn(async () => {}),
  getDoc: vi.fn(async () => ({ exists: () => true, data: () => ({ completedTaskIds: ['task-1'] }) })),
  getDocs: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  updateDoc: vi.fn(),
  increment: vi.fn(),
  arrayUnion: vi.fn(),
  serverTimestamp: vi.fn(),
}));

import { createSubmission } from './submission.service';

describe('createSubmission', () => {
  it('keeps "Task already completed" so the screen can say so instead of asking for a retry', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(
      createSubmission('task-1', 'team-1', 'tenant', 'event', { type: 'photo', points: 50 })
    ).rejects.toThrow('Task already completed');
  });
});
