import { deleteReferenceCategory } from '../../domain/operations/delete-reference-category';
import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';

import {
  ReferenceCategoryApplicationError,
  ReferenceCategoryConcurrencyError,
} from '../errors/reference-category-application-errors';
import { ReferenceCategoryError } from '../../domain/errors/reference-category-errors';
import type { ReferenceCategoryRepository } from '../repositories/reference-category-repository';
import type { ReferenceCategoryDeletionRepository } from '../repositories/reference-category-deletion-repository';

export interface DeleteReferenceCategoryDependencies {
  referenceCategoryRepository: ReferenceCategoryRepository;
  deletionRepository: ReferenceCategoryDeletionRepository;
  getCurrentTime: () => string;
}

export function createDeleteReferenceCategoryUseCase({
  referenceCategoryRepository,
  deletionRepository,
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

    if (category.deletedAt !== null) {
      throw new ReferenceCategoryError(
        'ALREADY_DELETED',
        'Reference category is already deleted.',
      );
    }

    const now = getCurrentTime();
    const deletedCategory = deleteReferenceCategory(category, now);

    const result: CustomReferenceCategory = {
      ...deletedCategory,
      updatedAt: now,
      revision: category.revision + 1,
    };

    try {
      await deletionRepository.deleteReferenceCategory(result, category.revision);
    } catch (error) {
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
