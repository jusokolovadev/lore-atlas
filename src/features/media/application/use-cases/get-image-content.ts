import type { ImageStorageRepository } from '../repositories/image-storage-repository';

export interface GetImageContentDependencies {
  repository: ImageStorageRepository;
}

export function createGetImageContentUseCase({
  repository,
}: GetImageContentDependencies) {
  return async function getImageContent(id: string): Promise<Blob | null> {
    return repository.findContentById(id);
  };
}
