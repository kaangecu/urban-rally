import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatClock } from '../../utils/format';
import { VideoCapture } from './VideoCapture';

const stop = vi.fn();

class FakeRecorder {
  state = 'inactive';
  ondataavailable: ((event: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  start() {
    this.state = 'recording';
  }
  stop() {
    this.state = 'inactive';
    stop();
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('MediaRecorder', FakeRecorder);
  vi.stubGlobal('navigator', {
    ...navigator,
    mediaDevices: { getUserMedia: vi.fn(async () => ({ getTracks: () => [] })) },
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  stop.mockReset();
});

describe('formatClock', () => {
  it('formats seconds as mm:ss', () => {
    expect(formatClock(0)).toBe('00:00');
    expect(formatClock(12)).toBe('00:12');
    expect(formatClock(30)).toBe('00:30');
    expect(formatClock(75)).toBe('01:15');
  });
});

describe('VideoCapture recording', () => {
  it('shows elapsed / limit, uses the shutter to stop, and stops itself at 30 s', async () => {
    render(<VideoCapture onCapture={() => {}} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /enable camera/i }));
    await act(async () => {});

    fireEvent.click(screen.getByRole('button', { name: 'Record video' }));
    act(() => vi.advanceTimersByTime(12_000));
    expect(screen.getByText('00:12 / 00:30')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stop recording' })).toBeInTheDocument();
    expect(screen.queryByText(/stop recording/i)).not.toBeInTheDocument(); // no separate Stop bar

    act(() => vi.advanceTimersByTime(18_000));
    expect(stop).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: 'Stop recording' })).not.toBeInTheDocument();
  });
});
