import { restoreRelationship } from '../../domain/operations/restore-relationship';
import type { RelationshipRepository } from '../repositories/relationship-repository';

export interface RestoreRelationshipInput {
  id: string;
  expectedRevision: number;
}

export interface RestoreRelationshipDependencies {
  relationshipRepository: RelationshipRepository;
  getCurrentTime: () => string;
}

export function createRestoreRelationshipUseCase(
  dependencies: RestoreRelationshipDependencies,
) {
  return async (input: RestoreRelationshipInput) => {
    const relationship = await dependencies.relationshipRepository.findById(input.id);

    if (!relationship) {
      throw new Error('Relationship not found.');
    }

    if (relationship.deletedAt === null) {
      throw new Error('Relationship is not deleted.');
    }

    if (relationship.revision !== input.expectedRevision) {
      throw new Error('Relationship revision conflict.');
    }

    const restoredRelationship = restoreRelationship({
      relationship,
      restoredAt: dependencies.getCurrentTime(),
    });

    await dependencies.relationshipRepository.restore(
      restoredRelationship,
      input.expectedRevision,
    );

    return restoredRelationship;
  };
}
