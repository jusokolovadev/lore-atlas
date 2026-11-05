import { updateReferenceCategory } from '../../domain/operations/update-reference-category';
import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';

import {
  ReferenceCategoryApplicationError,
  ReferenceCategoryNameConflictError,
  ReferenceCategoryConcurrencyError,
} from '../errors/reference-category-application-errors';
import type { ReferenceCategoryRepository } from '../repositories/reference-category-repository';

export interface UpdateReferenceCategoryInput {
  name?: string;
  description?: string | null;
}

export interface UpdateReferenceCategoryDependencies {
  referenceCategoryRepository: ReferenceCategoryRepository;
  getCurrentTime: () => string;
}

export function createUpdateReferenceCategoryUseCase({
  referenceCategoryRepository,
  getCurrentTime,
}: UpdateReferenceCategoryDependencies) {
  return async (
    id: string,
    input: UpdateReferenceCategoryInput,
  ): Promise<CustomReferenceCategory> => {
    const category = await referenceCategoryRepository.findById(id);

    if (!category) {
      throw new ReferenceCategoryApplicationError(
        'NOT_FOUND',
        'Reference category not found.',
      );
    }

    const updatedCategory = updateReferenceCategory(category, input);

    if (updatedCategory === category) {
      return category;
    }

    const result: CustomReferenceCategory = {
      ...updatedCategory,
      updatedAt: getCurrentTime(),
      revision: category.revision + 1,
    };

    try {
      await referenceCategoryRepository.update(result, category.revision);
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
