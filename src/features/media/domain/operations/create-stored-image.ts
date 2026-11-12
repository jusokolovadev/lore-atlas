import type { StoredImage } from '../models/stored-image';

export interface CreateStoredImageInput {
  id: string;
  mimeType: string;
  size: number;
  createdAt: string;
}

export function createStoredImage(input: CreateStoredImageInput): StoredImage {
  if (!input.id.trim()) {
    throw new Error('Image ID is required.');
  }

  if (!input.mimeType.startsWith('image/')) {
    throw new Error('File must be an image.');
  }

  if (!Number.isSafeInteger(input.size) || input.size <= 0) {
    throw new Error('Image size must be a positive safe integer.');
  }

  if (!Number.isFinite(Date.parse(input.createdAt))) {
    throw new Error('Invalid creation date.');
  }

  return {
    id: input.id,
    mimeType: input.mimeType,
    size: input.size,
    createdAt: input.createdAt,
  };
}
