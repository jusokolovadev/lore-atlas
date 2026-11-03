import { updateReferenceCategory } from './update-reference-category';
import { ReferenceCategoryError } from '../errors/reference-category-errors';
import type { CustomReferenceCategory } from '../models/custom-reference-category';

describe('updateReferenceCategory', () => {
  const category: CustomReferenceCategory = {
    id: 'category-1',
    universeId: 'universe-1',
    name: 'Species',
    description: null,
    createdAt: '2026-11-01T12:00:00.000Z',
    updatedAt: '2026-11-01T12:00:00.000Z',
    deletedAt: null,
  };

  it('updates the category name', () => {
    const result = updateReferenceCategory(category, {
      name: 'Languages',
    });

    expect(result.name).toBe('Languages');
  });

  it('trims the updated name', () => {
    const result = updateReferenceCategory(category, {
      name: '  Languages  ',
    });

    expect(result.name).toBe('Languages');
  });

  it('updates the description', () => {
    const result = updateReferenceCategory(category, {
      description: 'Available languages',
    });

    expect(result.description).toBe('Available languages');
  });

  it('allows clearing the description', () => {
    const categoryWithDescription = {
      ...category,
      description: 'Some description',
    };

    const result = updateReferenceCategory(categoryWithDescription, {
      description: null,
    });

    expect(result.description).toBeNull();
  });

  it('preserves fields that were not provided', () => {
    const result = updateReferenceCategory(category, {
      name: 'Languages',
    });

    expect(result.description).toBe(category.description);
    expect(result.universeId).toBe(category.universeId);
    expect(result.id).toBe(category.id);
  });

  it('returns the same object when there are no changes', () => {
    const result = updateReferenceCategory(category, {
      name: 'Species',
    });

    expect(result).toBe(category);
  });

  it('returns the same object when the input is empty', () => {
    const result = updateReferenceCategory(category, {});

    expect(result).toBe(category);
  });

  it('throws an error when the updated name is empty', () => {
    expect(() =>
      updateReferenceCategory(category, {
        name: '   ',
      }),
    ).toThrow(ReferenceCategoryError);
  });

  it('throws an error when trying to update a deleted category', () => {
    const deletedCategory = {
      ...category,
      deletedAt: '2026-11-02T12:00:00.000Z',
    };

    expect(() =>
      updateReferenceCategory(deletedCategory, {
        name: 'Languages',
      }),
    ).toThrow(ReferenceCategoryError);
  });
});
