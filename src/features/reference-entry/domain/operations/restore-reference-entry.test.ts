import type { ReferenceEntry } from '../models/reference-entry';
import { restoreReferenceEntry } from './restore-reference-entry';

describe('restoreReferenceEntry', () => {
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
    updatedAt: '2026-01-02T10:00:00.000Z',
    deletedAt: '2026-01-02T10:00:00.000Z',
    revision: 1,
  };

  it('should restore a deleted reference entry', () => {
    const result = restoreReferenceEntry(entry);

    expect(result).toEqual({
      ...entry,
      deletedAt: null,
    });
  });

  it('should preserve the reference entry data', () => {
    const result = restoreReferenceEntry(entry);

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

  it('should throw when restoring an active entry', () => {
    const activeEntry = {
      ...entry,
      deletedAt: null,
    };

    expect(() => restoreReferenceEntry(activeEntry)).toThrow(
      expect.objectContaining({
        code: 'NOT_DELETED',
      }),
    );
  });

  it('should not modify the original entry', () => {
    const original = { ...entry };

    restoreReferenceEntry(entry);

    expect(entry).toEqual(original);
  });
});
