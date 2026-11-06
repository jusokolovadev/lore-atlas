export interface RelationshipParticipants {
  sourceEntityId: string;
  targetEntityId: string;
}

export function normalizeRelationshipParticipants(
  sourceEntityId: string,
  targetEntityId: string,
  direction: 'directed' | 'undirected',
): RelationshipParticipants {
  if (direction === 'directed') {
    return {
      sourceEntityId,
      targetEntityId,
    };
  }

  return sourceEntityId.localeCompare(targetEntityId) <= 0
    ? { sourceEntityId, targetEntityId }
    : {
        sourceEntityId: targetEntityId,
        targetEntityId: sourceEntityId,
      };
}
