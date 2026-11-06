import type { RelationshipTypeGroup } from './relationship-type-group';

export type RelationshipDirection = 'directed' | 'undirected';

export interface RelationshipType {
  readonly id: string;
  readonly name: string;
  readonly reverseName: string;
  readonly description: string;
  readonly group: RelationshipTypeGroup;
  readonly direction: RelationshipDirection;
}
