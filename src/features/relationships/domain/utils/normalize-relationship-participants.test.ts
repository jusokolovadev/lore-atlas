import { normalizeRelationshipParticipants } from './normalize-relationship-participants';

describe('normalizeRelationshipParticipants', () => {
  it('preserves participant order for directed relationships', () => {
    expect(normalizeRelationshipParticipants('entity-b', 'entity-a', 'directed')).toEqual(
      {
        sourceEntityId: 'entity-b',
        targetEntityId: 'entity-a',
      },
    );
  });

  it('sorts participant IDs for undirected relationships', () => {
    expect(
      normalizeRelationshipParticipants('entity-b', 'entity-a', 'undirected'),
    ).toEqual({
      sourceEntityId: 'entity-a',
      targetEntityId: 'entity-b',
    });
  });

  it('preserves participant order when already normalized', () => {
    expect(
      normalizeRelationshipParticipants('entity-a', 'entity-b', 'undirected'),
    ).toEqual({
      sourceEntityId: 'entity-a',
      targetEntityId: 'entity-b',
    });
  });

  it('handles identical participant IDs', () => {
    expect(
      normalizeRelationshipParticipants('entity-a', 'entity-a', 'undirected'),
    ).toEqual({
      sourceEntityId: 'entity-a',
      targetEntityId: 'entity-a',
    });
  });
});
