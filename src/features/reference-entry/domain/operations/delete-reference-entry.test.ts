import type { ReferenceEntry } from '../models/reference-entry';
import { deleteReferenceEntry } from './delete-reference-entry';

describe('deleteReferenceEntry', () => {
  const entry: ReferenceEntry = {
    id: 'entry-1',
    universeId: 'universe-1',
    categoryType: 'custom',
    categoryId: 'category-1',
    name: 'Elves',
    description: 'An ancient race.',
    image: {
      type: 'url',
      url: 'https://example.com/elves.png',
    },
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    deletedAt: null,
    revision: 1,
  };

  const deletedAt = '2026-01-02T10:00:00.000Z';

  it('should soft delete a reference entry', () => {
    const result = deleteReferenceEntry(entry, deletedAt);

    expect(result).toEqual({
      ...entry,
      deletedAt,
    });
  });

  it('should preserve the reference entry data', () => {
    const result = deleteReferenceEntry(entry, deletedAt);

    expect(result.id).toBe(entry.id);
    expect(result.universeId).toBe(entry.universeId);
    expect(result.categoryType).toBe(entry.categoryType);
    expect(result.categoryId).toBe(entry.categoryId);
    expect(result.name).toBe(entry.name);
    expect(result.description).toBe(entry.description);
    expect(result.image).toBe(entry.image);
    expect(result.createdAt).toBe(entry.createdAt);
    expect(result.updatedAt).toBe(entry.updatedAt);
  });

  it('should throw when deleting an already deleted entry', () => {
    const alreadyDeletedEntry = {
      ...entry,
      deletedAt,
    };

    expect(() => deleteReferenceEntry(alreadyDeletedEntry, deletedAt)).toThrow(
      expect.objectContaining({
        code: 'ALREADY_DELETED',
      }),
    );
  });

  it('should not modify the original entry', () => {
    const original = { ...entry };

    deleteReferenceEntry(entry, deletedAt);

    expect(entry).toEqual(original);
  });
});
