import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CameraCapture } from './CameraCapture';

const getUserMedia = vi.fn(async () => ({ getTracks: () => [] }) as unknown as MediaStream);

function stubPermission(state: PermissionState) {
  vi.stubGlobal('navigator', {
    ...navigator,
    permissions: { query: vi.fn(async () => ({ state })) },
    mediaDevices: { getUserMedia },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  getUserMedia.mockClear();
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
});
