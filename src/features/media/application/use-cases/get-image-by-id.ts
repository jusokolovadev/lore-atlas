import type { StoredImage } from '../../domain/models/stored-image';
import type { ImageStorageRepository } from '../repositories/image-storage-repository';

export interface GetImageByIdDependencies {
  repository: ImageStorageRepository;
}

export function createGetImageByIdUseCase({ repository }: GetImageByIdDependencies) {
  return async function getImageById(id: string): Promise<StoredImage | null> {
    return repository.findById(id);
  };
}
