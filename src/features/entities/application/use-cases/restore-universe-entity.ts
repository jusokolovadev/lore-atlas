import type { UniverseEntity } from '../../domain/models/universe-entity';
import type { UniverseEntityRepository } from '../repositories/universe-entity-repository';

export interface RestoreUniverseEntityInput {
  id: string;
  expectedRevision: number;
}

export interface RestoreUniverseEntityDependencies {
  universeEntityRepository: UniverseEntityRepository;
  getCurrentTime: () => string;
}

export function createRestoreUniverseEntityUseCase(
  dependencies: RestoreUniverseEntityDependencies,
): (input: RestoreUniverseEntityInput) => Promise<UniverseEntity> {
  return async (input) => {
    const entity = await dependencies.universeEntityRepository.findById(input.id);

    if (!entity) {
      throw new Error('Entity not found.');
    }

    if (entity.deletedAt === null) {
      throw new Error('Entity is not deleted.');
    }

    if (entity.revision !== input.expectedRevision) {
      throw new Error('Entity revision conflict.');
    }

    const now = dependencies.getCurrentTime();

    const restoredEntity: UniverseEntity = {
      ...entity,
      deletedAt: null,
      updatedAt: now,
      revision: entity.revision + 1,
    };

    await dependencies.universeEntityRepository.restore(
      restoredEntity,
      input.expectedRevision,
    );

    return restoredEntity;
  };
}
