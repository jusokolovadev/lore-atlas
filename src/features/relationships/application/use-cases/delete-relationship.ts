import type { RelationshipDeletionRepository } from '../repositories/relationship-deletion-repository';

export interface DeleteRelationshipInput {
  id: string;
  expectedRevision: number;
}

export interface DeleteRelationshipDependencies {
  relationshipDeletionRepository: RelationshipDeletionRepository;
  getCurrentTime: () => string;
}

export function createDeleteRelationshipUseCase(
  dependencies: DeleteRelationshipDependencies,
) {
  return async (input: DeleteRelationshipInput): Promise<void> => {
    const deletedAt = dependencies.getCurrentTime();

    await dependencies.relationshipDeletionRepository.deleteRelationship(
      input.id,
      input.expectedRevision,
      deletedAt,
    );
  };
}
