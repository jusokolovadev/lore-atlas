import { UniverseError } from '../errors/universe-error';
import type { Universe } from './universe';

export function restoreUniverse(universe: Universe): Universe {
  if (universe.deletedAt === null) {
    throw new UniverseError('NOT_DELETED', 'Universe has not been deleted.');
  }

  return {
    ...universe,
    deletedAt: null,
  };
}
