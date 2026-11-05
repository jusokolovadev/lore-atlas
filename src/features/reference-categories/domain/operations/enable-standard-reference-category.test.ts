import { enableStandardReferenceCategory } from './enable-standard-reference-category';

import type { Universe } from 'src/features/universes/domain/models/universe';

describe('enableStandardReferenceCategory', () => {
  const universe: Universe = {
    id: 'test-universe-id',
    name: 'Test Universe',
    description: null,
    coverImage: null,
    createdAt: '2026-11-05T10:00:00.000Z',
    updatedAt: '2026-11-05T10:00:00.000Z',
    deletedAt: null,
    revision: 1,
    enabledStandardCategoryIds: ['species'],
  };

  it('enables a standard category', () => {
    const result = enableStandardReferenceCategory(universe, 'titles');

    expect(result).toEqual({
      ...universe,
      enabledStandardCategoryIds: ['species', 'titles'],
    });

    expect(result).not.toBe(universe);
  });

  it('returns the same universe when the category is already enabled', () => {
    const result = enableStandardReferenceCategory(universe, 'species');

    expect(result).toBe(universe);
  });

  it('throws when the category does not exist', () => {
    expect(() => enableStandardReferenceCategory(universe, 'unknown-category')).toThrow(
      expect.objectContaining({
        code: 'CATEGORY_NOT_FOUND',
      }),
    );
  });
});
