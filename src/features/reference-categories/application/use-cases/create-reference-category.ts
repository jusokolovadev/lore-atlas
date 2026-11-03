import { createReferenceCategory } from '../../domain/operations/create-reference-category';
import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';

import {
  ReferenceCategoryApplicationError,
  ReferenceCategoryNameConflictError,
} from '../errors/reference-category-application-errors';
import type { ReferenceCategoryRepository } from '../repositories/reference-category-repository';

export interface CreateReferenceCategoryInput {
  universeId: string;
  name: string;
  description?: string | null;
}

export interface CreateReferenceCategoryDependencies {
  referenceCategoryRepository: ReferenceCategoryRepository;
  generateId: () => string;
  getCurrentTime: () => string;
}

export function createCreateReferenceCategoryUseCase({
  referenceCategoryRepository,
  generateId,
  getCurrentTime,
}: CreateReferenceCategoryDependencies) {
  return async (
    input: CreateReferenceCategoryInput,
  ): Promise<CustomReferenceCategory> => {
    const now = getCurrentTime();

    const category = createReferenceCategory(input, {
      id: generateId(),
      now,
    });

    try {
      const created = await referenceCategoryRepository.createIfUniverseActive(category);

      if (!created) {
        throw new ReferenceCategoryApplicationError(
          'UNIVERSE_NOT_FOUND',
          'Universe not found.',
        );
      }
    } catch (error) {
      if (error instanceof ReferenceCategoryNameConflictError) {
        throw new ReferenceCategoryApplicationError(
          'DUPLICATE_NAME',
          'A category with this name already exists in this universe.',
        );
      }

      throw error;
    }

    return category;
  };
}
