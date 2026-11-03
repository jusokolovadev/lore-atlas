import { UniverseError } from '../errors/universe-error';
import type { Universe } from '../models/universe';
import { deleteUniverse } from './delete-universe';

describe('deleteUniverse', () => {
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

  it('should set deletedAt', () => {
    const deletedAt = '2026-11-03T10:00:00.000Z';

    const result = deleteUniverse(universe, deletedAt);

    expect(result.deletedAt).toBe(deletedAt);
  });

  it('should preserve other fields', () => {
    const result = deleteUniverse(universe, '2026-11-03T10:00:00.000Z');

    expect(result.id).toBe(universe.id);
    expect(result.name).toBe(universe.name);
    expect(result.description).toBe(universe.description);
    expect(result.coverImage).toEqual(universe.coverImage);
    expect(result.createdAt).toBe(universe.createdAt);
    expect(result.updatedAt).toBe(universe.updatedAt);
  });

  it('should not mutate the original universe', () => {
    const result = deleteUniverse(universe, '2026-11-03T10:00:00.000Z');

    expect(universe.deletedAt).toBeNull();
    expect(result).not.toBe(universe);
  });

  it('should reject deleting an already deleted universe', () => {
    const deletedUniverse: Universe = {
      ...universe,
      deletedAt: '2026-11-02T10:00:00.000Z',
    };

    expect(() => deleteUniverse(deletedUniverse, '2026-11-03T10:00:00.000Z')).toThrow(
      UniverseError,
    );

    expect(() => deleteUniverse(deletedUniverse, '2026-11-03T10:00:00.000Z')).toThrow(
      'Universe has already been deleted.',
    );
  });
});
