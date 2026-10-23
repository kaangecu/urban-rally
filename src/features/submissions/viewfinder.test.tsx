import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CameraCapture } from './CameraCapture';

const getUserMedia = vi.fn(async () => ({ getTracks: () => [] }) as unknown as MediaStream);

beforeEach(() => {
  vi.stubGlobal('navigator', {
    ...navigator,
    permissions: { query: vi.fn(async () => ({ state: 'granted' })) },
    mediaDevices: { getUserMedia },
  });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as never);
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,eA==');
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((done: BlobCallback) =>
    done(new Blob(['x'], { type: 'image/jpeg' }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('Viewfinder and preview', () => {
  it('shows the task brief above the viewfinder', async () => {
    render(<CameraCapture brief="Photo of the gate" onCapture={() => {}} onCancel={() => {}} />);
    expect(await screen.findByText('Photo of the gate')).toBeInTheDocument();
  });

  it('captures with the shutter, retakes, and sends with Use photo', async () => {
    const onCapture = vi.fn();
    render(<CameraCapture brief="Photo of the gate" onCapture={onCapture} onCancel={() => {}} />);

    await userEvent.click(await screen.findByRole('button', { name: 'Take photo' }));
    expect(screen.getByRole('img', { name: 'Your photo' })).toBeInTheDocument();
    expect(screen.getAllByRole('button').map((b) => b.textContent?.trim()).filter(Boolean)).toEqual(['Retake', 'Use photo']);

    await userEvent.click(screen.getByRole('button', { name: 'Retake' }));
    expect(screen.queryByRole('img', { name: 'Your photo' })).not.toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: 'Take photo' }));
    await userEvent.click(screen.getByRole('button', { name: 'Use photo' }));
    expect(onCapture).toHaveBeenCalledOnce();
    expect(onCapture.mock.calls[0][0]).toBeInstanceOf(File);
  });
});
