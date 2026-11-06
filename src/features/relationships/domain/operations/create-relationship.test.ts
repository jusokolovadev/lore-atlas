import { createRelationship } from './create-relationship';

describe('createRelationship', () => {
  const baseInput = {
    id: 'relationship-1',
    universeId: 'universe-1',
    sourceEntityId: 'entity-1',
    targetEntityId: 'entity-2',
    typeId: 'parent-of',
    createdAt: '2026-11-06T08:00:00.000Z',
  };

  it('creates a relationship with default values', () => {
    const relationship = createRelationship(baseInput);

    expect(relationship).toEqual({
      id: 'relationship-1',
      universeId: 'universe-1',
      sourceEntityId: 'entity-1',
      targetEntityId: 'entity-2',
      typeId: 'parent-of',
      description: null,
      isSpoiler: false,
      createdAt: baseInput.createdAt,
      updatedAt: baseInput.createdAt,
      deletedAt: null,
      revision: 1,
    });
  });

  it('normalizes participants for an undirected relationship', () => {
    const relationship = createRelationship({
      ...baseInput,
      sourceEntityId: 'entity-2',
      targetEntityId: 'entity-1',
      typeId: 'friend-of',
    });

    expect(relationship.sourceEntityId).toBe('entity-1');
    expect(relationship.targetEntityId).toBe('entity-2');
  });

  it('preserves participant order for a directed relationship', () => {
    const relationship = createRelationship({
      ...baseInput,
      sourceEntityId: 'entity-2',
      targetEntityId: 'entity-1',
    });

    expect(relationship.sourceEntityId).toBe('entity-2');
    expect(relationship.targetEntityId).toBe('entity-1');
  });

  it('trims the description', () => {
    const relationship = createRelationship({
      ...baseInput,
      description: '  Childhood friends  ',
    });

    expect(relationship.description).toBe('Childhood friends');
  });

  it('converts an empty description to null', () => {
    const relationship = createRelationship({
      ...baseInput,
      description: '   ',
    });

    expect(relationship.description).toBeNull();
  });

  it('preserves the spoiler flag', () => {
    const relationship = createRelationship({
      ...baseInput,
      isSpoiler: true,
    });

    expect(relationship.isSpoiler).toBe(true);
  });

  it('throws when the relationship type does not exist', () => {
    expect(() =>
      createRelationship({
        ...baseInput,
        typeId: 'unknown-type',
      }),
    ).toThrow('Relationship type not found.');
  });

  it('throws when participants are identical', () => {
    expect(() =>
      createRelationship({
        ...baseInput,
        targetEntityId: 'entity-1',
      }),
    ).toThrow('Relationship participants are invalid.');
  });

  it('throws when the source participant is empty', () => {
    expect(() =>
      createRelationship({
        ...baseInput,
        sourceEntityId: ' ',
      }),
    ).toThrow('Relationship participants are invalid.');
  });

  it('throws when the target participant is empty', () => {
    expect(() =>
      createRelationship({
        ...baseInput,
        targetEntityId: '',
      }),
    ).toThrow('Relationship participants are invalid.');
  });

  it('throws when the relationship ID is empty', () => {
    expect(() =>
      createRelationship({
        ...baseInput,
        id: ' ',
      }),
    ).toThrow('Relationship ID cannot be empty.');
  });

  it('throws when the universe ID is empty', () => {
    expect(() =>
      createRelationship({
        ...baseInput,
        universeId: '',
      }),
    ).toThrow('Universe ID cannot be empty.');
  });

  it('throws when the creation date is empty', () => {
    expect(() =>
      createRelationship({
        ...baseInput,
        createdAt: ' ',
      }),
    ).toThrow('Relationship creation date cannot be empty.');
  });
});
