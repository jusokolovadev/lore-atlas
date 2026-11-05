import type { UniverseRepository } from 'src/features/universes/application/repositories/universe-repository';
import type { ReferenceCategoryRepository } from '../repositories/reference-category-repository';
import type { ReferenceCategoryResult } from '../models/reference-category-result';

export interface GetReferenceCategoriesByUniverseInput {
  universeId: string;
}

export interface GetReferenceCategoriesByUniverseDependencies {
  universeRepository: UniverseRepository;
  referenceCategoryRepository: ReferenceCategoryRepository;
}

import { getAllStandardReferenceCategories } from '../../domain/catalog/standard-reference-category-catalog';

export function createGetReferenceCategoriesByUniverse(
  dependencies: GetReferenceCategoriesByUniverseDependencies,
) {
  return async function getReferenceCategoriesByUniverse(
    input: GetReferenceCategoriesByUniverseInput,
  ): Promise<ReferenceCategoryResult[]> {
    const universe = await dependencies.universeRepository.findById(input.universeId);

    if (!universe || universe.deletedAt !== null) {
      throw new Error(`Universe "${input.universeId}" not found.`);
    }

    const customCategories =
      await dependencies.referenceCategoryRepository.findAllActiveByUniverseId(
        input.universeId,
      );

    const enabledStandardCategoryIds = new Set(universe.enabledStandardCategoryIds);

    const standardCategories = getAllStandardReferenceCategories()
      .filter((category) => enabledStandardCategoryIds.has(category.id))
      .map((category) => ({
        type: 'standard' as const,
        category,
      }));

    return [
      ...standardCategories,
      ...customCategories.map((category) => ({
        type: 'custom' as const,
        category,
      })),
    ];
  };
}
