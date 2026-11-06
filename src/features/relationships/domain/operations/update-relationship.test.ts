import type { Relationship } from '../models/relationship';
import { updateRelationship } from './update-relationship';

describe('updateRelationship', () => {
  const currentRelationship: Relationship = {
    id: 'relationship-1',
    universeId: 'universe-1',
    sourceEntityId: 'entity-1',
    targetEntityId: 'entity-2',
    typeId: 'parent-of',
    description: null,
    isSpoiler: false,
    createdAt: '2026-11-05T10:00:00.000Z',
    updatedAt: '2026-11-05T10:00:00.000Z',
    deletedAt: null,
    revision: 1,
  };

  const updatedAt = '2026-11-06T08:00:00.000Z';

  it('updates the relationship description', () => {
    const result = updateRelationship({
      relationship: currentRelationship,
      changes: { description: '  Biological parent  ' },
      updatedAt,
    });

    expect(result.description).toBe('Biological parent');
    expect(result.revision).toBe(2);
    expect(result.updatedAt).toBe(updatedAt);
  });

  it('preserves fields that were not changed', () => {
    const result = updateRelationship({
      relationship: currentRelationship,
      changes: { description: 'Parent' },
      updatedAt,
    });

    expect(result.sourceEntityId).toBe('entity-1');
    expect(result.targetEntityId).toBe('entity-2');
    expect(result.typeId).toBe('parent-of');
    expect(result.isSpoiler).toBe(false);
    expect(result.universeId).toBe('universe-1');
    expect(result.createdAt).toBe(currentRelationship.createdAt);
  });

  it('allows changing one directed type to another directed type', () => {
    const result = updateRelationship({
      relationship: currentRelationship,
      changes: { typeId: 'caused' },
      updatedAt,
    });

    expect(result.typeId).toBe('caused');
  });

  it('allows changing one undirected type to another undirected type', () => {
    const undirectedRelationship: Relationship = {
      ...currentRelationship,
      typeId: 'friend-of',
    };

    const result = updateRelationship({
      relationship: undirectedRelationship,
      changes: { typeId: 'rival-of' },
      updatedAt,
    });

    expect(result.typeId).toBe('rival-of');
  });

  it('rejects changing relationship direction', () => {
    expect(() =>
      updateRelationship({
        relationship: currentRelationship,
        changes: { typeId: 'friend-of' },
        updatedAt,
      }),
    ).toThrow('Relationship direction cannot be changed.');
  });

  it('normalizes participants when changing to an undirected type', () => {
    const undirectedRelationship: Relationship = {
      ...currentRelationship,
      typeId: 'friend-of',
    };

    const result = updateRelationship({
      relationship: undirectedRelationship,
      changes: {
        sourceEntityId: 'entity-2',
        targetEntityId: 'entity-1',
      },
      updatedAt,
    });

    expect(result.sourceEntityId).toBe('entity-1');
    expect(result.targetEntityId).toBe('entity-2');
  });

  it('preserves participant order for directed relationships', () => {
    const result = updateRelationship({
      relationship: currentRelationship,
      changes: {
        sourceEntityId: 'entity-3',
        targetEntityId: 'entity-1',
      },
      updatedAt,
    });

    expect(result.sourceEntityId).toBe('entity-3');
    expect(result.targetEntityId).toBe('entity-1');
  });

  it('rejects identical participants', () => {
    expect(() =>
      updateRelationship({
        relationship: currentRelationship,
        changes: { targetEntityId: 'entity-1' },
        updatedAt,
      }),
    ).toThrow('Relationship participants are invalid.');
  });

  it('converts an empty description to null', () => {
    const result = updateRelationship({
      relationship: currentRelationship,
      changes: { description: '   ' },
      updatedAt,
    });

    expect(result.description).toBeNull();
  });

  it('allows clearing the spoiler flag', () => {
    const result = updateRelationship({
      relationship: {
        ...currentRelationship,
        isSpoiler: true,
      },
      changes: { isSpoiler: false },
      updatedAt,
    });

    expect(result.isSpoiler).toBe(false);
  });

  it('rejects updating a deleted relationship', () => {
    expect(() =>
      updateRelationship({
        relationship: {
          ...currentRelationship,
          deletedAt: updatedAt,
        },
        changes: { description: 'Updated' },
        updatedAt,
      }),
    ).toThrow('Relationship is deleted.');
  });

  it('rejects an unknown current relationship type', () => {
    expect(() =>
      updateRelationship({
        relationship: {
          ...currentRelationship,
          typeId: 'unknown-current-type',
        },
        changes: { description: 'Updated' },
        updatedAt,
      }),
    ).toThrow('Current relationship type not found.');
  });

  it('rejects an unknown next relationship type', () => {
    expect(() =>
      updateRelationship({
        relationship: currentRelationship,
        changes: { typeId: 'unknown-next-type' },
        updatedAt,
      }),
    ).toThrow('Relationship type not found.');
  });

  it('rejects an empty update date', () => {
    expect(() =>
      updateRelationship({
        relationship: currentRelationship,
        changes: { description: 'Updated' },
        updatedAt: ' ',
      }),
    ).toThrow('Relationship update date cannot be empty.');
  });

  it('does not mutate the original relationship', () => {
    const original = { ...currentRelationship };

    updateRelationship({
      relationship: currentRelationship,
      changes: { description: 'Updated' },
      updatedAt,
    });

    expect(currentRelationship).toEqual(original);
  });
});
