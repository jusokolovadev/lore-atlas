import { restoreReferenceCategory } from './restore-reference-category';
import { ReferenceCategoryError } from '../errors/reference-category-errors';
import type { CustomReferenceCategory } from '../models/custom-reference-category';

describe('restoreReferenceCategory', () => {
  const deletedCategory: CustomReferenceCategory = {
    id: 'category-1',
    universeId: 'universe-1',
    name: 'Species',
    description: 'Different species',
    createdAt: '2026-11-01T12:00:00.000Z',
    updatedAt: '2026-11-02T12:00:00.000Z',
    deletedAt: '2026-11-02T12:00:00.000Z',
    revision: 1,
  };

  it('sets deletedAt to null', () => {
    const result = restoreReferenceCategory(deletedCategory);

    expect(result.deletedAt).toBeNull();
  });

  it('preserves the category data', () => {
    const result = restoreReferenceCategory(deletedCategory);

    expect(result).toEqual({
      ...deletedCategory,
      deletedAt: null,
    });
  });

  it('does not mutate the original category', () => {
    restoreReferenceCategory(deletedCategory);

    expect(deletedCategory.deletedAt).not.toBeNull();
  });

  it('throws an error when the category is not deleted', () => {
    const activeCategory = {
      ...deletedCategory,
      deletedAt: null,
    };

    expect(() => restoreReferenceCategory(activeCategory)).toThrow(
      ReferenceCategoryError,
    );
  });
});
