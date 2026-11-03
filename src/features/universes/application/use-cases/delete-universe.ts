import type { UniverseDeletionRepository } from '../repositories/universe-deletion-repository';

export interface DeleteUniverseDependencies {
  deletionRepository: UniverseDeletionRepository;
  getCurrentTime: () => string;
}

export function createDeleteUniverseUseCase({
  deletionRepository,
  getCurrentTime,
}: DeleteUniverseDependencies): (id: string) => Promise<void> {
  return async (id) => {
    const now = getCurrentTime();

    await deletionRepository.deleteUniverseWithCategories(id, now);
  };
}
