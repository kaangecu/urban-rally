/**
 * Image Compression Utility
 * Compresses images client-side before upload to minimize bandwidth
 * Critical for international students with limited/expensive mobile data
 */

import imageCompression from 'browser-image-compression';
import { appConfig } from '../config/app.config';

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
  quality?: number;
}

/**
 * Compress an image file to meet size constraints
 * @param file - The original image file
 * @param options - Compression options (optional)
 * @returns Compressed image file
 */
export const compressImage = async (
  file: File,
  options?: CompressionOptions
): Promise<File> => {
  const defaultOptions: CompressionOptions = {
    maxSizeMB: appConfig.maxImageSize / (1024 * 1024), // Convert bytes to MB
    maxWidthOrHeight: appConfig.maxImageWidth,
    useWebWorker: true,
    quality: appConfig.imageQuality,
  };

  const compressionOptions = { ...defaultOptions, ...options };

  try {
    console.log(`Original image size: ${(file.size / 1024).toFixed(2)}KB`);
    
    const compressedFile = await imageCompression(file, compressionOptions);
    
    console.log(`Compressed image size: ${(compressedFile.size / 1024).toFixed(2)}KB`);
    console.log(`Compression ratio: ${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`);
    
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error('Failed to compress image. Please try a different photo.');
  }
};

/**
 * Validate image file before compression
 * @param file - The file to validate
 * @returns true if valid, throws error otherwise
 */
export const validateImageFile = (file: File): boolean => {
  // Check if it's an image
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image (JPG, PNG, etc.)');
  }

  // Check file size (before compression)
  const maxFileSize = 10 * 1024 * 1024; // 10MB max before compression
  if (file.size > maxFileSize) {
    throw new Error('Image is too large. Please choose a smaller image (max 10MB).');
  }

  return true;
};

/**
 * Convert File to base64 string (for preview)
 * @param file - The image file
 * @returns Base64 data URL
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

/**
 * Get image dimensions
 * @param file - The image file
 * @returns Width and height in pixels
 */
export const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};
