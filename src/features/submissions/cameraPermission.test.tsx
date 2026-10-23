import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CameraCapture } from './CameraCapture';

const emptyStream = async () => ({ getTracks: () => [] }) as unknown as MediaStream;
const getUserMedia = vi.fn(emptyStream);

function stubPermission(state: PermissionState) {
  vi.stubGlobal('navigator', {
    ...navigator,
    permissions: { query: vi.fn(async () => ({ state })) },
    mediaDevices: { getUserMedia },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  getUserMedia.mockReset();
  getUserMedia.mockImplementation(emptyStream);
});

describe('CameraCapture permission', () => {
  it('opens the viewfinder straight away when the camera is already allowed', async () => {
    stubPermission('granted');
    render(<CameraCapture onCapture={() => {}} onCancel={() => {}} />);
    await vi.waitFor(() => expect(getUserMedia).toHaveBeenCalled());
    expect(screen.queryByRole('button', { name: 'Allow camera' })).not.toBeInTheDocument();
  });

  it('explains why before the browser asks the first time', async () => {
    stubPermission('prompt');
    render(<CameraCapture onCapture={() => {}} onCancel={() => {}} />);
    expect(await screen.findByRole('button', { name: 'Allow camera' })).toBeInTheDocument();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('shows how to unblock the camera and a gallery fallback when blocked', async () => {
    stubPermission('denied');
    render(<CameraCapture onCapture={() => {}} onCancel={() => {}} />);
    expect(await screen.findByRole('heading', { name: 'Camera is blocked' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    const fallback = screen.getByLabelText('Choose a photo instead');
    expect(fallback).toHaveAttribute('type', 'file');
    expect(fallback).toHaveAttribute('accept', 'image/*');
    expect(fallback).toHaveAttribute('capture');
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  function trackedStream() {
    const stop = vi.fn();
    return { stop, stream: { getTracks: () => [{ stop }] } as unknown as MediaStream };
  }

  it('starts one stream from "Allow camera" and stops it on unmount', async () => {
    stubPermission('prompt');
    const streams: ReturnType<typeof trackedStream>[] = [];
    getUserMedia.mockImplementation(async () => {
      const s = trackedStream();
      streams.push(s);
      return s.stream;
    });
    const { unmount } = render(<CameraCapture onCapture={() => {}} onCancel={() => {}} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Allow camera' }));
    await vi.waitFor(() => expect(getUserMedia).toHaveBeenCalled());
    await Promise.resolve();
    expect(getUserMedia).toHaveBeenCalledOnce();

    unmount();
    expect(streams.every((s) => s.stop.mock.calls.length === 1)).toBe(true);
  });

  it('stops a stream that arrives after the camera was closed', async () => {
    stubPermission('granted');
    const late = trackedStream();
    let resolve: (stream: MediaStream) => void = () => {};
    getUserMedia.mockImplementation(() => new Promise<MediaStream>((r) => { resolve = r; }));
    const { unmount } = render(<CameraCapture onCapture={() => {}} onCancel={() => {}} />);
    await vi.waitFor(() => expect(getUserMedia).toHaveBeenCalled());

    unmount();
    resolve(late.stream);
    await vi.waitFor(() => expect(late.stop).toHaveBeenCalledOnce());
  });
});
