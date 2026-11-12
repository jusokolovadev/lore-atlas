import type { Relationship } from '../models/relationship';
import { findRelationshipTypeById } from '../catalog/relationship-type-catalog';
import { areRelationshipParticipantsValid } from '../utils/are-relationship-participants-valid';
import { normalizeRelationshipParticipants } from '../utils/normalize-relationship-participants';

export interface CreateRelationshipInput {
  id: string;
  universeId: string;
  sourceEntityId: string;
  targetEntityId: string;
  typeId: string;
  description?: string | null;
  isSpoiler?: boolean;
  createdAt: string;
}

export function createRelationship(input: CreateRelationshipInput): Relationship {
  const relationshipType = findRelationshipTypeById(input.typeId);

  if (!relationshipType) {
    throw new Error('Relationship type not found.');
  }

  if (!areRelationshipParticipantsValid(input.sourceEntityId, input.targetEntityId)) {
    throw new Error('Relationship participants are invalid.');
  }

  if (!input.id.trim()) {
    throw new Error('Relationship ID cannot be empty.');
  }

  if (!input.universeId.trim()) {
    throw new Error('Universe ID cannot be empty.');
  }

  if (!input.createdAt.trim()) {
    throw new Error('Relationship creation date cannot be empty.');
  }

  const participants = normalizeRelationshipParticipants(
    input.sourceEntityId,
    input.targetEntityId,
    relationshipType.direction,
  );

  return {
    id: input.id,
    universeId: input.universeId,
    sourceEntityId: participants.sourceEntityId,
    targetEntityId: participants.targetEntityId,
    typeId: input.typeId,
    description: input.description?.trim() || null,
    isSpoiler: input.isSpoiler ?? false,
    createdAt: input.createdAt,
    updatedAt: input.createdAt,
    deletedAt: null,
    revision: 1,
  };
}
