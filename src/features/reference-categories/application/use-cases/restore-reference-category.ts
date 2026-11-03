import { restoreReferenceCategory } from '../../domain/operations/restore-reference-category';
import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';

import {
  ReferenceCategoryApplicationError,
  ReferenceCategoryNameConflictError,
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

    // Domain validates whether the category can be restored.
    const restoredCategory = restoreReferenceCategory(category);

    // Check whether another active category uses this name.
    const existingCategory = await referenceCategoryRepository.findActiveByName(
      category.universeId,
      restoredCategory.name,
    );

    if (existingCategory && existingCategory.id !== category.id) {
      throw new ReferenceCategoryApplicationError(
        'DUPLICATE_NAME',
        'A category with this name already exists in this universe.',
      );
    }

    const now = getCurrentTime();

    const result: CustomReferenceCategory = {
      ...restoredCategory,
      updatedAt: now,
    };

    try {
      await referenceCategoryRepository.save(result);
    } catch (error) {
      if (error instanceof ReferenceCategoryNameConflictError) {
        throw new ReferenceCategoryApplicationError(
          'DUPLICATE_NAME',
          'A category with this name already exists in this universe.',
        );
      }

      throw error;
    }

    return result;
  };
}
