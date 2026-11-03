import { deleteReferenceCategory } from './delete-reference-category';
import { ReferenceCategoryError } from '../errors/reference-category-errors';
import type { CustomReferenceCategory } from '../models/custom-reference-category';

describe('deleteReferenceCategory', () => {
  const category: CustomReferenceCategory = {
    id: 'category-1',
    universeId: 'universe-1',
    name: 'Species',
    description: null,
    createdAt: '2026-11-01T12:00:00.000Z',
    updatedAt: '2026-11-01T12:00:00.000Z',
    deletedAt: null,
  };

  const now = '2026-11-03T12:00:00.000Z';

  it('sets deletedAt to the provided time', () => {
    const result = deleteReferenceCategory(category, now);

    expect(result.deletedAt).toBe(now);
  });

  it('preserves the category data', () => {
    const result = deleteReferenceCategory(category, now);

    expect(result).toEqual({
      ...category,
      deletedAt: now,
    });
  });

  it('does not mutate the original category', () => {
    deleteReferenceCategory(category, now);

    expect(category.deletedAt).toBeNull();
  });

  it('throws an error when the category is already deleted', () => {
    const deletedCategory = {
      ...category,
      deletedAt: '2026-11-02T12:00:00.000Z',
    };

    expect(() => deleteReferenceCategory(deletedCategory, now)).toThrow(
      ReferenceCategoryError,
    );
  });
});
