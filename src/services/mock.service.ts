/**
 * Mock Service for Development
 * Simulates Firebase operations when offline or during UI development
 * This allows you to build the UI without connecting to Firebase
 */

import type { 
  Tenant, 
  Event, 
  Team, 
  Task, 
  TaskSubmission, 
  LeaderboardEntry,
  TaskType 
} from '../types/schema';

// Mock Data
const MOCK_TENANT: Tenant = {
  id: 'esn-berlin',
  tenantId: 'esn-berlin',
  name: 'ESN Berlin',
  slug: 'esn-berlin',
  logoUrl: 'https://placehold.co/200x200/1a56db/white?text=ESN',
  primaryColor: '#1a56db',
  secondaryColor: '#7e3af2',
  accentColor: '#f59e0b',
  contactEmail: 'berlin@esn.org',
  website: 'https://esn-berlin.de',
  isActive: true,
  subscriptionTier: 'premium',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date(),
};

const MOCK_EVENT: Event = {
  id: 'welcome-week-2025',
  tenantId: 'esn-berlin',
  name: 'Welcome Week 2025',
  description: 'Explore Berlin and complete challenges to win prizes!',
  startDate: new Date('2025-09-01'),
  endDate: new Date('2025-09-07'),
  isActive: true,
  maxTeams: 50,
  mapCenter: { lat: 52.52, lng: 13.405 },
  mapZoom: 13,
  createdAt: new Date('2025-01-15'),
  updatedAt: new Date(),
};

const MOCK_TEAM: Team = {
  id: 'team-42',
  tenantId: 'esn-berlin',
  eventId: 'welcome-week-2025',
  accessCode: 'BER-42',
  uid: 'mock-uid-123',
  teamName: 'The Explorers',
  memberCount: 4,
  score: 150,
  completedTaskIds: ['task-1', 'task-2'],
  inventory: [],
  isActive: true,
  createdAt: new Date('2025-08-25'),
  updatedAt: new Date(),
};

const MOCK_TASKS: Task[] = [
  {
    id: 'task-1',
    tenantId: 'esn-berlin',
    eventId: 'welcome-week-2025',
    title: 'Find Brandenburg Gate',
    description: 'Navigate to the iconic Brandenburg Gate and take a team photo!',
    type: 'GPS' as TaskType,
    points: 50,
    requiresPhoto: true,
    requiresVideo: false,
    requiresText: false,
    coordinates: { lat: 52.5163, lng: 13.3777 },
    radius: 30,
    isActive: true,
    order: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'task-2',
    tenantId: 'esn-berlin',
    eventId: 'welcome-week-2025',
    title: 'Museum Island Challenge',
    description: 'Visit Museum Island and solve the historical riddle.',
    type: 'PHOTO' as TaskType,
    points: 100,
    bonusPoints: 20,
    requiresPhoto: true,
    requiresVideo: false,
    requiresText: true,
    coordinates: { lat: 52.5211, lng: 13.3987 },
    radius: 50,
    hints: [
      { id: 'hint-1', text: 'Look for the oldest building on the island', cost: 10 }
    ],
    isActive: true,
    order: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'task-3',
    tenantId: 'esn-berlin',
    eventId: 'welcome-week-2025',
    title: '🎬 Sponsored: Berlin Street Food',
    description: 'Visit our partner restaurant and try their signature dish!',
    type: 'SPONSORED' as TaskType,
    points: 75,
    requiresPhoto: true,
    requiresVideo: false,
    requiresText: false,
    coordinates: { lat: 52.5070, lng: 13.3294 },
    radius: 25,
    sponsorId: 'currywurst-king',
    sponsorLogoUrl: 'https://placehold.co/100x100/f59e0b/white?text=CW',
    requiresVideoAd: true,
    videoAdUrl: 'https://example.com/ad.mp4',
    isActive: true,
    order: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { teamId: 'team-1', teamName: 'Speed Demons', score: 450, tasksCompleted: 9, rank: 1, lastUpdated: new Date() },
  { teamId: 'team-42', teamName: 'The Explorers', score: 150, tasksCompleted: 2, rank: 2, lastUpdated: new Date() },
  { teamId: 'team-3', teamName: 'City Hunters', score: 120, tasksCompleted: 2, rank: 3, lastUpdated: new Date() },
];

/**
 * Mock Service Class
 */
export class MockService {
  private delay = 500; // Simulate network latency
  
  /**
   * Simulate async delay
   */
  private async wait(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.delay));
  }
  
  /**
   * Get tenant by ID
   */
  async getTenant(tenantId: string): Promise<Tenant | null> {
    await this.wait();
    return tenantId === MOCK_TENANT.id ? MOCK_TENANT : null;
  }
  
  /**
   * Get event by ID
   */
  async getEvent(eventId: string): Promise<Event | null> {
    await this.wait();
    return eventId === MOCK_EVENT.id ? MOCK_EVENT : null;
  }
  
  /**
   * Get team by access code
   */
  async getTeamByAccessCode(accessCode: string): Promise<Team | null> {
    await this.wait();
    return accessCode === MOCK_TEAM.accessCode ? MOCK_TEAM : null;
  }
  
  /**
   * Get team by ID
   */
  async getTeam(teamId: string): Promise<Team | null> {
    await this.wait();
    return teamId === MOCK_TEAM.id ? MOCK_TEAM : null;
  }
  
  /**
   * Get all tasks for an event
   */
  async getTasks(eventId: string, tenantId: string): Promise<Task[]> {
    await this.wait();
    return MOCK_TASKS.filter(task => 
      task.eventId === eventId && task.tenantId === tenantId
    );
  }
  
  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<Task | null> {
    await this.wait();
    return MOCK_TASKS.find(task => task.id === taskId) || null;
  }
  
  /**
   * Submit task completion
   */
  async submitTask(submission: Partial<TaskSubmission>): Promise<TaskSubmission> {
    await this.wait();
    const fullSubmission: TaskSubmission = {
      id: `submission-${Date.now()}`,
      tenantId: MOCK_TENANT.id,
      eventId: MOCK_EVENT.id,
      taskId: submission.taskId!,
      teamId: submission.teamId!,
      photoUrls: submission.photoUrls,
      videoUrl: submission.videoUrl,
      textResponse: submission.textResponse,
      submittedLocation: submission.submittedLocation,
      status: 'approved',
      pointsAwarded: 50,
      submittedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    return fullSubmission;
  }
  
  /**
   * Get leaderboard
   */
  async getLeaderboard(_eventId: string): Promise<LeaderboardEntry[]> {
    await this.wait();
    return MOCK_LEADERBOARD;
  }
  
  /**
   * Update team score
   */
  async updateTeamScore(teamId: string, points: number): Promise<void> {
    await this.wait();
    console.log(`Mock: Updated team ${teamId} score by ${points} points`);
  }
  
  /**
   * Upload photo
   */
  async uploadPhoto(file: File, teamId: string): Promise<string> {
    await this.wait();
    // Return a mock URL (in reality, this would upload to Firebase Storage)
    return `https://storage.example.com/${teamId}/${file.name}`;
  }
}

// Export singleton instance
export const mockService = new MockService();
