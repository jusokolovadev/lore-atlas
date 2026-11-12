import {
  findRelationshipTypeById,
  getAllRelationshipTypes,
  getRelationshipTypesByGroup,
} from './relationship-type-catalog';
import { RELATIONSHIP_TYPES } from './relationship-types';

describe('relationship-type-catalog', () => {
  describe('findRelationshipTypeById', () => {
    it('returns a relationship type by ID', () => {
      const result = findRelationshipTypeById('parent-of');

      expect(result).toEqual(
        expect.objectContaining({
          id: 'parent-of',
          name: 'Parent of',
          reverseName: 'Child of',
          direction: 'directed',
        }),
      );
    });

    it('returns null for an unknown ID', () => {
      expect(findRelationshipTypeById('unknown')).toBeNull();
    });
  });

  describe('getRelationshipTypesByGroup', () => {
    it('returns relationship types belonging to the requested group', () => {
      const result = getRelationshipTypesByGroup('family');

      expect(result.length).toBeGreaterThan(0);
      expect(result.every((type) => type.group === 'family')).toBe(true);
    });

    it('returns an empty array when the group has no relationship types', () => {
      const result = getRelationshipTypesByGroup('other');

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('getAllRelationshipTypes', () => {
    it('returns all relationship types', () => {
      expect(getAllRelationshipTypes()).toEqual(RELATIONSHIP_TYPES);
    });

    it('returns a new array', () => {
      expect(getAllRelationshipTypes()).not.toBe(RELATIONSHIP_TYPES);
    });
  });

  describe('catalog integrity', () => {
    it('contains unique relationship type IDs', () => {
      const ids = RELATIONSHIP_TYPES.map((type) => type.id);

      expect(new Set(ids).size).toBe(ids.length);
    });

    it('contains all relationship type groups', () => {
      const groups = new Set(RELATIONSHIP_TYPES.map((type) => type.group));

      expect(groups).toEqual(
        new Set([
          'family',
          'social',
          'organizational',
          'ownership',
          'historical',
          'spatial',
          'other',
        ]),
      );
    });

    it('contains non-empty English names and descriptions', () => {
      for (const type of RELATIONSHIP_TYPES) {
        expect(type.name.trim()).not.toBe('');
        expect(type.reverseName.trim()).not.toBe('');
        expect(type.description.trim()).not.toBe('');
      }
    });
  });
});
