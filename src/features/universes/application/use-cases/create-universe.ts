import { createUniverse } from '../../domain/operations/create-universe';
import type { CreateUniverseInput } from '../../domain/operations/create-universe';
import type { Universe } from '../../domain/models/universe';
import type { UniverseRepository } from '../repositories/universe-repository';

export interface CreateUniverseDependencies {
  repository: UniverseRepository;
  generateId: () => string;
  getCurrentTime: () => string;
}

export function createCreateUniverseUseCase(
  dependencies: CreateUniverseDependencies,
): (input: CreateUniverseInput) => Promise<Universe> {
  return async (input) => {
    const universe = createUniverse(input, {
      id: dependencies.generateId(),
      now: dependencies.getCurrentTime(),
    });

    await dependencies.repository.create(universe);

    return universe;
  };
}
