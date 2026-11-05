import { UNIVERSE_ENTITY_TYPES } from './universe-entity-types';

import type { UniverseEntityType } from '../models/universe-entity-type';

export function findUniverseEntityTypeById(id: string): UniverseEntityType | null {
  return UNIVERSE_ENTITY_TYPES.find((type) => type.id === id) ?? null;
}

export function getAllUniverseEntityTypes(): UniverseEntityType[] {
  return [...UNIVERSE_ENTITY_TYPES];
}
