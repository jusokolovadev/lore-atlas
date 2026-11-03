import { updateReferenceCategory } from '../../domain/operations/update-reference-category';
import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';

import {
  ReferenceCategoryApplicationError,
  ReferenceCategoryNameConflictError,
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

    // Domain validation and update
    const updatedCategory = updateReferenceCategory(category, input);

    // No changes
    if (updatedCategory === category) {
      return category;
    }

    // Check uniqueness only if the name actually changed
    if (updatedCategory.name !== category.name) {
      const existingCategory = await referenceCategoryRepository.findActiveByName(
        category.universeId,
        updatedCategory.name,
      );

      if (existingCategory && existingCategory.id !== category.id) {
        throw new ReferenceCategoryApplicationError(
          'DUPLICATE_NAME',
          'A category with this name already exists in this universe.',
        );
      }
    }

    const result: CustomReferenceCategory = {
      ...updatedCategory,
      updatedAt: getCurrentTime(),
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
