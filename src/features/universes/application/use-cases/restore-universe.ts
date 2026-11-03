import { UniverseError } from '../../domain/errors/universe-error';
import { restoreUniverse } from '../../domain/models/restore-universe';
import type { UniverseRepository } from '../repositories/universe-repository';

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
    const now = dependencies.getCurrentTime();

    const result = {
      ...restoredUniverse,
      updatedAt: now,
    };

    await dependencies.repository.save(result);
  };
}
