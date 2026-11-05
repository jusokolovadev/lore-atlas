import { disableStandardReferenceCategory } from './disable-standard-reference-category';

import type { Universe } from 'src/features/universes/domain/models/universe';

describe('disableStandardReferenceCategory', () => {
  const universe: Universe = {
    id: 'test-universe-id',
    name: 'Test Universe',
    description: null,
    coverImage: null,
    createdAt: '2026-11-05T10:00:00.000Z',
    updatedAt: '2026-11-05T10:00:00.000Z',
    deletedAt: null,
    revision: 1,
    enabledStandardCategoryIds: ['species', 'titles'],
  };

  it('throws when trying to disable a Core category', () => {
    expect(() => disableStandardReferenceCategory(universe, 'species')).toThrow(
      expect.objectContaining({
        code: 'CORE_CATEGORY_CANNOT_BE_DISABLED',
      }),
    );
  });

  it('throws when the category does not exist', () => {
    expect(() => disableStandardReferenceCategory(universe, 'unknown-category')).toThrow(
      expect.objectContaining({
        code: 'CATEGORY_NOT_FOUND',
      }),
    );
  });
});
