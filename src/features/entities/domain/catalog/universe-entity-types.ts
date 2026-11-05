import type { UniverseEntityType } from '../models/universe-entity-type';

export const UNIVERSE_ENTITY_TYPES: readonly UniverseEntityType[] = [
  {
    id: 'character',
    name: 'Characters',
    description: 'Individual characters and living beings inhabiting the universe.',
  },
  {
    id: 'location',
    name: 'Locations',
    description: 'Places, regions, settlements, planets, and other locations.',
  },
  {
    id: 'event',
    name: 'Events',
    description: 'Historical events, incidents, and other occurrences.',
  },
  {
    id: 'item',
    name: 'Items',
    description: 'Objects, artifacts, equipment, and other physical or conceptual items.',
  },
  {
    id: 'organization',
    name: 'Organizations',
    description: 'Groups, factions, institutions, and other organized entities.',
  },
];
