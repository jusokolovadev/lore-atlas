import { UniverseError } from '../errors/universe-error';
import type { Universe } from '../models/universe';

export function deleteUniverse(universe: Universe, deletedAt: string): Universe {
  if (universe.deletedAt !== null) {
    throw new UniverseError('ALREADY_DELETED', 'Universe has already been deleted.');
  }

  return {
    ...universe,
    deletedAt,
  };
}
