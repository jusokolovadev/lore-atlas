import type { Universe } from '../../domain/models/universe';

export interface UniverseRepository {
  findById(id: string): Promise<Universe | null>;

  findAllActive(): Promise<Universe[]>;

  save(universe: Universe): Promise<void>;
}
