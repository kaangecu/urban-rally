/**
 * Label and icon for each task type, shared by the list, detail and submission screens.
 */

import { Camera, CircleHelp, Flag, MapPin, QrCode, Sparkles, Star, Video, type LucideIcon } from 'lucide-react';
import type { TaskType } from '../types/schema';

export interface TaskTypeInfo {
  label: string;
  Icon: LucideIcon;
}

const TYPES: Record<TaskType, TaskTypeInfo> = {
  GPS: { label: 'Check-in', Icon: MapPin },
  GPS_LOCATION: { label: 'Check-in', Icon: MapPin },
  PHOTO: { label: 'Photo', Icon: Camera },
  VIDEO: { label: 'Video', Icon: Video },
  QUIZ: { label: 'Quiz', Icon: CircleHelp },
  QR_CODE: { label: 'QR code', Icon: QrCode },
  SPONSORED: { label: 'Sponsored', Icon: Star },
  CHECKPOINT: { label: 'Checkpoint', Icon: Flag },
  WILDCARD: { label: 'Wildcard', Icon: Sparkles },
};

export function getTaskTypeInfo(type: TaskType): TaskTypeInfo {
  return TYPES[type] ?? { label: 'Task', Icon: Sparkles };
}

/** The detail screen's one primary action, named after what the player does. */
export function getTaskAction(type: TaskType): string {
  switch (type) {
    case 'PHOTO':
      return 'Take photo';
    case 'VIDEO':
      return 'Record video';
    case 'QUIZ':
      return 'Answer quiz';
    case 'GPS':
    case 'GPS_LOCATION':
      return 'Check in';
    default:
      return 'Start task';
  }
}
