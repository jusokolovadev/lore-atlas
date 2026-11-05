import {
  findStandardReferenceCategoryProfileById,
  getAllStandardReferenceCategoryProfiles,
} from './standard-reference-category-profile-catalog';

import { STANDARD_REFERENCE_CATEGORY_PROFILES } from './standard-reference-category-profiles';
import { getAllStandardReferenceCategories } from './standard-reference-category-catalog';

describe('standard reference category profile catalog', () => {
  describe('findStandardReferenceCategoryProfileById', () => {
    it('finds a profile by ID', () => {
      const profile = STANDARD_REFERENCE_CATEGORY_PROFILES[0];

      expect(findStandardReferenceCategoryProfileById(profile.id)).toBe(profile);
    });

    it('returns null when profile does not exist', () => {
      expect(findStandardReferenceCategoryProfileById('unknown')).toBeNull();
    });
  });

  describe('getAllStandardReferenceCategoryProfiles', () => {
    it('returns all profiles', () => {
      expect(getAllStandardReferenceCategoryProfiles()).toEqual(
        STANDARD_REFERENCE_CATEGORY_PROFILES,
      );
    });

    it('returns a new array', () => {
      const firstResult = getAllStandardReferenceCategoryProfiles();
      const secondResult = getAllStandardReferenceCategoryProfiles();

      expect(firstResult).not.toBe(secondResult);
    });

    it('does not allow modifying the catalog through the returned array', () => {
      const profiles = getAllStandardReferenceCategoryProfiles();

      profiles.push({
        id: 'test',
        name: 'Test',
        description: 'Test profile',
        categoryIds: [],
      });

      expect(STANDARD_REFERENCE_CATEGORY_PROFILES).toHaveLength(profiles.length - 1);
    });
  });

  describe('catalog integrity', () => {
    it('contains unique profile IDs', () => {
      const ids = STANDARD_REFERENCE_CATEGORY_PROFILES.map((profile) => profile.id);

      expect(new Set(ids).size).toBe(ids.length);
    });

    it('references only existing standard categories', () => {
      const categoryIds = new Set(
        getAllStandardReferenceCategories().map((category) => category.id),
      );

      for (const profile of STANDARD_REFERENCE_CATEGORY_PROFILES) {
        for (const categoryId of profile.categoryIds) {
          expect(categoryIds.has(categoryId)).toBe(true);
        }
      }
    });

    it('does not contain duplicate category IDs within a profile', () => {
      for (const profile of STANDARD_REFERENCE_CATEGORY_PROFILES) {
        expect(new Set(profile.categoryIds).size).toBe(profile.categoryIds.length);
      }
    });
  });
});
