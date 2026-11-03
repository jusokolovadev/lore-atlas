import { createReferenceCategory } from './create-reference-category';
import { ReferenceCategoryError } from '../errors/reference-category-errors';

describe('createReferenceCategory', () => {
  const metadata = {
    id: 'category-1',
    now: '2026-11-03T12:00:00.000Z',
  };

  it('creates a category with the provided data', () => {
    const result = createReferenceCategory(
      {
        universeId: 'universe-1',
        name: 'Species',
        description: 'Different species in the universe',
      },
      metadata,
    );

    expect(result).toEqual({
      id: 'category-1',
      universeId: 'universe-1',
      name: 'Species',
      description: 'Different species in the universe',
      createdAt: metadata.now,
      updatedAt: metadata.now,
      deletedAt: null,
    });
  });

  it('trims the category name', () => {
    const result = createReferenceCategory(
      {
        universeId: 'universe-1',
        name: '  Species  ',
      },
      metadata,
    );

    expect(result.name).toBe('Species');
  });

  it('uses null as the default description', () => {
    const result = createReferenceCategory(
      {
        universeId: 'universe-1',
        name: 'Species',
      },
      metadata,
    );

    expect(result.description).toBeNull();
  });

  it('throws an error when the name is empty', () => {
    expect(() =>
      createReferenceCategory(
        {
          universeId: 'universe-1',
          name: '',
        },
        metadata,
      ),
    ).toThrow(ReferenceCategoryError);
  });

  it('throws an error when the name contains only whitespace', () => {
    expect(() =>
      createReferenceCategory(
        {
          universeId: 'universe-1',
          name: '   ',
        },
        metadata,
      ),
    ).toThrow(ReferenceCategoryError);
  });
});
