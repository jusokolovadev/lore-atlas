import { getCoreReferenceCategories } from '../catalog/standard-reference-category-catalog';
import { findStandardReferenceCategoryProfileById } from '../catalog/standard-reference-category-profile-catalog';

export function resolveStandardReferenceCategoryProfileCategoryIds(
  profileIds: readonly string[],
): string[] {
  const categoryIds = new Set<string>();

  for (const category of getCoreReferenceCategories()) {
    categoryIds.add(category.id);
  }

  for (const profileId of profileIds) {
    const profile = findStandardReferenceCategoryProfileById(profileId);

    if (!profile) {
      throw new Error(`Standard reference category profile "${profileId}" not found.`);
    }

    for (const categoryId of profile.categoryIds) {
      categoryIds.add(categoryId);
    }
  }

  return [...categoryIds];
}
