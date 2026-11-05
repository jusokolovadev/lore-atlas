import type { ReferenceEntry } from '../models/reference-entry';
import { updateReferenceEntry } from './update-reference-entry';

describe('updateReferenceEntry', () => {
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

  it('should update the name', () => {
    const result = updateReferenceEntry(entry, { name: 'Dwarves' });

    expect(result.name).toBe('Dwarves');
  });

  it('should trim the updated name', () => {
    const result = updateReferenceEntry(entry, { name: '  Dwarves  ' });

    expect(result.name).toBe('Dwarves');
  });

  it('should update the description', () => {
    const result = updateReferenceEntry(entry, {
      description: 'A new description.',
    });

    expect(result.description).toBe('A new description.');
  });

  it('should clear the description when null is provided', () => {
    const result = updateReferenceEntry(entry, { description: null });

    expect(result.description).toBeNull();
  });

  it('should update the image', () => {
    const image = {
      type: 'file' as const,
      fileId: 'file-1',
    };

    const result = updateReferenceEntry(entry, { image });

    expect(result.image).toEqual(image);
  });

  it('should clear the image when null is provided', () => {
    const result = updateReferenceEntry(entry, { image: null });

    expect(result.image).toBeNull();
  });

  it('should preserve fields that are not provided', () => {
    const result = updateReferenceEntry(entry, { name: 'Dwarves' });

    expect(result.description).toBe(entry.description);
    expect(result.image).toBe(entry.image);
  });

  it('should return the same reference when no changes are made', () => {
    const result = updateReferenceEntry(entry, {
      name: 'Elves',
      description: 'An ancient race.',
      image: {
        type: 'url',
        url: 'https://example.com/elves.png',
      },
    });

    expect(result).toBe(entry);
  });

  it('should return the same reference when input is empty', () => {
    const result = updateReferenceEntry(entry, {});

    expect(result).toBe(entry);
  });

  it('should throw when the updated name is empty', () => {
    expect(() => updateReferenceEntry(entry, { name: '   ' })).toThrow(
      expect.objectContaining({
        code: 'INVALID_NAME',
      }),
    );
  });

  it('should throw when updating a deleted entry', () => {
    const deletedEntry = {
      ...entry,
      deletedAt: '2026-01-02T10:00:00.000Z',
    };

    expect(() => updateReferenceEntry(deletedEntry, { name: 'Dwarves' })).toThrow(
      expect.objectContaining({
        code: 'ALREADY_DELETED',
      }),
    );
  });

  it('should not modify the original entry', () => {
    const original = { ...entry };

    updateReferenceEntry(entry, {
      name: 'Dwarves',
      description: null,
    });

    expect(entry).toEqual(original);
  });

  it('should not change immutable fields', () => {
    const result = updateReferenceEntry(entry, {
      name: 'Dwarves',
    });

    expect(result.id).toBe(entry.id);
    expect(result.universeId).toBe(entry.universeId);
    expect(result.categoryType).toBe(entry.categoryType);
    expect(result.categoryId).toBe(entry.categoryId);
    expect(result.createdAt).toBe(entry.createdAt);
  });
});
