import type { UniverseRepository } from 'src/features/universes/application/repositories/universe-repository';

import { disableStandardReferenceCategory } from '../../../reference-categories/domain/operations/disable-standard-reference-category';

export interface DisableStandardReferenceCategoryInput {
  universeId: string;
  categoryId: string;
  getCurrentTime: () => string;
}

export interface DisableStandardReferenceCategoryDependencies {
  universeRepository: UniverseRepository;
}

export function createDisableStandardReferenceCategoryUseCase({
  universeRepository,
}: DisableStandardReferenceCategoryDependencies) {
  return async ({
    universeId,
    categoryId,
    getCurrentTime,
  }: DisableStandardReferenceCategoryInput): Promise<void> => {
    const universe = await universeRepository.findById(universeId);

    if (!universe || universe.deletedAt !== null) {
      throw new Error('Active universe not found.');
    }

    const updatedUniverse = disableStandardReferenceCategory(universe, categoryId);

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
