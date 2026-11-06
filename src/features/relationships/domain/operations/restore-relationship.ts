import type { Relationship } from '../models/relationship';

export interface RestoreRelationshipInput {
  relationship: Relationship;
  restoredAt: string;
}

export function restoreRelationship(input: RestoreRelationshipInput): Relationship {
  const { relationship, restoredAt } = input;

  if (relationship.deletedAt === null) {
    throw new Error('Relationship is not deleted.');
  }

  if (!restoredAt.trim()) {
    throw new Error('Relationship restoration date cannot be empty.');
  }

  return {
    ...relationship,
    updatedAt: restoredAt,
    deletedAt: null,
    revision: relationship.revision + 1,
  };
}
