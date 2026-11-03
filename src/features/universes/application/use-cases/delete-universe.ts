import { UniverseError } from '../../domain/errors/universe-error';
import { deleteUniverse } from '../../domain/operations/delete-universe';

import { deleteReferenceCategory } from 'src/features/reference-categories/domain/operations/delete-reference-category';

import type { UniverseRepository } from '../repositories/universe-repository';
import type { ReferenceCategoryRepository } from 'src/features/reference-categories/application/repositories/reference-category-repository';
import type { UniverseDeletionRepository } from '../repositories/universe-deletion-repository';

export interface DeleteUniverseDependencies {
  repository: UniverseRepository;
  referenceCategoryRepository: ReferenceCategoryRepository;
  deletionRepository: UniverseDeletionRepository;
  getCurrentTime: () => string;
}

export function createDeleteUniverseUseCase(
  dependencies: DeleteUniverseDependencies,
): (id: string) => Promise<void> {
  return async (id) => {
    const universe = await dependencies.repository.findById(id);

    if (!universe) {
      throw new UniverseError('NOT_FOUND', 'Universe not found.');
    }

    const now = dependencies.getCurrentTime();

    const deletedUniverse = {
      ...deleteUniverse(universe, now),
      updatedAt: now,
    };

    const categories =
      await dependencies.referenceCategoryRepository.findAllActiveByUniverseId(id);

    const deletedCategories = categories.map((category) => ({
      ...deleteReferenceCategory(category, now),
      updatedAt: now,
    }));

    await dependencies.deletionRepository.deleteUniverseWithCategories(
      deletedUniverse,
      deletedCategories,
    );
  };
}
