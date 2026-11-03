import { updateUniverse } from '../../domain/models/update-universe';
import type { UpdateUniverseInput } from '../../domain/models/update-universe';
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
    };

    await dependencies.repository.save(result);

    return result;
  };
}
