import { UniverseError } from '../../domain/errors/universe-error';
import { restoreUniverse } from '../../domain/operations/restore-universe';
import type { UniverseRepository } from '../repositories/universe-repository';
import type { Universe } from '../../domain/models/universe';

export interface RestoreUniverseDependencies {
  repository: UniverseRepository;
  getCurrentTime: () => string;
}

export function createRestoreUniverseUseCase(
  dependencies: RestoreUniverseDependencies,
): (id: string) => Promise<void> {
  return async (id) => {
    const universe = await dependencies.repository.findById(id);

    if (!universe) {
      throw new UniverseError('NOT_FOUND', 'Universe not found.');
    }

    const restoredUniverse = restoreUniverse(universe);

    const result: Universe = {
      ...restoredUniverse,
      updatedAt: dependencies.getCurrentTime(),
      revision: universe.revision + 1,
    };

    await dependencies.repository.restore(result, universe.revision);
  };
}
