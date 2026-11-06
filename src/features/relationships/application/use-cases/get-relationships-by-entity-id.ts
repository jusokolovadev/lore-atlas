import type { RelationshipRepository } from '../repositories/relationship-repository';

export interface GetRelationshipsByEntityIdDependencies {
  relationshipRepository: RelationshipRepository;
}

export function createGetRelationshipsByEntityIdUseCase(
  dependencies: GetRelationshipsByEntityIdDependencies,
) {
  return async (universeId: string, entityId: string) => {
    return dependencies.relationshipRepository.findAllActiveByEntityId(
      universeId,
      entityId,
    );
  };
}
