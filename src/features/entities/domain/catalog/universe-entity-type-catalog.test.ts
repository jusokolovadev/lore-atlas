import {
  findUniverseEntityTypeById,
  getAllUniverseEntityTypes,
} from './universe-entity-type-catalog';

describe('universe entity type catalog', () => {
  it('contains all expected entity types', () => {
    const types = getAllUniverseEntityTypes();

    expect(types.map((type) => type.id)).toEqual([
      'character',
      'location',
      'event',
      'item',
      'organization',
    ]);
  });

  it('contains unique type IDs', () => {
    const types = getAllUniverseEntityTypes();
    const ids = types.map((type) => type.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it('finds an entity type by ID', () => {
    const type = findUniverseEntityTypeById('character');

    expect(type).not.toBeNull();
    expect(type?.name).toBe('Characters');
  });

  it('returns null for an unknown ID', () => {
    expect(findUniverseEntityTypeById('unknown')).toBeNull();
  });

  it('returns a new array from getAllUniverseEntityTypes', () => {
    const first = getAllUniverseEntityTypes();
    const second = getAllUniverseEntityTypes();

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });
});
