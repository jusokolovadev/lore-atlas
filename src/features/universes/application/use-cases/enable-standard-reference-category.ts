import type { UniverseRepository } from 'src/features/universes/application/repositories/universe-repository';
import { enableStandardReferenceCategory } from '../../../reference-categories/domain/operations/enable-standard-reference-category';

export interface EnableStandardReferenceCategoryInput {
  universeId: string;
  categoryId: string;
  getCurrentTime: () => string;
}

export interface EnableStandardReferenceCategoryDependencies {
  universeRepository: UniverseRepository;
}

export function createEnableStandardReferenceCategoryUseCase({
  universeRepository,
}: EnableStandardReferenceCategoryDependencies) {
  return async ({
    universeId,
    categoryId,
    getCurrentTime,
  }: EnableStandardReferenceCategoryInput): Promise<void> => {
    const universe = await universeRepository.findById(universeId);

    if (!universe || universe.deletedAt !== null) {
      throw new Error('Active universe not found.');
    }

    const updatedUniverse = enableStandardReferenceCategory(universe, categoryId);

    if (updatedUniverse === universe) {
      return;
    }

    await universeRepository.update(
      {
        ...updatedUniverse,
        updatedAt: getCurrentTime(),
        revision: universe.revision + 1,
      },
      universe.revision,
    );
  };
}
