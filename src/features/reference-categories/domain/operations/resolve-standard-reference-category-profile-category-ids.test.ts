import { getCoreReferenceCategories } from '../catalog/standard-reference-category-catalog';
import { getAllStandardReferenceCategoryProfiles } from '../catalog/standard-reference-category-profile-catalog';

import { resolveStandardReferenceCategoryProfileCategoryIds } from './resolve-standard-reference-category-profile-category-ids';

describe('resolveStandardReferenceCategoryProfileCategoryIds', () => {
  it('includes all core categories when no profiles are selected', () => {
    const result = resolveStandardReferenceCategoryProfileCategoryIds([]);

    const coreCategoryIds = getCoreReferenceCategories().map((category) => category.id);

    for (const categoryId of coreCategoryIds) {
      expect(result).toContain(categoryId);
    }

    expect(result).toHaveLength(coreCategoryIds.length);
  });

  it('includes categories from the selected profile', () => {
    const profile = getAllStandardReferenceCategoryProfiles()[0];

    const result = resolveStandardReferenceCategoryProfileCategoryIds([profile.id]);

    for (const categoryId of profile.categoryIds) {
      expect(result).toContain(categoryId);
    }
  });

  it('combines categories from multiple profiles', () => {
    const profiles = getAllStandardReferenceCategoryProfiles();

    const result = resolveStandardReferenceCategoryProfileCategoryIds([
      profiles[0].id,
      profiles[1].id,
    ]);

    for (const profile of profiles.slice(0, 2)) {
      for (const categoryId of profile.categoryIds) {
        expect(result).toContain(categoryId);
      }
    }
  });

  it('does not include duplicate category IDs', () => {
    const profiles = getAllStandardReferenceCategoryProfiles();

    const result = resolveStandardReferenceCategoryProfileCategoryIds([
      profiles[0].id,
      profiles[1].id,
    ]);

    expect(new Set(result).size).toBe(result.length);
  });

  it('does not duplicate core categories included in profiles', () => {
    const coreCategoryIds = getCoreReferenceCategories().map((category) => category.id);

    const result = resolveStandardReferenceCategoryProfileCategoryIds([
      ...getAllStandardReferenceCategoryProfiles()
        .filter((profile) =>
          profile.categoryIds.some((id) => coreCategoryIds.includes(id)),
        )
        .map((profile) => profile.id),
    ]);

    for (const categoryId of coreCategoryIds) {
      expect(result.filter((id) => id === categoryId)).toHaveLength(1);
    }
  });

  it('throws when a selected profile does not exist', () => {
    expect(() => resolveStandardReferenceCategoryProfileCategoryIds(['unknown'])).toThrow(
      'Standard reference category profile "unknown" not found.',
    );
  });
});
