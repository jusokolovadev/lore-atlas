import { deleteReferenceCategory } from '../../domain/operations/delete-reference-category';
import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';

import { ReferenceCategoryApplicationError } from '../errors/reference-category-application-errors';
import type { ReferenceCategoryRepository } from '../repositories/reference-category-repository';

export interface DeleteReferenceCategoryDependencies {
  referenceCategoryRepository: ReferenceCategoryRepository;
  getCurrentTime: () => string;
}

export function createDeleteReferenceCategoryUseCase({
  referenceCategoryRepository,
  getCurrentTime,
}: DeleteReferenceCategoryDependencies) {
  return async (id: string): Promise<CustomReferenceCategory> => {
    const category = await referenceCategoryRepository.findById(id);

    if (!category) {
      throw new ReferenceCategoryApplicationError(
        'NOT_FOUND',
        'Reference category not found.',
      );
    }

    const now = getCurrentTime();

    const deletedCategory = deleteReferenceCategory(category, now);

    const result: CustomReferenceCategory = {
      ...deletedCategory,
      updatedAt: now,
    };

    await referenceCategoryRepository.save(result);

    return result;
  };
}
