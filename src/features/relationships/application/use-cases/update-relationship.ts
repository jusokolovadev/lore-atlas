import { updateRelationship } from '../../domain/operations/update-relationship';
import type { RelationshipRepository } from '../repositories/relationship-repository';

export interface UpdateRelationshipInput {
  id: string;
  expectedRevision: number;
  changes: {
    sourceEntityId?: string;
    targetEntityId?: string;
    typeId?: string;
    description?: string | null;
    isSpoiler?: boolean;
  };
}

export interface UpdateRelationshipDependencies {
  relationshipRepository: RelationshipRepository;
  getCurrentTime: () => string;
}

export function createUpdateRelationshipUseCase(
  dependencies: UpdateRelationshipDependencies,
) {
  return async (input: UpdateRelationshipInput) => {
    const relationship = await dependencies.relationshipRepository.findById(input.id);

    if (!relationship || relationship.deletedAt !== null) {
      throw new Error('Relationship not found or deleted.');
    }

    if (relationship.revision !== input.expectedRevision) {
      throw new Error('Relationship revision conflict.');
    }

    const updatedRelationship = updateRelationship({
      relationship,
      changes: input.changes,
      updatedAt: dependencies.getCurrentTime(),
    });

    await dependencies.relationshipRepository.update(
      updatedRelationship,
      input.expectedRevision,
    );

    return updatedRelationship;
  };
}
