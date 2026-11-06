export function areRelationshipParticipantsValid(
  sourceEntityId: string,
  targetEntityId: string,
): boolean {
  return (
    sourceEntityId.trim().length > 0 &&
    targetEntityId.trim().length > 0 &&
    sourceEntityId !== targetEntityId
  );
}
