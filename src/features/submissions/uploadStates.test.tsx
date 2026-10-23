import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '../../types/schema';
import { uploadImage } from '../../services/storage.service';
import { createSubmission } from '../../services/submission.service';
import { useAuthStore } from '../../store/authStore';
import { TaskSubmission } from './TaskSubmission';

const photo = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });

vi.mock('./CameraCapture', () => ({
  CameraCapture: ({ onCapture }: { onCapture: (file: File) => void }) => (
    <button type="button" onClick={() => onCapture(photo)}>Capture</button>
  ),
}));
vi.mock('../../services/storage.service', () => ({ uploadImage: vi.fn(), uploadVideo: vi.fn() }));
vi.mock('../../services/submission.service', () => ({ createSubmission: vi.fn(), verifyGPSLocation: vi.fn() }));

const task = { id: 'gate', title: 'Gate', description: '', type: 'PHOTO', points: 80, isActive: true } as Task;

describe('Upload states', () => {
  beforeEach(() => {
    vi.mocked(uploadImage).mockReset();
    vi.mocked(createSubmission).mockReset();
    useAuthStore.setState({
      isAuthenticated: true,
      team: { id: 'team', eventId: 'e', tenantId: 'x', score: 0, completedTaskIds: [] } as never,
      tenant: { id: 'x', name: 'Rally' } as never,
    });
  });

  it('shows upload progress as a percentage', async () => {
    vi.mocked(uploadImage).mockImplementation((_file, _path, onProgress) => {
      onProgress?.(40);
      return new Promise(() => {});
    });
    render(<TaskSubmission task={task} onSuccess={() => {}} onCancel={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Capture' }));
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '40');
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Keep playing' })).toBeInTheDocument();
  });

  it('keeps the photo after a failed upload and retries it with Try again', async () => {
    vi.mocked(uploadImage).mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce('https://photo');
    vi.mocked(createSubmission).mockResolvedValue(undefined as never);
    render(<TaskSubmission task={task} onSuccess={() => {}} onCancel={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'Capture' }));

    expect(await screen.findByText(/still on your phone/i)).toBeInTheDocument();
    expect(screen.queryByText(/upload later/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(uploadImage).toHaveBeenCalledTimes(2);
    expect(vi.mocked(uploadImage).mock.calls[1][0]).toBe(photo);
  });
});
