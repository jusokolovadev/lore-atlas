import type { RelationshipType } from '../models/relationship-type';
import { RELATIONSHIP_TYPES } from './relationship-types';

export function findRelationshipTypeById(id: string): RelationshipType | null {
  return RELATIONSHIP_TYPES.find((type) => type.id === id) ?? null;
}

export function getRelationshipTypesByGroup(
  group: RelationshipType['group'],
): RelationshipType[] {
  return RELATIONSHIP_TYPES.filter((type) => type.group === group);
}

export function getAllRelationshipTypes(): RelationshipType[] {
  return [...RELATIONSHIP_TYPES];
}
