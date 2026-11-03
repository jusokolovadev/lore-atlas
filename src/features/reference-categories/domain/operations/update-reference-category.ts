import type { CustomReferenceCategory } from '../models/custom-reference-category';
import { ReferenceCategoryError } from '../errors/reference-category-errors';

export interface UpdateReferenceCategoryInput {
  name?: string;
  description?: string | null;
}

export function updateReferenceCategory(
  category: CustomReferenceCategory,
  input: UpdateReferenceCategoryInput,
): CustomReferenceCategory {
  if (category.deletedAt !== null) {
    throw new ReferenceCategoryError(
      'ALREADY_DELETED',
      'Cannot update a deleted reference category.',
    );
  }

  const name = input.name?.trim();

  if (name !== undefined && !name) {
    throw new ReferenceCategoryError(
      'INVALID_NAME',
      'Reference category name cannot be empty.',
    );
  }

  const updatedCategory = {
    ...category,
    ...(input.name !== undefined && { name }),
    ...(input.description !== undefined && {
      description: input.description,
    }),
  };

  const hasChanges =
    updatedCategory.name !== category.name ||
    updatedCategory.description !== category.description;

  return hasChanges ? updatedCategory : category;
}
