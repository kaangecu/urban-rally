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
