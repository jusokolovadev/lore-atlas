import type { Universe } from 'src/features/universes/domain/models/universe';
import { StandardReferenceCategoryError } from 'src/features/reference-categories/domain/errors/standart-reference-category-errors';

import { findStandardReferenceCategoryById } from '../catalog/standard-reference-category-catalog';

export function enableStandardReferenceCategory(
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

  if (universe.enabledStandardCategoryIds.includes(categoryId)) {
    return universe;
  }

  return {
    ...universe,
    enabledStandardCategoryIds: [...universe.enabledStandardCategoryIds, categoryId],
  };
}
