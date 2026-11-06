import type { Relationship } from '../models/relationship';
import { findRelationshipTypeById } from '../catalog/relationship-type-catalog';
import { areRelationshipParticipantsValid } from '../utils/are-relationship-participants-valid';
import { isRelationshipTypeDirectionCompatible } from '../utils/is-relationship-type-direction-compatible';
import { normalizeRelationshipParticipants } from '../utils/normalize-relationship-participants';

export interface UpdateRelationshipChanges {
  sourceEntityId?: string;
  targetEntityId?: string;
  typeId?: string;
  description?: string | null;
  isSpoiler?: boolean;
}

export interface UpdateRelationshipInput {
  relationship: Relationship;
  changes: UpdateRelationshipChanges;
  updatedAt: string;
}

export function updateRelationship(input: UpdateRelationshipInput): Relationship {
  const { relationship, changes, updatedAt } = input;

  if (relationship.deletedAt !== null) {
    throw new Error('Relationship is deleted.');
  }

  if (!updatedAt.trim()) {
    throw new Error('Relationship update date cannot be empty.');
  }

  const currentType = findRelationshipTypeById(relationship.typeId);

  if (!currentType) {
    throw new Error('Current relationship type not found.');
  }

  const nextTypeId = changes.typeId ?? relationship.typeId;
  const nextType = findRelationshipTypeById(nextTypeId);

  if (!nextType) {
    throw new Error('Relationship type not found.');
  }

  if (!isRelationshipTypeDirectionCompatible(currentType, nextType)) {
    throw new Error('Relationship direction cannot be changed.');
  }

  const sourceEntityId = changes.sourceEntityId ?? relationship.sourceEntityId;
  const targetEntityId = changes.targetEntityId ?? relationship.targetEntityId;

  if (!areRelationshipParticipantsValid(sourceEntityId, targetEntityId)) {
    throw new Error('Relationship participants are invalid.');
  }

  const participants = normalizeRelationshipParticipants(
    sourceEntityId,
    targetEntityId,
    nextType.direction,
  );

  return {
    ...relationship,
    sourceEntityId: participants.sourceEntityId,
    targetEntityId: participants.targetEntityId,
    typeId: nextTypeId,
    description:
      changes.description === undefined
        ? relationship.description
        : changes.description?.trim() || null,
    isSpoiler: changes.isSpoiler ?? relationship.isSpoiler,
    updatedAt,
    revision: relationship.revision + 1,
  };
}
