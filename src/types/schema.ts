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
  
  // Team Info
  teamName?: string; // Optional custom name
  memberCount?: number;
  
  // Game State
  score: number;
  completedTaskIds: string[]; // Task IDs they've completed
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
  
  // Hints (purchasable)
  hints?: TaskHint[];
  
  // Sponsorship
  sponsorId?: string;
  sponsorLogoUrl?: string;
  requiresVideoAd?: boolean; // Must watch ad to unlock
  videoAdUrl?: string;
  
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
  | 'PHOTO'        // Take a photo at location
  | 'VIDEO'        // Record a video
  | 'QUIZ'         // Answer questions
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
 */
export interface TaskSubmission extends MultiTenantEntity {
  id: string;
  eventId: string;
  taskId: string;
  teamId: string;
  
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
