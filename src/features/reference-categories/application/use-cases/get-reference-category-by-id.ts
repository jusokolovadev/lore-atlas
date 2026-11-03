import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';
import type { ReferenceCategoryRepository } from '../repositories/reference-category-repository';

export interface GetReferenceCategoryByIdDependencies {
  referenceCategoryRepository: ReferenceCategoryRepository;
}

export function createGetReferenceCategoryByIdUseCase({
  referenceCategoryRepository,
}: GetReferenceCategoryByIdDependencies) {
  return async (id: string): Promise<CustomReferenceCategory | null> => {
    return referenceCategoryRepository.findById(id);
  };
}
