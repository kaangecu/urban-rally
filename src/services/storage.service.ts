import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { getFirebaseStorage } from './firebase.service';
import imageCompression from 'browser-image-compression';

/**
 * Compress an image before upload
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: 'image/jpeg',
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    // If compression fails, return original file
    return file;
  }
}

/**
 * Upload an image file to Firebase Storage
 * @param file - Image file to upload
 * @param path - Storage path (e.g., 'submissions/tenant-id/team-id/task-id/photo.jpg')
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Download URL of uploaded file
 */
export async function uploadImage(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Compress image first
    const compressedFile = await compressImage(file);

    const storage = getFirebaseStorage();
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, compressedFile);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track upload progress
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          onProgress?.(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          reject(new Error('Failed to upload image'));
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch {
            reject(new Error('Failed to get download URL'));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error('Failed to upload image');
  }
}

/**
 * Upload a video file to Firebase Storage
 * @param file - Video file to upload
 * @param path - Storage path
 * @param onProgress - Optional callback for upload progress (0-100)
 * @returns Download URL of uploaded file
 */
export async function uploadVideo(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const storage = getFirebaseStorage();
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Track upload progress
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          onProgress?.(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          reject(new Error('Failed to upload video'));
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          } catch {
            reject(new Error('Failed to get download URL'));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    throw new Error('Failed to upload video');
  }
}

/**
 * Delete a file from Firebase Storage
 * @param path - Storage path of file to delete
 */
export async function deleteFile(path: string): Promise<void> {
  try {
    const storage = getFirebaseStorage();
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
}

/**
 * Get download URL for a file
 * @param path - Storage path of the file
 * @returns Download URL
 */
export async function getFileURL(path: string): Promise<string> {
  try {
    const storage = getFirebaseStorage();
    const storageRef = ref(storage, path);
    const url = await getDownloadURL(storageRef);
    return url;
  } catch (error) {
    console.error('Error getting file URL:', error);
    throw new Error('Failed to get file URL');
  }
}

/**
 * Generate a storage path for a submission file
 */
export function generateSubmissionPath(
  tenantId: string,
  eventId: string,
  teamId: string,
  taskId: string,
  fileExtension: string
): string {
  const timestamp = Date.now();
  return `submissions/${tenantId}/${eventId}/${teamId}/${taskId}/${timestamp}.${fileExtension}`;
}
