import type { ImageStorageRepository } from '../repositories/image-storage-repository';
import type { ImageUsageRepository } from '../repositories/image-usage-repository';

export interface CleanupUnusedImagesDependencies {
  imageStorageRepository: ImageStorageRepository;
  imageUsageRepository: ImageUsageRepository;
}

export function createCleanupUnusedImagesUseCase({
  imageStorageRepository,
  imageUsageRepository,
}: CleanupUnusedImagesDependencies) {
  return async (): Promise<string[]> => {
    const [images, referencedImageIds] = await Promise.all([
      imageStorageRepository.findAll(),
      imageUsageRepository.findAllReferencedImageIds(),
    ]);

    const referencedIds = new Set(referencedImageIds);
    const unusedImages = images.filter((image) => !referencedIds.has(image.id));

    await Promise.all(
      unusedImages.map((image) => imageStorageRepository.delete(image.id)),
    );

    return unusedImages.map((image) => image.id);
  };
}
