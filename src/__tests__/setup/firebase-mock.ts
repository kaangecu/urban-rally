import { vi } from 'vitest';
import type { Team, Task, Submission } from '../../types/schema';

/**
 * Setup Firebase mocks for testing
 * Call this in beforeEach() of tests that use Firebase
 */
export function setupFirebaseMocks() {
  // Mock Firestore methods
  const mockFirestore = {
    collection: vi.fn().mockReturnThis(),
    doc: vi.fn().mockReturnThis(),
    get: vi.fn(() =>
      Promise.resolve({
        exists: () => true,
        data: () => ({}),
        id: 'mock-id',
      })
    ),
    set: vi.fn(() => Promise.resolve()),
    update: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve()),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    onSnapshot: vi.fn((callback) => {
      callback({ docs: [] });
      return vi.fn(); // Unsubscribe function
    }),
    addDoc: vi.fn(() => Promise.resolve({ id: 'mock-id' })),
    getDocs: vi.fn(() =>
      Promise.resolve({
        docs: [],
        forEach: vi.fn(),
        empty: true,
      })
    ),
  };

  // Mock Storage methods
  const mockStorage = {
    ref: vi.fn().mockReturnThis(),
    put: vi.fn(() =>
      Promise.resolve({
        ref: {
          getDownloadURL: () => Promise.resolve('https://example.com/file.jpg'),
        },
      })
    ),
    getDownloadURL: vi.fn(() =>
      Promise.resolve('https://example.com/file.jpg')
    ),
    delete: vi.fn(() => Promise.resolve()),
  };

  return { mockFirestore, mockStorage };
}

/**
 * Reset all Firebase mocks
 * Call this in afterEach()
 */
export function resetFirebaseMocks() {
  vi.clearAllMocks();
}

// ============================================================================
// MOCK DATA - Reusable test data
// ============================================================================

export const mockTeamData: Team = {
  id: 'team-123',
  name: 'Test Team Alpha',
  code: 'TEST001',
  tenantId: 'tenant-1',
  eventId: 'event-1',
  points: 100,
  tasksCompleted: 5,
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-02'),
};

export const mockTaskQuiz: Task = {
  id: 'task-quiz-123',
  type: 'QUIZ',
  title: 'Geography Quiz',
  description: 'What is the capital of Germany?',
  points: 100,
  eventId: 'event-1',
  tenantId: 'tenant-1',
  quizType: 'text',
  quizCorrectAnswer: 'Berlin',
  quizHint: 'It starts with B',
  requiredLocation: {
    lat: 52.52,
    lng: 13.405,
    radius: 100,
  },
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-02'),
};

export const mockTaskPhoto: Task = {
  id: 'task-photo-123',
  type: 'PHOTO',
  title: 'Photo Challenge',
  description: 'Take a photo of the Brandenburg Gate',
  points: 50,
  eventId: 'event-1',
  tenantId: 'tenant-1',
  requiredLocation: {
    lat: 52.5163,
    lng: 13.3777,
    radius: 50,
  },
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-02'),
};

export const mockTaskVideo: Task = {
  id: 'task-video-123',
  type: 'VIDEO',
  title: 'Video Challenge',
  description: 'Record a 10-second video at the TV Tower',
  points: 75,
  eventId: 'event-1',
  tenantId: 'tenant-1',
  requiredLocation: {
    lat: 52.5208,
    lng: 13.4094,
    radius: 50,
  },
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-02'),
};

export const mockTaskGPS: Task = {
  id: 'task-gps-123',
  type: 'GPS',
  title: 'GPS Challenge',
  description: 'Find the secret location',
  points: 60,
  eventId: 'event-1',
  tenantId: 'tenant-1',
  requiredLocation: {
    lat: 52.5200,
    lng: 13.4050,
    radius: 25,
  },
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-02'),
};

export const mockSubmissionQuiz: Submission = {
  id: 'submission-123',
  taskId: 'task-quiz-123',
  teamId: 'team-123',
  tenantId: 'tenant-1',
  eventId: 'event-1',
  type: 'text',
  textResponse: 'Berlin',
  points: 100,
  submittedLocation: {
    lat: 52.52,
    lng: 13.405,
    accuracy: 10,
  },
  timestamp: new Date('2025-01-02T10:00:00'),
};

export const mockSubmissionPhoto: Submission = {
  id: 'submission-456',
  taskId: 'task-photo-123',
  teamId: 'team-123',
  tenantId: 'tenant-1',
  eventId: 'event-1',
  type: 'photo',
  imageUrl: 'https://example.com/photo.jpg',
  points: 50,
  submittedLocation: {
    lat: 52.5163,
    lng: 13.3777,
    accuracy: 15,
  },
  timestamp: new Date('2025-01-02T11:00:00'),
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a mock geolocation position
 */
export function createMockPosition(lat: number, lng: number): GeolocationPosition {
  return {
    coords: {
      latitude: lat,
      longitude: lng,
      accuracy: 10,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
    },
    timestamp: Date.now(),
  };
}

/**
 * Create a mock file/blob for image/video testing
 */
export function createMockFile(
  name: string = 'test.jpg',
  type: string = 'image/jpeg',
  size: number = 1024
): File {
  const blob = new Blob(['a'.repeat(size)], { type });
  return new File([blob], name, { type });
}

/**
 * Wait for a promise to resolve (useful for async testing)
 */
export function waitForPromise(ms: number = 0): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Mock localStorage
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
}
