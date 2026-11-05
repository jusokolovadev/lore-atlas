import type { EntityDeletionRepository } from '../repositories/entity-deletion-repository';

export interface DeleteUniverseEntityInput {
  id: string;
  expectedRevision: number;
}

export interface DeleteUniverseEntityDependencies {
  entityDeletionRepository: EntityDeletionRepository;
  getCurrentTime: () => string;
}

export function createDeleteUniverseEntityUseCase(
  dependencies: DeleteUniverseEntityDependencies,
): (input: DeleteUniverseEntityInput) => Promise<void> {
  return async (input) => {
    await dependencies.entityDeletionRepository.deleteEntity(
      input.id,
      input.expectedRevision,
      dependencies.getCurrentTime(),
    );
  };
}
