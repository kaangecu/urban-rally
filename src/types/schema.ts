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
  
  // Role Management (NEW)
  primaryAdminId?: string; // Main admin User ID
  adminCount?: number; // Cached count for "last admin" check
  
  // Features (NEW)
  features?: {
    maxEvents?: number;
    maxTeamsPerEvent?: number;
    maxVolunteers?: number;
  };
  
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
 * User - Unified interface for all users in the system
 * 
 * Represents both players and administrators. All users can participate in
 * events (play the game), while users with admin roles have additional
 * permissions to manage tenants and events.
 * 
 * ROLE HIERARCHY:
 * - player: Can join teams and submit tasks
 * - moderator: Can moderate submissions
 * - organizer: Can create/manage events for assigned tenants
 * - admin: Can manage users and tenants
 * - superadmin: Full system access
 * 
 * AUTHENTICATION:
 * - Role is stored in Firebase Custom Claims (authoritative)
 * - Role is mirrored in Firestore for queries (synced by setUserRole function)
 * - Custom Claims checked by security rules and route guards
 * 
 * ADMIN GAMEPLAY:
 * - Admins can join teams and play like regular players
 * - Player stats (totalScore, eventsParticipated) accumulate normally
 * - managedTenantIds and isActive fields only relevant for admin permissions
 * 
 * MULTI-EVENT SUPPORT:
 * - User can participate in multiple events across different tenants
 * - Multi-event participation is tracked via TeamMember records (not User.tenantId)
 * - User.tenantId represents "home tenant" (first tenant joined)
 * 
 * @version 3.0 - Unified User and UserProfile into single type
 * @see functions/src/index.ts setUserRole - Sets role via Custom Claims
 * @see firestore.rules - Security rules enforce role-based access
 */
export interface User extends MultiTenantEntity {
  id: string; // Firebase Auth UID
  
  // Profile (required)
  displayName: string; // User's display name
  email: string; // Email address (required for all users)
  photoURL?: string; // Avatar URL (standardized from profilePhotoUrl)
  
  // Account Type & Role
  accountType: 'anonymous' | 'linked'; // How they authenticated
  role: 'player' | 'moderator' | 'organizer' | 'admin' | 'superadmin'; // Permission level
  
  // Admin-Specific Fields (optional, only set for admin roles)
  /** @deprecated Use tenantRoles instead - kept for backward compatibility */
  managedTenantIds?: string[]; // OLD: Tenants they can manage - use tenantRoles instead
  isActive?: boolean; // Admin account status (undefined for players)
  
  // NEW: Hybrid Expanded User Schema - Multi-Tenant Role Management
  tenantRoles?: {
    [tenantId: string]: TenantRoleAssignment;
  };
  
  pendingInvitations?: {
    [token: string]: PendingInvitation;
  };
  
  highestRole?: 'superadmin' | 'admin' | 'organizer' | 'moderator' | 'player'; // Cached for quick checks
  isSuperadmin?: boolean; // Global superadmin flag
  
  // Recovery Mechanism
  recoveryCode?: string; // 6-digit alphanumeric code for account recovery
  recoveryCodeExpiresAt?: Date; // Expiration timestamp (30 days from generation)
  
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
  
  // Player Statistics (all users have these - admins can play!)
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
  requiresGPS?: boolean; // Photo/Video tasks can require GPS
  
  // Requirements (optional, defaults to false)
  requiresPhoto?: boolean;
  requiresVideo?: boolean;
  requiresText?: boolean;
  
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

/**
 * ==============================================================================
 * ROLE MANAGEMENT SYSTEM - Hybrid Expanded User Schema
 * ==============================================================================
 * Added: December 30, 2025
 * Architecture: Scoped RBAC with multi-tenant support
 * 
 * Key Design Decisions:
 * - Roles stored directly in User document (no join table)
 * - Single role per tenant with inheritance
 * - Magic link invitation system
 * - Role expiration support
 * - Audit log for all changes
 */

/**
 * Tenant Role Assignment
 * Per-tenant role data stored in User.tenantRoles[tenantId]
 */
export interface TenantRoleAssignment {
  role: 'admin' | 'organizer' | 'moderator';
  grantedBy: string; // User ID who assigned this role
  grantedAt: Date;
  expiresAt: Date | null; // null = never expires
  isActive: boolean;
  notes?: string; // Optional reason for assignment
  revokedBy?: string; // User ID who revoked (if revoked)
  revokedAt?: Date;
  revokeReason?: string;
}

/**
 * Pending Invitation
 * Stored in User.pendingInvitations[token] until accepted
 */
export interface PendingInvitation {
  tenantId: string;
  tenantName: string;
  role: 'admin' | 'organizer' | 'moderator';
  invitedBy: string; // User ID of inviter
  invitedByName: string; // Display name of inviter
  invitedAt: Date;
  expiresAt: Date; // Invitation expires after 7 days
  roleExpiresAt: Date | null; // When the role itself expires (null = never)
  status: 'pending' | 'accepted' | 'declined' | 'expired';
}

/**
 * Role Assignment Audit Log
 * Tracks all role changes for compliance and debugging
 */
export interface RoleAssignment extends MultiTenantEntity {
  id: string;
  
  // Who
  assignerId: string; // Who made the change
  assignerEmail: string;
  targetUserId: string; // Who was affected
  targetUserEmail: string;
  
  // What
  action: 'grant' | 'revoke' | 'modify' | 'invite_sent' | 'invite_accepted';
  roleBefore: string | null;
  roleAfter: string | null;
  
  // When & Why
  timestamp: Date;
  reason?: string; // Optional explanation
  
  // Context
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Role Hierarchy Configuration
 * Defines permission levels and inheritance
 */
export const ROLE_HIERARCHY = {
  superadmin: { 
    level: 4, 
    inherits: ['admin', 'organizer', 'moderator', 'player'] as const,
    label: 'Superadmin',
    description: 'Full system access across all tenants'
  },
  admin: { 
    level: 3, 
    inherits: ['organizer', 'moderator', 'player'] as const,
    label: 'Admin',
    description: 'Manage users and tenant settings'
  },
  organizer: { 
    level: 2, 
    inherits: ['moderator', 'player'] as const,
    label: 'Organizer',
    description: 'Create and manage events and tasks'
  },
  moderator: { 
    level: 1, 
    inherits: ['player'] as const,
    label: 'Moderator',
    description: 'Review and approve submissions'
  },
  player: { 
    level: 0, 
    inherits: [] as const,
    label: 'Player',
    description: 'Join teams and complete tasks'
  },
} as const;

/**
 * Role Type
 */
export type Role = keyof typeof ROLE_HIERARCHY;

/**
 * Helper: Check if user has minimum role level
 */
export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole].level >= ROLE_HIERARCHY[requiredRole].level;
}

/**
 * Helper: Get highest role from tenantRoles map
 */
export function calculateHighestRole(
  tenantRoles: Record<string, TenantRoleAssignment> | undefined,
  isSuperadmin: boolean = false
): Role {
  if (isSuperadmin) return 'superadmin';
  
  if (!tenantRoles || Object.keys(tenantRoles).length === 0) {
    return 'player';
  }
  
  let highestLevel = 0;
  let highestRole: Role = 'player';
  
  for (const tenantId in tenantRoles) {
    const assignment = tenantRoles[tenantId];
    if (assignment.isActive && (!assignment.expiresAt || new Date(assignment.expiresAt) > new Date())) {
      const roleLevel = ROLE_HIERARCHY[assignment.role].level;
      if (roleLevel > highestLevel) {
        highestLevel = roleLevel;
        highestRole = assignment.role;
      }
    }
  }
  
  return highestRole;
}
