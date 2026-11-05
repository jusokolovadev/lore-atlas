import { updateUniverse } from '../../domain/operations/update-universe';
import type { UpdateUniverseInput } from '../../domain/operations/update-universe';
import type { Universe } from '../../domain/models/universe';
import type { UniverseRepository } from '../repositories/universe-repository';
import { UniverseError } from '../../domain/errors/universe-error';

export interface UpdateUniverseDependencies {
  repository: UniverseRepository;
  getCurrentTime: () => string;
}

export function createUpdateUniverseUseCase(
  dependencies: UpdateUniverseDependencies,
): (id: string, input: UpdateUniverseInput) => Promise<Universe> {
  return async (id, input) => {
    const universe = await dependencies.repository.findById(id);

    if (!universe) {
      throw new UniverseError('NOT_FOUND', 'Universe not found.');
    }

    const updatedUniverse = updateUniverse(universe, input);

    if (updatedUniverse === universe) {
      return universe;
    }

    const result: Universe = {
      ...updatedUniverse,
      updatedAt: dependencies.getCurrentTime(),
      revision: universe.revision + 1,
    };

    await dependencies.repository.update(result, universe.revision);

    return result;
  };
}
