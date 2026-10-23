import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatClock } from '../../utils/format';
import { VideoCapture } from './VideoCapture';

const stop = vi.fn();
const recorders: FakeRecorder[] = [];

class FakeRecorder {
  static supported = ['video/webm;codecs=vp8,opus'];
  static isTypeSupported(type: string) {
    return FakeRecorder.supported.includes(type);
  }
  options: MediaRecorderOptions | undefined;
  constructor(_stream: unknown, options?: MediaRecorderOptions) {
    this.options = options;
    recorders.push(this);
  }
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
  vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:clip', revokeObjectURL: () => {} }));
  vi.stubGlobal('navigator', {
    ...navigator,
    mediaDevices: { getUserMedia: vi.fn(async () => ({ getTracks: () => [] })) },
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  stop.mockReset();
  recorders.length = 0;
  FakeRecorder.supported = ['video/webm;codecs=vp8,opus'];
});

async function openCamera() {
  fireEvent.click(screen.getByRole('button', { name: /enable camera/i }));
  await act(async () => {});
}

// Records a clip and lets the recorder finish, as a browser would after stop()
async function recordClip(type = 'video/webm') {
  fireEvent.click(screen.getByRole('button', { name: 'Record video' }));
  recorders.at(-1)!.ondataavailable?.({ data: new Blob(['clip'], { type }) });
  fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }));
  act(() => recorders.at(-1)!.onstop?.());
  act(() => vi.advanceTimersByTime(100));
}

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

  it('keeps the shutter disabled from Stop until the recorder has finished', async () => {
    render(<VideoCapture onCapture={() => {}} onCancel={() => {}} />);
    await openCamera();
    fireEvent.click(screen.getByRole('button', { name: 'Record video' }));
    fireEvent.click(screen.getByRole('button', { name: 'Stop recording' }));

    // A second tap here must not start a new recording over the first one
    expect(screen.getByRole('button', { name: 'Record video' })).toBeDisabled();
  });

  it('counts real elapsed time, so a throttled timer still stops at the limit', async () => {
    render(<VideoCapture onCapture={() => {}} onCancel={() => {}} />);
    await openCamera();
    fireEvent.click(screen.getByRole('button', { name: 'Record video' }));

    // The screen was locked: 29 s pass but the interval only fires once
    vi.setSystemTime(Date.now() + 29_000);
    act(() => vi.advanceTimersByTime(1_000));
    expect(stop).toHaveBeenCalledOnce();
  });

  it('keeps Retake and Use video when the preview fails to play', async () => {
    const { container } = render(<VideoCapture onCapture={() => {}} onCancel={() => {}} />);
    await openCamera();
    await recordClip();

    fireEvent.error(container.querySelector('video')!);
    expect(screen.getByText(/you can still upload it/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retake' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use video' })).toBeInTheDocument();
  });

  it('records MP4 where WebM is not supported, such as older iOS Safari', async () => {
    FakeRecorder.supported = ['video/mp4'];
    const onCapture = vi.fn();
    render(<VideoCapture onCapture={onCapture} onCancel={() => {}} />);
    await openCamera();
    await recordClip('video/mp4');

    expect(recorders.at(-1)!.options?.mimeType).toBe('video/mp4');
    fireEvent.click(screen.getByRole('button', { name: 'Use video' }));
    const file: File = onCapture.mock.calls[0][0];
    expect(file.type).toBe('video/mp4');
    expect(file.name).toMatch(/\.mp4$/);
  });
});
