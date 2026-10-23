import { describe, expect, it } from 'vitest';
import { Camera, CircleHelp, Flag, MapPin, QrCode, Sparkles, Star, Video } from 'lucide-react';
import { getTaskTypeInfo } from './taskTypes';
import type { TaskType } from '../types/schema';

describe('getTaskTypeInfo', () => {
  it('calls GPS tasks "Check-in" with a pin icon', () => {
    expect(getTaskTypeInfo('GPS')).toEqual({ label: 'Check-in', Icon: MapPin });
    expect(getTaskTypeInfo('GPS_LOCATION')).toEqual({ label: 'Check-in', Icon: MapPin });
  });

  it('maps every task type to a label and an icon', () => {
    expect(getTaskTypeInfo('PHOTO')).toEqual({ label: 'Photo', Icon: Camera });
    expect(getTaskTypeInfo('VIDEO')).toEqual({ label: 'Video', Icon: Video });
    expect(getTaskTypeInfo('QUIZ')).toEqual({ label: 'Quiz', Icon: CircleHelp });
    expect(getTaskTypeInfo('QR_CODE')).toEqual({ label: 'QR code', Icon: QrCode });
    expect(getTaskTypeInfo('SPONSORED')).toEqual({ label: 'Sponsored', Icon: Star });
    expect(getTaskTypeInfo('CHECKPOINT')).toEqual({ label: 'Checkpoint', Icon: Flag });
    expect(getTaskTypeInfo('WILDCARD')).toEqual({ label: 'Wildcard', Icon: Sparkles });
  });

  it('falls back to a generic task for unknown types', () => {
    expect(getTaskTypeInfo('SOMETHING_NEW' as TaskType)).toEqual({ label: 'Task', Icon: Sparkles });
  });
});
