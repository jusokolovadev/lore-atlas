import { isRelationshipTypeDirectionCompatible } from './is-relationship-type-direction-compatible';
import type { RelationshipType } from '../models/relationship-type';

describe('isRelationshipTypeDirectionCompatible', () => {
  const directedType: RelationshipType = {
    id: 'parent-of',
    name: 'Parent of',
    reverseName: 'Child of',
    description: 'A parent-child relationship.',
    group: 'family',
    direction: 'directed',
  };

  const anotherDirectedType: RelationshipType = {
    id: 'loves',
    name: 'Loves',
    reverseName: 'Loved by',
    description: 'One character loves another.',
    group: 'social',
    direction: 'directed',
  };

  const undirectedType: RelationshipType = {
    id: 'friend-of',
    name: 'Friend',
    reverseName: 'Friend',
    description: 'A friendship between two characters.',
    group: 'social',
    direction: 'undirected',
  };

  const anotherUndirectedType: RelationshipType = {
    id: 'enemy-of',
    name: 'Enemy',
    reverseName: 'Enemy',
    description: 'An antagonistic relationship.',
    group: 'social',
    direction: 'undirected',
  };

  it('returns true when both types are directed', () => {
    expect(isRelationshipTypeDirectionCompatible(directedType, anotherDirectedType)).toBe(
      true,
    );
  });

  it('returns true when both types are undirected', () => {
    expect(
      isRelationshipTypeDirectionCompatible(undirectedType, anotherUndirectedType),
    ).toBe(true);
  });

  it('returns false when changing from directed to undirected', () => {
    expect(isRelationshipTypeDirectionCompatible(directedType, undirectedType)).toBe(
      false,
    );
  });

  it('returns false when changing from undirected to directed', () => {
    expect(isRelationshipTypeDirectionCompatible(undirectedType, directedType)).toBe(
      false,
    );
  });
});
