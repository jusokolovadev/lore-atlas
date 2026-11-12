import type { StoredImage } from '../../domain/models/stored-image';
import { createStoredImage } from '../../domain/operations/create-stored-image';
import { validateImageFile } from '../../domain/operations/validate-image-file';
import type { ImageStorageRepository } from '../repositories/image-storage-repository';

export interface SaveImageDependencies {
  repository: ImageStorageRepository;
  generateId: () => string;
  getCurrentTime: () => string;
  maxSize: number;
}

export interface SaveImageInput {
  blob: Blob;
}

export function createSaveImageUseCase({
  repository,
  generateId,
  getCurrentTime,
  maxSize,
}: SaveImageDependencies) {
  return async function saveImage(input: SaveImageInput): Promise<StoredImage> {
    const validation = validateImageFile({
      mimeType: input.blob.type,
      size: input.blob.size,
      maxSize,
    });

    if (!validation.valid) {
      throw new Error(`Invalid image file: ${validation.reason}.`);
    }

    const image = createStoredImage({
      id: generateId(),
      mimeType: input.blob.type,
      size: input.blob.size,
      createdAt: getCurrentTime(),
    });

    await repository.save(image, input.blob);

    return image;
  };
}
