import type { Relationship } from '../models/relationship';
import { restoreRelationship } from './restore-relationship';

describe('restoreRelationship', () => {
  const deletedAt = '2026-11-05T12:00:00.000Z';
  const restoredAt = '2026-11-06T08:00:00.000Z';

  const deletedRelationship: Relationship = {
    id: 'relationship-1',
    universeId: 'universe-1',
    sourceEntityId: 'entity-1',
    targetEntityId: 'entity-2',
    typeId: 'parent-of',
    description: 'Biological parent',
    isSpoiler: false,
    createdAt: '2026-11-05T10:00:00.000Z',
    updatedAt: deletedAt,
    deletedAt,
    revision: 2,
  };

  it('restores a deleted relationship', () => {
    const result = restoreRelationship({
      relationship: deletedRelationship,
      restoredAt,
    });

    expect(result).toEqual({
      ...deletedRelationship,
      updatedAt: restoredAt,
      deletedAt: null,
      revision: 3,
    });
  });

  it('preserves all relationship data', () => {
    const result = restoreRelationship({
      relationship: deletedRelationship,
      restoredAt,
    });

    expect(result.id).toBe(deletedRelationship.id);
    expect(result.universeId).toBe(deletedRelationship.universeId);
    expect(result.sourceEntityId).toBe(deletedRelationship.sourceEntityId);
    expect(result.targetEntityId).toBe(deletedRelationship.targetEntityId);
    expect(result.typeId).toBe(deletedRelationship.typeId);
    expect(result.description).toBe(deletedRelationship.description);
    expect(result.isSpoiler).toBe(deletedRelationship.isSpoiler);
    expect(result.createdAt).toBe(deletedRelationship.createdAt);
  });

  it('throws when the relationship is not deleted', () => {
    expect(() =>
      restoreRelationship({
        relationship: {
          ...deletedRelationship,
          deletedAt: null,
        },
        restoredAt,
      }),
    ).toThrow('Relationship is not deleted.');
  });

  it('throws when the restoration date is empty', () => {
    expect(() =>
      restoreRelationship({
        relationship: deletedRelationship,
        restoredAt: ' ',
      }),
    ).toThrow('Relationship restoration date cannot be empty.');
  });

  it('does not mutate the original relationship', () => {
    const original = { ...deletedRelationship };

    restoreRelationship({
      relationship: deletedRelationship,
      restoredAt,
    });

    expect(deletedRelationship).toEqual(original);
  });
});
