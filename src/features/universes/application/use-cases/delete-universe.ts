import { UniverseError } from '../../domain/errors/universe-error';
import { deleteUniverse } from '../../domain/models/delete-universe';
import type { UniverseRepository } from '../repositories/universe-repository';

export interface DeleteUniverseDependencies {
  repository: UniverseRepository;
  getCurrentTime: () => string;
}

export function createDeleteUniverseUseCase(
  dependencies: DeleteUniverseDependencies,
): (id: string) => Promise<void> {
  return async (id) => {
    const universe = await dependencies.repository.findById(id);

    if (!universe) {
      throw new UniverseError('NOT_FOUND', 'Universe not found.');
    }

    const now = dependencies.getCurrentTime();

    const deletedUniverse = deleteUniverse(universe, now);

    const result = {
      ...deletedUniverse,
      updatedAt: now,
    };

    await dependencies.repository.save(result);
  };
}
