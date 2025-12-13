import { describe, it, expect, beforeEach, vi } from 'vitest';
import { canJoinTeam, subscribeToEventTeams } from '../team.service';
import * as firestore from 'firebase/firestore';

// Mock Firebase modules
vi.mock('../firebase.service', () => ({
  getFirebaseFirestore: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual('firebase/firestore');
  return {
    ...actual,
    collection: vi.fn(),
    doc: vi.fn(),
    getDoc: vi.fn(),
    setDoc: vi.fn(),
    updateDoc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn(),
    onSnapshot: vi.fn(),
    serverTimestamp: vi.fn(() => new Date()),
    increment: vi.fn((n) => n),
  };
});

describe('team.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('canJoinTeam', () => {
    it('should return true when team is not full', async () => {
      const mockTeam = {
        id: 'team-123',
        teamName: 'Test Team',
        maxSize: 5,
        memberCount: 3,
        tenantId: 'tenant-123',
        eventId: 'event-123',
        isActive: true,
        createdAt: new Date(),
      };

      const result = await canJoinTeam(mockTeam);
      expect(result).toBe(true);
    });

    it('should return false when team is full', async () => {
      const mockTeam = {
        id: 'team-456',
        teamName: 'Full Team',
        maxSize: 5,
        memberCount: 5,
        tenantId: 'tenant-123',
        eventId: 'event-123',
        isActive: true,
        createdAt: new Date(),
      };

      const result = await canJoinTeam(mockTeam);
      expect(result).toBe(false);
    });

    it('should return false when team is inactive', async () => {
      const mockTeam = {
        id: 'team-789',
        teamName: 'Inactive Team',
        maxSize: 5,
        memberCount: 2,
        tenantId: 'tenant-123',
        eventId: 'event-123',
        isActive: false,
        createdAt: new Date(),
      };

      const result = await canJoinTeam(mockTeam);
      expect(result).toBe(false);
    });

    it('should return true for team with no max size limit', async () => {
      const mockTeam = {
        id: 'team-unlimited',
        teamName: 'Unlimited Team',
        maxSize: undefined,
        memberCount: 100,
        tenantId: 'tenant-123',
        eventId: 'event-123',
        isActive: true,
        createdAt: new Date(),
      };

      const result = await canJoinTeam(mockTeam as any);
      expect(result).toBe(true);
    });
  });

  describe('subscribeToEventTeams', () => {
    it('should set up Firestore subscription with correct query', () => {
      const mockCallback = vi.fn();
      const mockUnsubscribe = vi.fn();
      const mockQueryFn = vi.fn();
      const mockWhereFn = vi.fn();
      const mockOrderByFn = vi.fn();

      vi.spyOn(firestore, 'collection').mockReturnValue({} as any);
      vi.spyOn(firestore, 'query').mockReturnValue(mockQueryFn as any);
      vi.spyOn(firestore, 'where').mockReturnValue(mockWhereFn as any);
      vi.spyOn(firestore, 'onSnapshot').mockReturnValue(mockUnsubscribe);

      const unsubscribe = subscribeToEventTeams('tenant-123', 'event-456', mockCallback);

      // Verify query was created with correct filters
      expect(firestore.collection).toHaveBeenCalled();
      expect(firestore.query).toHaveBeenCalled();
      expect(firestore.where).toHaveBeenCalledWith('tenantId', '==', 'tenant-123');
      expect(firestore.where).toHaveBeenCalledWith('eventId', '==', 'event-456');
      expect(firestore.where).toHaveBeenCalledWith('isActive', '==', true);
      
      // Verify subscription was created
      expect(firestore.onSnapshot).toHaveBeenCalled();
      
      // Verify unsubscribe function is returned
      expect(typeof unsubscribe).toBe('function');
    });

    it('should call callback with teams when snapshot updates', () => {
      const mockTeams = [
        {
          id: 'team-1',
          teamName: 'Team 1',
          memberCount: 2,
          maxSize: 5,
          tenantId: 'tenant-123',
          eventId: 'event-456',
          isActive: true,
          createdAt: new Date(),
        },
        {
          id: 'team-2',
          teamName: 'Team 2',
          memberCount: 4,
          maxSize: 5,
          tenantId: 'tenant-123',
          eventId: 'event-456',
          isActive: true,
          createdAt: new Date(),
        },
      ];

      const mockSnapshot = {
        docs: mockTeams.map((team) => ({
          id: team.id,
          data: () => team,
        })),
      };

      const mockCallback = vi.fn();
      
      let snapshotHandler: any;
      vi.spyOn(firestore, 'onSnapshot').mockImplementation((query, handler) => {
        snapshotHandler = handler;
        return vi.fn();
      });

      subscribeToEventTeams('tenant-123', 'event-456', mockCallback);
      
      // Simulate snapshot update
      if (snapshotHandler) {
        snapshotHandler(mockSnapshot);
      }

      expect(mockCallback).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'team-1', teamName: 'Team 1' }),
          expect.objectContaining({ id: 'team-2', teamName: 'Team 2' }),
        ])
      );
    });
  });
});
