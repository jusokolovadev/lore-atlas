import type { UniverseEntity } from '../../domain/models/universe-entity';

export interface UniverseEntityRepository {
  findById(id: string): Promise<UniverseEntity | null>;

  findAllActiveByUniverseId(universeId: string): Promise<UniverseEntity[]>;

  findAllActiveByType(
    universeId: string,
    type: UniverseEntity['type'],
  ): Promise<UniverseEntity[]>;

  createIfUniverseActive(entity: UniverseEntity): Promise<boolean>;

  update(entity: UniverseEntity, expectedRevision: number): Promise<void>;

  restore(entity: UniverseEntity, expectedRevision: number): Promise<void>;
}
