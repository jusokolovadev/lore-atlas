import type { RelationshipType } from '../models/relationship-type';

export function isRelationshipTypeDirectionCompatible(
  currentType: RelationshipType,
  nextType: RelationshipType,
): boolean {
  return currentType.direction === nextType.direction;
}
