import type { CustomReferenceCategory } from '../models/custom-reference-category';
import { ReferenceCategoryError } from '../errors/reference-category-errors';

export function deleteReferenceCategory(
  category: CustomReferenceCategory,
  now: string,
): CustomReferenceCategory {
  if (category.deletedAt !== null) {
    throw new ReferenceCategoryError(
      'ALREADY_DELETED',
      'Reference category is already deleted.',
    );
  }

  return {
    ...category,
    deletedAt: now,
  };
}
