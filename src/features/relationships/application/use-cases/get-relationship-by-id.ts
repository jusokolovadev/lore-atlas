import type { RelationshipRepository } from '../repositories/relationship-repository';

export interface GetRelationshipByIdDependencies {
  relationshipRepository: RelationshipRepository;
}

export function createGetRelationshipByIdUseCase(
  dependencies: GetRelationshipByIdDependencies,
) {
  return async (id: string) => {
    return dependencies.relationshipRepository.findById(id);
  };
}
