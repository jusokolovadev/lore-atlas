import type { Universe } from '../../domain/models/universe';
import type { UniverseRepository } from '../repositories/universe-repository';

export interface GetUniverseByIdDependencies {
  repository: UniverseRepository;
}

export function createGetUniverseByIdUseCase(
  dependencies: GetUniverseByIdDependencies,
): (id: string) => Promise<Universe | null> {
  return (id) => dependencies.repository.findById(id);
}
