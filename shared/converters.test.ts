import { describe, expect, it } from 'vitest';
import {
  memberConverter,
  submissionConverter,
  taskConverter,
  teamConverter,
} from './converters';
import type { Member, Task, TaskSubmission, Team } from './schema';

// Stands in for a Firestore Timestamp from either SDK: both have toDate().
class FakeTimestamp {
  constructor(private readonly date: Date) {}
  toDate() {
    return this.date;
  }
}

/** What a read gives back: every Date stored as a Timestamp. */
function asStored(data: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data).map(([key, value]) => [
      key,
      value instanceof Date ? new FakeTimestamp(value) : value,
    ]),
  );
}

const created = new Date('2026-10-01T10:00:00Z');
const updated = new Date('2026-10-02T10:00:00Z');

const team: Team = {
  id: 'team-1',
  tenantId: 'esn-berlin',
  eventId: 'welcome-week',
  accessCode: 'ABCD2345',
  teamName: 'Spree Squad',
  memberCount: 2,
  score: 40,
  completedTaskIds: ['task-1'],
  isActive: true,
  createdAt: created,
  updatedAt: updated,
};

const task: Task = {
  id: 'task-1',
  tenantId: 'esn-berlin',
  eventId: 'welcome-week',
  title: 'Brandenburg Gate',
  description: 'Take a team photo at the gate',
  type: 'PHOTO',
  points: 20,
  coordinates: { lat: 52.5163, lng: 13.3777 },
  radius: 50,
  requiresPhoto: true,
  requiresVideo: false,
  requiresText: false,
  unlockAt: new Date('2026-10-03T09:00:00Z'),
  isActive: true,
  createdAt: created,
  updatedAt: updated,
};

const submission: TaskSubmission = {
  id: 'team-1_task-1',
  tenantId: 'esn-berlin',
  eventId: 'welcome-week',
  taskId: 'task-1',
  teamId: 'team-1',
  submittedBy: 'uid-1',
  photoUrls: ['submissions/esn-berlin/welcome-week/team-1/task-1'],
  status: 'approved',
  pointsAwarded: 20,
  submittedAt: new Date('2026-10-03T10:00:00Z'),
  createdAt: created,
  updatedAt: updated,
};

const member: Member = {
  id: 'uid-1',
  tenantId: 'esn-berlin',
  teamId: 'team-1',
  displayName: 'Ada',
  consentVersion: '2026-10',
  consentAt: new Date('2026-10-03T08:59:00Z'),
  joinedAt: new Date('2026-10-03T09:00:00Z'),
  createdAt: created,
  updatedAt: updated,
};

describe('Firestore converters', () => {
  it.each([
    ['Team', teamConverter, team],
    ['Task', taskConverter, task],
    ['Submission', submissionConverter, submission],
    ['Member', memberConverter, member],
  ] as const)('round-trips a %s with Timestamps turned back into Dates', (_name, converter, model) => {
    const { id, ...stored } = model;
    const written = converter.toFirestore(model as never);

    expect(written).toEqual(stored);
    expect(written).not.toHaveProperty('id');
    expect(converter.fromFirestore(id, asStored(written))).toEqual(model);
  });

  it('leaves out undefined optional fields when writing', () => {
    const written = taskConverter.toFirestore({ ...task, imageUrl: undefined, expiresAt: undefined });

    expect(written).not.toHaveProperty('imageUrl');
    expect(written).not.toHaveProperty('expiresAt');
  });

  it('reads documents with missing optional fields', () => {
    const { id, teamName: _teamName, ...rest } = team;
    const read = teamConverter.fromFirestore(id, asStored(rest));

    expect(read.teamName).toBeUndefined();
    expect(read.createdAt).toEqual(created);
  });

  it('defaults team game state that older documents lack', () => {
    const read = teamConverter.fromFirestore('team-2', {
      tenantId: 'esn-berlin',
      eventId: 'welcome-week',
      accessCode: 'WXYZ6789',
      isActive: true,
      createdAt: new FakeTimestamp(created),
      updatedAt: new FakeTimestamp(updated),
    });

    expect(read).toMatchObject({ id: 'team-2', score: 0, completedTaskIds: [], memberCount: 0 });
  });
});
