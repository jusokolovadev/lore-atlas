import { restoreReferenceCategory } from '../../domain/operations/restore-reference-category';
import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';

import {
  ReferenceCategoryApplicationError,
  ReferenceCategoryNameConflictError,
  ReferenceCategoryConcurrencyError,
} from '../errors/reference-category-application-errors';
import type { ReferenceCategoryRepository } from '../repositories/reference-category-repository';

export interface RestoreReferenceCategoryDependencies {
  referenceCategoryRepository: ReferenceCategoryRepository;
  getCurrentTime: () => string;
}

export function createRestoreReferenceCategoryUseCase({
  referenceCategoryRepository,
  getCurrentTime,
}: RestoreReferenceCategoryDependencies) {
  return async (id: string): Promise<CustomReferenceCategory> => {
    const category = await referenceCategoryRepository.findById(id);

    if (!category) {
      throw new ReferenceCategoryApplicationError(
        'NOT_FOUND',
        'Reference category not found.',
      );
    }

    const restoredCategory = restoreReferenceCategory(category);

    const result: CustomReferenceCategory = {
      ...restoredCategory,
      updatedAt: getCurrentTime(),
      revision: category.revision + 1,
    };

    try {
      await referenceCategoryRepository.restore(result, category.revision);
    } catch (error) {
      if (error instanceof ReferenceCategoryNameConflictError) {
        throw new ReferenceCategoryApplicationError(
          'DUPLICATE_NAME',
          'A category with this name already exists in this universe.',
        );
      }

      if (error instanceof ReferenceCategoryConcurrencyError) {
        throw new ReferenceCategoryApplicationError(
          'CONCURRENT_MODIFICATION',
          'Reference category was modified by another operation.',
        );
      }

      throw error;
    }

    return result;
  };
}
