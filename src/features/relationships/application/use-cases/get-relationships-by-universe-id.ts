import type { RelationshipRepository } from '../repositories/relationship-repository';

export interface GetRelationshipsByUniverseIdDependencies {
  relationshipRepository: RelationshipRepository;
}

export function createGetRelationshipsByUniverseIdUseCase(
  dependencies: GetRelationshipsByUniverseIdDependencies,
) {
  return async (universeId: string) => {
    return dependencies.relationshipRepository.findAllActiveByUniverseId(universeId);
  };
}
