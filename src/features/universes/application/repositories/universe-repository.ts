import type { Universe } from '../../domain/models/universe';

export interface UniverseRepository {
  findById(id: string): Promise<Universe | null>;

  findAllActive(): Promise<Universe[]>;

  create(universe: Universe): Promise<void>;

  update(universe: Universe, expectedRevision: number): Promise<void>;

  restore(universe: Universe, expectedRevision: number): Promise<void>;
}
