// Firestore types shared by the app, functions/ and the seed script.
// The model is described in docs/specs/data-model.md.

/**
 * Base interface for all multi-tenant entities
 * Every document MUST include tenantId for data isolation
 */
export interface MultiTenantEntity {
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Tenant Configuration
 * Represents an organization (e.g., "ESN Berlin")
 */
export interface Tenant extends MultiTenantEntity {
  id: string;
  name: string; // "ESN Berlin"
  slug: string; // "esn-berlin" (URL-friendly)
  logoUrl?: string;
  
  // Branding
  primaryColor: string; // Hex color, e.g., "#1a56db"
  secondaryColor?: string;
  accentColor?: string;
  
  // Contact
  contactEmail?: string;
  website?: string;
  
  // Status
  isActive: boolean;

}

/**
 * Event
 * A specific scavenger hunt instance (e.g., "Welcome Week 2025")
 */
export interface Event extends MultiTenantEntity {
  id: string;
  name: string; // "Welcome Week 2025"
  description?: string;
  
  // Timing
  startDate: Date;
  endDate: Date;
  
  // Game Settings
  isActive: boolean;
  maxTeams?: number;
  
  // Map Configuration
  mapCenter: {
    lat: number;
    lng: number;
  };
  mapZoom: number;
  mapBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

/**
 * Team
 * The player entity - a group of students playing together
 */
export interface Team extends MultiTenantEntity {
  id: string;
  eventId: string; // Reference to parent event
  
  // Authentication
  accessCode: string; // Unique code, e.g., "BER-42"
  uid?: string; // Firebase Auth UID (linked after first login)
  
  // User Profile (GDPR-compliant)
  displayName?: string; // User's personal name/nickname
  email?: string; // Optional email for notifications
  profilePhotoUrl?: string; // Optional avatar
  
  // GDPR Consent Tracking (Required for German compliance)
  consentGiven?: {
    terms: boolean; // Accepted Terms of Service
    privacy: boolean; // Accepted Privacy Policy
    termsVersion: string; // Version accepted (e.g., "1.0")
    privacyVersion: string; // Version accepted
    termsAcceptedAt?: Date; // Timestamp for legal compliance
    privacyAcceptedAt?: Date; // Timestamp for legal compliance
    ipAddress?: string; // IP address when consent given (GDPR requirement)
  };
  
  // Team Info
  teamName?: string; // Optional custom name
  teamDisplayName?: string; // Friendly team name for leaderboard
  memberCount: number; // Kept up to date by joinTeam
  
  // Game State
  score: number;
  completedTaskIds: string[]; // Task IDs they've completed
  
  // Location Tracking (optional, for live leaderboard)
  lastKnownPosition?: {
    lat: number;
    lng: number;
    timestamp: Date;
  };
  
  // Status
  isActive: boolean;
}

/**
 * Task (Challenge)
 * The game challenges that teams must complete
 */
export interface Task extends MultiTenantEntity {
  id: string;
  eventId: string;
  
  // Task Info
  title: string;
  description: string;
  type: TaskType;
  imageUrl?: string; // Task image/photo
  difficulty?: 'easy' | 'medium' | 'hard';
  
  // Points
  points: number;
  
  // Location (for GPS tasks)
  coordinates?: {
    lat: number;
    lng: number;
  };
  radius?: number; // Acceptance radius in meters
  
  // Requirements
  requiresPhoto: boolean;
  requiresVideo: boolean;
  requiresText: boolean;
  
  // Quiz Questions (for QUIZ type tasks)
  quizType?: 'text' | 'multiple-choice' | 'number';
  quizOptions?: string[]; // For multiple choice questions
  quizCorrectAnswer?: string | number; // The correct answer
  quizHint?: string; // Optional hint for the quiz
  
  // Timing
  unlockAt?: Date; // When task becomes available
  expiresAt?: Date; // When task is no longer available
  
  // Ordering
  order?: number; // Display order
  
  // Status
  isActive: boolean;
}

/**
 * Task Types
 */
export type TaskType =
  | 'GPS'    // Find a location
  | 'PHOTO'  // Take a photo at location
  | 'VIDEO'  // Record a video
  | 'QUIZ';  // Answer a question

/**
 * Member
 * One player on a team, stored at teams/{teamId}/members/{uid}.
 * The id is the player's Firebase Auth uid.
 */
export interface Member extends MultiTenantEntity {
  id: string;
  teamId: string;
  displayName: string;
  email?: string;
  consentVersion: string; // Terms and privacy version accepted
  consentAt: Date;
  joinedAt: Date;
}

/**
 * Task Submission
 * When a team completes a task
 */
export interface TaskSubmission extends MultiTenantEntity {
  id: string;
  eventId: string;
  taskId: string;
  teamId: string;
  submittedBy?: string; // uid of the member who submitted
  
  // Submission Data
  photoUrls?: string[];
  videoUrl?: string;
  textResponse?: string;
  
  // Location Proof
  submittedLocation?: {
    lat: number;
    lng: number;
    accuracy: number; // GPS accuracy in meters
  };
  
  // Scoring
  status: 'pending' | 'approved' | 'rejected';
  pointsAwarded: number;
  
  // Review (if manual approval needed)
  reviewedBy?: string; // Admin UID
  reviewedAt?: Date;
  reviewNotes?: string;
  
  submittedAt: Date;
}

/**
 * Leaderboard Entry
 * Aggregated team rankings
 */
export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  score: number;
  tasksCompleted: number;
  rank: number;
  lastUpdated: Date;
}

/**
 * Geolocation
 * Standard location type
 */
export interface GeoLocation {
  lat: number;
  lng: number;
}
