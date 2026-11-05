import {
  findStandardReferenceCategoryById,
  getCoreReferenceCategories,
  getAllStandardReferenceCategories,
} from './standard-reference-category-catalog';

describe('standard reference category catalog', () => {
  describe('findStandardReferenceCategoryById', () => {
    it('returns a category when it exists', () => {
      const category = findStandardReferenceCategoryById('species');

      expect(category).toEqual({
        id: 'species',
        name: 'Species',
        description: 'Types of species and races that exist in a universe.',
        isCore: true,
      });
    });

    it('returns null when the category does not exist', () => {
      expect(findStandardReferenceCategoryById('unknown-category')).toBeNull();
    });
  });

  describe('getCoreReferenceCategories', () => {
    it('returns all Core categories', () => {
      const categories = getCoreReferenceCategories();

      expect(categories.map((category) => category.id)).toEqual([
        'species',
        'organization-types',
        'titles',
        'ranks',
        'settlement-types',
      ]);
    });

    it('returns a new array', () => {
      const firstResult = getCoreReferenceCategories();
      const secondResult = getCoreReferenceCategories();

      expect(firstResult).not.toBe(secondResult);
    });
  });

  describe('getAllStandardReferenceCategories', () => {
    it('returns all standard reference categories', () => {
      const categories = getAllStandardReferenceCategories();

      expect(categories.length).toBeGreaterThan(0);
      expect(categories.some((category) => category.isCore)).toBe(true);
      expect(categories.some((category) => !category.isCore)).toBe(false);
    });

    it('returns a new array', () => {
      const firstResult = getAllStandardReferenceCategories();
      const secondResult = getAllStandardReferenceCategories();

      expect(firstResult).not.toBe(secondResult);
    });
  });
});
