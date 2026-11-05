import type { CustomReferenceCategory } from '../models/custom-reference-category';
import { ReferenceCategoryError } from '../errors/reference-category-errors';

export function restoreReferenceCategory(
  category: CustomReferenceCategory,
): CustomReferenceCategory {
  if (category.deletedAt === null) {
    throw new ReferenceCategoryError('NOT_DELETED', 'Reference category is not deleted.');
  }

  return {
    ...category,
    deletedAt: null,
  };
}
