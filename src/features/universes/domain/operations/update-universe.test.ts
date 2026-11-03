import { UniverseError } from '../errors/universe-error';
import type { Universe } from '../models/universe';
import { updateUniverse } from './update-universe';

describe('updateUniverse', () => {
  const universe: Universe = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Middle-earth',
    description: 'A fictional world',
    coverImage: {
      type: 'url',
      url: 'https://example.com/cover.jpg',
    },
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
    deletedAt: null,
  };

  it('should update the name', () => {
    const result = updateUniverse(universe, {
      name: '  Arda  ',
    });

    expect(result.name).toBe('Arda');
    expect(result.description).toBe(universe.description);
    expect(result.coverImage).toEqual(universe.coverImage);
  });

  it('should update the description', () => {
    const result = updateUniverse(universe, {
      description: 'A new description',
    });

    expect(result.description).toBe('A new description');
    expect(result.name).toBe(universe.name);
  });

  it('should update the cover image', () => {
    const newCoverImage = {
      type: 'file' as const,
      fileId: 'file-123',
    };

    const result = updateUniverse(universe, {
      coverImage: newCoverImage,
    });

    expect(result.coverImage).toEqual(newCoverImage);
  });

  it('should allow clearing optional fields', () => {
    const result = updateUniverse(universe, {
      description: null,
      coverImage: null,
    });

    expect(result.description).toBeNull();
    expect(result.coverImage).toBeNull();
  });

  it('should preserve immutable fields', () => {
    const result = updateUniverse(universe, {
      name: 'Arda',
    });

    expect(result.id).toBe(universe.id);
    expect(result.createdAt).toBe(universe.createdAt);
    expect(result.updatedAt).toBe(universe.updatedAt);
    expect(result.deletedAt).toBe(universe.deletedAt);
  });

  it('should not mutate the original universe', () => {
    const result = updateUniverse(universe, {
      name: 'Arda',
    });

    expect(universe.name).toBe('Middle-earth');
    expect(result).not.toBe(universe);
  });

  it('should reject an empty name', () => {
    expect(() => updateUniverse(universe, { name: '   ' })).toThrow(UniverseError);

    expect(() => updateUniverse(universe, { name: '   ' })).toThrow(
      'Universe name cannot be empty.',
    );
  });

  it('should reject updating a deleted universe', () => {
    const deletedUniverse: Universe = {
      ...universe,
      deletedAt: '2026-11-02T10:00:00.000Z',
    };

    expect(() => updateUniverse(deletedUniverse, { name: 'Arda' })).toThrow(
      UniverseError,
    );
  });

  it('should return the original universe when input is empty', () => {
    const result = updateUniverse(universe, {});

    expect(result).toBe(universe);
  });

  it('should return the original universe when values are unchanged', () => {
    const result = updateUniverse(universe, {
      name: '  Middle-earth  ',
      description: 'A fictional world',
      coverImage: {
        type: 'url',
        url: 'https://example.com/cover.jpg',
      },
    });

    expect(result).toBe(universe);
  });

  it('should return a new universe when values change', () => {
    const result = updateUniverse(universe, {
      name: 'Arda',
    });

    expect(result).not.toBe(universe);
  });
});
