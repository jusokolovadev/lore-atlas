import type { Relationship } from '../../domain/models/relationship';

export interface RelationshipRepository {
  findById(id: string): Promise<Relationship | null>;

  findAllActiveByUniverseId(universeId: string): Promise<Relationship[]>;

  findAllActiveByEntityId(universeId: string, entityId: string): Promise<Relationship[]>;

  createIfParticipantsAvailable(
    relationship: Relationship,
  ): Promise<'created' | 'participants-unavailable' | 'already-exists'>;

  update(relationship: Relationship, expectedRevision: number): Promise<void>;

  restore(relationship: Relationship, expectedRevision: number): Promise<void>;
}
