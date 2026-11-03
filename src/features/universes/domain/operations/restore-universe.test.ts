import { UniverseError } from '../errors/universe-error';
import type { Universe } from '../models/universe';
import { restoreUniverse } from './restore-universe';

describe('restoreUniverse', () => {
  const deletedUniverse: Universe = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Middle-earth',
    description: 'A fictional world',
    coverImage: {
      type: 'url',
      url: 'https://example.com/cover.jpg',
    },
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-02T10:00:00.000Z',
    deletedAt: '2026-11-02T10:00:00.000Z',
  };

  it('should restore a deleted universe', () => {
    const result = restoreUniverse(deletedUniverse);

    expect(result.deletedAt).toBeNull();
  });

  it('should preserve other fields', () => {
    const result = restoreUniverse(deletedUniverse);

    expect(result.id).toBe(deletedUniverse.id);
    expect(result.name).toBe(deletedUniverse.name);
    expect(result.description).toBe(deletedUniverse.description);
    expect(result.coverImage).toEqual(deletedUniverse.coverImage);
    expect(result.createdAt).toBe(deletedUniverse.createdAt);
    expect(result.updatedAt).toBe(deletedUniverse.updatedAt);
  });

  it('should not mutate the original universe', () => {
    const result = restoreUniverse(deletedUniverse);

    expect(deletedUniverse.deletedAt).not.toBeNull();
    expect(result).not.toBe(deletedUniverse);
  });

  it('should reject restoring an active universe', () => {
    const activeUniverse: Universe = {
      ...deletedUniverse,
      deletedAt: null,
    };

    expect(() => restoreUniverse(activeUniverse)).toThrow(UniverseError);

    expect(() => restoreUniverse(activeUniverse)).toThrow(
      'Universe has not been deleted.',
    );
  });
});
