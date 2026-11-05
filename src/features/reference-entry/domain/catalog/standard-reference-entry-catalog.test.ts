import {
  findStandardReferenceEntryById,
  getAllStandardReferenceEntries,
  getStandardReferenceEntriesByCategoryId,
} from './standard-reference-entry-catalog';

import { STANDARD_REFERENCE_ENTRIES } from './standard-reference-entries';
import { getAllStandardReferenceCategories } from 'src/features/reference-categories/domain/catalog/standard-reference-category-catalog';

describe('standard-reference-entry-catalog', () => {
  describe('findStandardReferenceEntryById', () => {
    it('returns the matching entry from the specified category', () => {
      const entry = STANDARD_REFERENCE_ENTRIES['organization-types'][0];

      expect(findStandardReferenceEntryById('organization-types', entry.id)).toBe(entry);
    });

    it('returns null when the entry does not exist', () => {
      expect(findStandardReferenceEntryById('species', '__unknown_entry__')).toBeNull();
    });

    it('returns null when the category does not exist', () => {
      expect(findStandardReferenceEntryById('__unknown_category__', 'human')).toBeNull();
    });
  });

  describe('getStandardReferenceEntriesByCategoryId', () => {
    it('returns entries belonging to the requested category', () => {
      expect(getStandardReferenceEntriesByCategoryId('species')).toEqual(
        STANDARD_REFERENCE_ENTRIES.species,
      );
    });

    it('returns an empty array when the category does not exist', () => {
      expect(getStandardReferenceEntriesByCategoryId('__unknown_category__')).toEqual([]);
    });

    it('returns a new array', () => {
      const firstResult = getStandardReferenceEntriesByCategoryId('species');
      const secondResult = getStandardReferenceEntriesByCategoryId('species');

      expect(firstResult).not.toBe(secondResult);
    });

    it('does not allow modifying the catalog through the returned array', () => {
      const originalEntries = STANDARD_REFERENCE_ENTRIES.species;
      const originalLength = originalEntries.length;

      const entries = getStandardReferenceEntriesByCategoryId('species');

      entries.push({
        id: '__test_entry__',
        name: 'Test Entry',
        description: null,
        image: null,
      });

      expect(originalEntries).toHaveLength(originalLength);
    });
  });

  describe('getAllStandardReferenceEntries', () => {
    it('returns all entries from all categories', () => {
      expect(getAllStandardReferenceEntries()).toEqual(
        Object.values(STANDARD_REFERENCE_ENTRIES).flat(),
      );
    });

    it('returns a new array', () => {
      const firstResult = getAllStandardReferenceEntries();
      const secondResult = getAllStandardReferenceEntries();

      expect(firstResult).not.toBe(secondResult);
    });

    it('does not allow modifying the catalog through the returned array', () => {
      const originalLength = Object.values(STANDARD_REFERENCE_ENTRIES).flat().length;

      const entries = getAllStandardReferenceEntries();

      entries.push({
        id: '__test_entry__',
        name: 'Test Entry',
        description: null,
        image: null,
      });

      expect(getAllStandardReferenceEntries()).toHaveLength(originalLength);
    });
  });

  describe('catalog integrity', () => {
    it('returns the original entry references', () => {
      const originalEntry = STANDARD_REFERENCE_ENTRIES.species[0];

      const entries = getStandardReferenceEntriesByCategoryId('species');

      expect(entries[0]).toBe(originalEntry);
    });

    it('contains only existing standard category IDs', () => {
      const categoryIds = new Set(
        getAllStandardReferenceCategories().map((category) => category.id),
      );

      for (const categoryId of Object.keys(STANDARD_REFERENCE_ENTRIES)) {
        expect(categoryIds.has(categoryId)).toBe(true);
      }
    });
  });
});
