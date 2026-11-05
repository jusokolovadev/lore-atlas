import type { Universe } from '../../domain/models/universe';
import type { UniverseRepository } from '../repositories/universe-repository';

export interface GetActiveUniversesDependencies {
  repository: UniverseRepository;
}

export function createGetActiveUniversesUseCase(
  dependencies: GetActiveUniversesDependencies,
): () => Promise<Universe[]> {
  return () => dependencies.repository.findAllActive();
}
