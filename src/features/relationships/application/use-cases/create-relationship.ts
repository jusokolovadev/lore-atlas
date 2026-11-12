import { createRelationship } from '../../domain/operations/create-relationship';
import type { RelationshipRepository } from '../repositories/relationship-repository';

export interface CreateRelationshipInput {
  universeId: string;
  sourceEntityId: string;
  targetEntityId: string;
  typeId: string;
  description?: string | null;
  isSpoiler?: boolean;
}

export interface CreateRelationshipDependencies {
  relationshipRepository: RelationshipRepository;
  generateId: () => string;
  getCurrentTime: () => string;
}

export function createCreateRelationshipUseCase(
  dependencies: CreateRelationshipDependencies,
) {
  return async (input: CreateRelationshipInput) => {
    const relationship = createRelationship({
      ...input,
      id: dependencies.generateId(),
      createdAt: dependencies.getCurrentTime(),
    });

    const result =
      await dependencies.relationshipRepository.createIfParticipantsAvailable(
        relationship,
      );

    if (result === 'participants-unavailable') {
      throw new Error('Relationship participants not found or deleted.');
    }

    if (result === 'already-exists') {
      throw new Error('Relationship already exists.');
    }

    return relationship;
  };
}
