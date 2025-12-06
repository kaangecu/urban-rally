/**
 * Enhanced Type Definitions with Discriminated Unions
 * Implements type-safe task types to eliminate sparse documents
 * and provide better compile-time validation
 */

import { GeoPoint, Timestamp } from 'firebase/firestore';

/**
 * Base interface for all multi-tenant entities
 */
export interface MultiTenantEntity {
  tenantId: string;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

/**
 * Task Statistics (Denormalized for Performance)
 * Updated via Cloud Functions
 */
export interface TaskStats {
  totalSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
  successRate: number; // 0-100
  averageTimeToComplete: number; // Seconds
  uniqueTeamsAttempted: number;
  uniqueTeamsCompleted: number;
  lastCompletedAt?: Timestamp | Date;
  fastestCompletion?: number; // Seconds
  slowestCompletion?: number; // Seconds
}

/**
 * Base Task Interface
 * Common fields shared by all task types
 */
export interface BaseTask extends MultiTenantEntity {
  id: string;
  eventId: string;
  
  // Core Info
  title: string;
  description: string;
  imageUrl?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  
  // Points
  points: number;
  bonusPoints?: number;
  
  // Ordering & Dependencies
  order?: number;
  dependsOn?: string[]; // Task IDs that must be completed first
  
  // Timing
  unlockAt?: Timestamp | Date;
  expiresAt?: Timestamp | Date;
  
  // Status
  isActive: boolean;
  
  // Sponsor Info (optional for all types)
  sponsorId?: string;
  sponsorName?: string;
  sponsorLogoUrl?: string;
  
  // Performance Stats (denormalized)
  stats?: TaskStats;
}

/**
 * GPS Location Task
 * Requires team to reach a specific location
 */
export interface GPSTask extends BaseTask {
  type: 'GPS' | 'GPS_LOCATION';
  coordinates: GeoPoint; // REQUIRED for GPS tasks
  geohash: string; // For efficient radius queries
  radius: number; // Acceptance radius in meters
  locationName?: string; // "Brandenburg Gate"
  locationHint?: string; // "Near the famous landmark"
  requiresPhoto?: boolean; // Optional photo proof
}

/**
 * Photo Challenge Task
 * Requires team to take a photo
 */
export interface PhotoTask extends BaseTask {
  type: 'PHOTO';
  photoPrompt: string; // "Take a selfie with..."
  photoExamples?: string[]; // Example photo URLs
  
  // Optional location requirement
  coordinates?: GeoPoint;
  geohash?: string;
  radius?: number;
  requiresGPS?: boolean;
  
  // Photo constraints
  minPhotos?: number; // Default 1
  maxPhotos?: number; // Default 1
}

/**
 * Video Challenge Task
 * Requires team to record a video
 */
export interface VideoTask extends BaseTask {
  type: 'VIDEO';
  videoPrompt: string; // "Record your team dancing..."
  
  // Optional location requirement
  coordinates?: GeoPoint;
  geohash?: string;
  radius?: number;
  requiresGPS?: boolean;
  
  // Video constraints
  minDuration?: number; // Seconds
  maxDuration?: number; // Seconds (e.g., 30s)
}

/**
 * Quiz/Trivia Task
 * Requires team to answer questions
 */
export interface QuizTask extends BaseTask {
  type: 'QUIZ';
  quiz: {
    questionType: 'multiple-choice' | 'text' | 'number' | 'true-false';
    question: string;
    options?: string[]; // For multiple-choice
    correctAnswer: string | number | boolean;
    hint?: string;
    explanation?: string; // Shown after submission
    timeLimit?: number; // Seconds (0 = no limit)
    allowPartialCredit?: boolean;
    partialCreditPercent?: number; // Default 50
    caseSensitive?: boolean; // For text answers
  };
}

/**
 * QR Code Scan Task
 * Requires team to scan a QR code
 */
export interface QRCodeTask extends BaseTask {
  type: 'QR_CODE';
  qrCodeId: string; // Expected QR code content
  validationPattern?: string; // Regex for QR content
  
  // Optional location (where QR code is)
  coordinates?: GeoPoint;
  geohash?: string;
  radius?: number;
}

/**
 * Checkpoint Task (Sequential)
 * Must be completed in order
 */
export interface CheckpointTask extends BaseTask {
  type: 'CHECKPOINT';
  checkpointNumber: number; // Sequential order
  coordinates: GeoPoint; // REQUIRED
  geohash: string;
  radius: number;
  requiresPhoto?: boolean;
  requiresCheckin?: boolean; // Just GPS proof
}

/**
 * Sponsored/Branded Task
 * Task with sponsor integration
 */
export interface SponsoredTask extends BaseTask {
  type: 'SPONSORED';
  sponsorId: string; // REQUIRED for sponsored tasks
  taskSubtype: 'GPS' | 'PHOTO' | 'VIDEO' | 'QUIZ';
  requiresVideoAd: boolean;
  videoAdUrl?: string;
  adDuration?: number; // Seconds
  sponsorCallToAction?: string; // "Visit our store!"
  sponsorWebsite?: string;
  
  // The actual task to complete (after watching ad)
  taskDetails: GPSTask | PhotoTask | VideoTask | QuizTask;
}

/**
 * Wildcard/Creative Task
 * Custom task with flexible requirements
 */
export interface WildcardTask extends BaseTask {
  type: 'WILDCARD';
  customInstructions: string;
  acceptanceCriteria: string[];
  requiresPhoto?: boolean;
  requiresVideo?: boolean;
  requiresText?: boolean;
  judgedManually: boolean; // Needs admin approval
}

/**
 * Union Type for All Task Types
 * Enables TypeScript discriminated unions
 */
export type Task = 
  | GPSTask 
  | PhotoTask 
  | VideoTask 
  | QuizTask 
  | QRCodeTask 
  | CheckpointTask 
  | SponsoredTask 
  | WildcardTask;

/**
 * Type Guards for Runtime Type Checking
 */
export function isGPSTask(task: Task): task is GPSTask {
  return task.type === 'GPS' || task.type === 'GPS_LOCATION';
}

export function isPhotoTask(task: Task): task is PhotoTask {
  return task.type === 'PHOTO';
}

export function isVideoTask(task: Task): task is VideoTask {
  return task.type === 'VIDEO';
}

export function isQuizTask(task: Task): task is QuizTask {
  return task.type === 'QUIZ';
}

export function isQRCodeTask(task: Task): task is QRCodeTask {
  return task.type === 'QR_CODE';
}

export function isCheckpointTask(task: Task): task is CheckpointTask {
  return task.type === 'CHECKPOINT';
}

export function isSponsoredTask(task: Task): task is SponsoredTask {
  return task.type === 'SPONSORED';
}

export function isWildcardTask(task: Task): task is WildcardTask {
  return task.type === 'WILDCARD';
}

/**
 * Helper to get required submission types for a task
 */
export function getRequiredSubmissionTypes(task: Task): {
  requiresPhoto: boolean;
  requiresVideo: boolean;
  requiresText: boolean;
  requiresGPS: boolean;
} {
  switch (task.type) {
    case 'GPS':
    case 'GPS_LOCATION':
      return {
        requiresPhoto: task.requiresPhoto || false,
        requiresVideo: false,
        requiresText: false,
        requiresGPS: true,
      };
    
    case 'PHOTO':
      return {
        requiresPhoto: true,
        requiresVideo: false,
        requiresText: false,
        requiresGPS: task.requiresGPS || false,
      };
    
    case 'VIDEO':
      return {
        requiresPhoto: false,
        requiresVideo: true,
        requiresText: false,
        requiresGPS: task.requiresGPS || false,
      };
    
    case 'QUIZ':
      return {
        requiresPhoto: false,
        requiresVideo: false,
        requiresText: true,
        requiresGPS: false,
      };
    
    case 'QR_CODE':
      return {
        requiresPhoto: false,
        requiresVideo: false,
        requiresText: true, // QR code content
        requiresGPS: !!task.coordinates,
      };
    
    case 'CHECKPOINT':
      return {
        requiresPhoto: task.requiresPhoto || false,
        requiresVideo: false,
        requiresText: false,
        requiresGPS: true,
      };
    
    case 'SPONSORED':
      // Delegate to nested task
      return getRequiredSubmissionTypes(task.taskDetails);
    
    case 'WILDCARD':
      return {
        requiresPhoto: task.requiresPhoto || false,
        requiresVideo: task.requiresVideo || false,
        requiresText: task.requiresText || false,
        requiresGPS: false,
      };
    
    default:
      return {
        requiresPhoto: false,
        requiresVideo: false,
        requiresText: false,
        requiresGPS: false,
      };
  }
}

/**
 * Task Hint (Subcollection)
 * Path: tasks/{taskId}/hints/{hintId}
 */
export interface TaskHint extends MultiTenantEntity {
  id: string;
  taskId: string;
  eventId: string;
  hintLevel: number; // 1, 2, 3 (progressive hints)
  text: string;
  cost: number; // Points to unlock
  revealedCount: number; // Denormalized count
}

/**
 * Purchased Hint (Subcollection)
 * Path: teams/{teamId}/purchasedHints/{purchaseId}
 */
export interface PurchasedHint extends MultiTenantEntity {
  id: string;
  teamId: string;
  taskId: string;
  hintId: string;
  cost: number;
  purchasedAt: Timestamp | Date;
  revealed: boolean;
}

/**
 * Task Submission (Enhanced)
 */
export interface TaskSubmission extends MultiTenantEntity {
  id: string;
  eventId: string;
  taskId: string;
  teamId: string;
  
  // Task type for validation
  taskType: Task['type'];
  
  // Submission Data
  photoUrls?: string[];
  videoUrl?: string;
  textResponse?: string;
  qrCodeContent?: string;
  
  // Location Proof
  submittedLocation?: {
    coordinates: GeoPoint;
    accuracy: number; // GPS accuracy in meters
    timestamp: Timestamp | Date;
  };
  
  // Validation
  meetsGPSRequirement?: boolean;
  distanceFromTarget?: number; // Meters
  
  // Scoring
  status: 'pending' | 'approved' | 'rejected';
  pointsAwarded: number;
  bonusPointsAwarded?: number;
  
  // Review (if manual approval needed)
  reviewedBy?: string; // Admin UID
  reviewedAt?: Timestamp | Date;
  reviewNotes?: string;
  
  // Metadata
  submittedAt: Timestamp | Date;
  completionTime?: number; // Seconds from task unlock to submission
}
