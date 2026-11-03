import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';
import type { ReferenceCategoryRepository } from '../repositories/reference-category-repository';

export interface GetReferenceCategoriesByUniverseIdDependencies {
  referenceCategoryRepository: ReferenceCategoryRepository;
}

export function createGetReferenceCategoriesByUniverseIdUseCase({
  referenceCategoryRepository,
}: GetReferenceCategoriesByUniverseIdDependencies) {
  return async (universeId: string): Promise<CustomReferenceCategory[]> => {
    return referenceCategoryRepository.findAllActiveByUniverseId(universeId);
  };
}
