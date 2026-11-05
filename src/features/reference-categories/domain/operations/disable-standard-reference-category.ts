import type { Universe } from 'src/features/universes/domain/models/universe';

import { findStandardReferenceCategoryById } from '../catalog/standard-reference-category-catalog';
import { StandardReferenceCategoryError } from 'src/features/reference-categories/domain/errors/standart-reference-category-errors';

export function disableStandardReferenceCategory(
  universe: Universe,
  categoryId: string,
): Universe {
  const category = findStandardReferenceCategoryById(categoryId);

  if (!category) {
    throw new StandardReferenceCategoryError(
      'CATEGORY_NOT_FOUND',
      `Standard reference category "${categoryId}" was not found.`,
    );
  }

  if (category.isCore) {
    throw new StandardReferenceCategoryError(
      'CORE_CATEGORY_CANNOT_BE_DISABLED',
      `Core category "${categoryId}" cannot be disabled.`,
    );
  }

  if (!universe.enabledStandardCategoryIds.includes(categoryId)) {
    return universe;
  }

  return {
    ...universe,
    enabledStandardCategoryIds: universe.enabledStandardCategoryIds.filter(
      (id) => id !== categoryId,
    ),
  };
}
