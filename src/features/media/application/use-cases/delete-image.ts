import type { ImageStorageRepository } from '../repositories/image-storage-repository';

export interface DeleteImageDependencies {
  repository: ImageStorageRepository;
}

export function createDeleteImageUseCase({ repository }: DeleteImageDependencies) {
  return async function deleteImage(id: string): Promise<void> {
    await repository.delete(id);
  };
}
