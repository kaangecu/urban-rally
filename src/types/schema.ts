// Core Type Definitions for Spree Break Quest
// All Firestore entities follow strict multi-tenant patterns

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
  
  // Subscription (for SaaS billing)
  subscriptionTier?: 'free' | 'basic' | 'premium';
  subscriptionExpiresAt?: Date;
}

/**
 * Event
 * A specific scavenger hunt instance (e.g., "Welcome Week 2025")
 */
export interface Event extends MultiTenantEntity {
  id: string;
  name: string; // "Welcome Week 2025"
  description?: string;
  
  // Access Code (NEW - for easy event joining)
  eventCode?: string; // Unique 6-12 char code (e.g., "BERLIN2025", "RALLY2025")
  
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
 * User
 * Individual user/player entity with persistent identity
 * 
 * Multi-Event Support:
 * - User can participate in multiple events across different tenants
 * - Multi-event participation is tracked via TeamMember records (not User.tenantId)
 * - User.tenantId represents "home tenant" (first tenant joined)
 * 
 * @version 2.0 - Added accountType, recovery codes, and multi-event support
 */
export interface User extends MultiTenantEntity {
  id: string; // Firebase Auth UID
  
  // Profile
  displayName: string; // Required: User's name
  email?: string; // Optional: For notifications
  profilePhotoUrl?: string; // Optional: Avatar
  
  // Account Management (NEW in v2.0)
  accountType?: 'anonymous' | 'linked'; // Account type (default: 'anonymous')
  linkedAccountId?: string; // UID of linked email/password account (if accountType='linked')
  
  // Recovery Mechanism (NEW in v2.0)
  recoveryCode?: string; // 6-digit alphanumeric code for account recovery
  recoveryCodeExpiresAt?: Date; // Expiration timestamp (30 days from generation)
  recoveryCodeGeneratedAt?: Date; // When the code was created
  
  // GDPR Consent Tracking (Required for German compliance)
  consentGiven: {
    terms: boolean; // Accepted Terms of Service
    privacy: boolean; // Accepted Privacy Policy
    termsVersion: string; // Version accepted (e.g., "1.0")
    privacyVersion: string; // Version accepted
    termsAcceptedAt: Date; // Timestamp for legal compliance
    privacyAcceptedAt: Date; // Timestamp for legal compliance
    ipAddress?: string; // IP address when consent given (GDPR requirement)
  };
  
  // Statistics (aggregated across all teams/events)
  totalScore: number; // Total points earned across all teams
  totalSubmissions: number; // Total tasks submitted
  eventsParticipated: number; // Number of events joined
  
  // Timestamps
  lastLoginAt?: Date;
}

/**
 * Team
 * The player entity - a group of students playing together
 * NOW SUPPORTS MULTIPLE USERS PER TEAM
 */
export interface Team extends MultiTenantEntity {
  id: string;
  eventId: string; // Reference to parent event
  
  // Authentication
  accessCode: string; // Unique code, e.g., "BER-42"
  
  // DEPRECATED FIELDS (kept for backward compatibility during migration)
  uid?: string; // OLD: Single Firebase Auth UID - use ownerUserId instead
  displayName?: string; // OLD: Single user's name - moved to User collection
  email?: string; // OLD: Single user's email - moved to User collection
  profilePhotoUrl?: string; // OLD: Avatar - moved to User collection
  consentGiven?: {
    terms: boolean;
    privacy: boolean;
    termsVersion: string;
    privacyVersion: string;
    termsAcceptedAt?: Date;
    privacyAcceptedAt?: Date;
    ipAddress?: string;
  }; // OLD: Consent - moved to User collection
  
  // Team Membership (NEW - Multi-User Support)
  ownerUserId: string; // User ID of team creator/owner
  memberUserIds: string[]; // Array of all member User IDs
  maxMembers: number; // Team size limit (default: 50, can be event-specific)
  
  // Team Info
  teamName?: string; // Optional custom name
  teamDisplayName?: string; // Friendly team name for leaderboard
  memberCount?: number; // Cached count for performance (should match memberUserIds.length)
  
  // Game State
  score: number; // Team total score (sum of all member contributions)
  completedTaskIds: string[]; // Task IDs completed by any team member
  inventory: InventoryItem[]; // Purchased hints, power-ups
  
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
 * TeamMember
 * Detailed tracking of user membership and contributions to a specific team
 */
export interface TeamMember extends MultiTenantEntity {
  id: string; // Composite: "{teamId}-{userId}"
  teamId: string; // Reference to Team
  userId: string; // Reference to User
  eventId: string; // Reference to Event (for scoping)
  
  // Denormalized User Data (for efficient queries)
  displayName?: string; // User's display name (denormalized for search)
  
  // Contribution Tracking
  personalScore: number; // This user's contribution to team score
  submissionIds: string[]; // IDs of submissions made by this user
  tasksCompleted: string[]; // Task IDs this user completed
  
  // Role & Permissions
  role: 'owner' | 'member'; // Owner has special permissions
  
  // Membership Status
  isActive: boolean; // Can be set to false when user leaves team
  joinedAt: Date;
  leftAt?: Date; // Timestamp when user left team
  lastActiveAt?: Date; // NEW: Track when user was last active (for cleanup jobs)
}

/**
 * Inventory Item
 * Items purchased or earned by teams (hints, power-ups)
 */
export interface InventoryItem {
  itemId: string;
  type: 'hint' | 'power-up' | 'unlock';
  purchasedAt: Date;
  used: boolean;
  usedAt?: Date;
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
  bonusPoints?: number; // Extra points for speed or quality
  
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
  
  // Hints (purchasable)
  hints?: TaskHint[];
  
  // Sponsorship
  sponsorId?: string;
  sponsorName?: string;
  sponsorLogoUrl?: string;
  requiresVideoAd?: boolean; // Must watch ad to unlock
  videoAdUrl?: string;
  
  // Timing
  unlockAt?: Date; // When task becomes available
  expiresAt?: Date; // When task is no longer available
  
  // Ordering
  order?: number; // For sequential tasks
  dependsOn?: string[]; // Task IDs that must be completed first
  
  // Status
  isActive: boolean;
}

/**
 * Task Types
 */
export type TaskType = 
  | 'GPS'          // Find a location
  | 'GPS_LOCATION' // Alias for GPS
  | 'PHOTO'        // Take a photo at location
  | 'VIDEO'        // Record a video
  | 'QUIZ'         // Answer questions
  | 'QR_CODE'      // Scan a QR code
  | 'SPONSORED'    // Branded challenge
  | 'CHECKPOINT'   // Must visit in order
  | 'WILDCARD';    // Creative/custom

/**
 * Task Hint
 * Purchasable hints for difficult tasks
 */
export interface TaskHint {
  id: string;
  text: string;
  cost: number; // In points or currency
  revealedCount?: number; // How many teams revealed it
}

/**
 * Task Submission
 * When a team completes a task
 * NOW TRACKS INDIVIDUAL USER WHO SUBMITTED
 */
export interface TaskSubmission extends MultiTenantEntity {
  id: string;
  eventId: string;
  taskId: string;
  teamId: string;
  userId: string; // NEW: User who made this submission
  
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
 * Stripe Payment Session (for micro-transactions)
 * Used by Firebase Stripe Extension
 */
export interface CheckoutSession {
  price: string; // Stripe Price ID
  success_url: string;
  cancel_url: string;
  mode: 'payment' | 'subscription';
  metadata?: {
    teamId: string;
    itemId: string;
    itemType: string;
  };
}

/**
 * User Profile (Admin/Organizer)
 * For event creators and moderators
 */
export interface UserProfile extends MultiTenantEntity {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  
  // Permissions
  role: 'admin' | 'organizer' | 'moderator';
  managedTenantIds: string[]; // Tenants they can manage
  
  // Status
  isActive: boolean;
}

/**
 * Geolocation
 * Standard location type
 */
export interface GeoLocation {
  lat: number;
  lng: number;
}

/**
 * Theme Configuration
 * Dynamic CSS variables for tenant branding
 */
export interface ThemeConfig {
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
}
