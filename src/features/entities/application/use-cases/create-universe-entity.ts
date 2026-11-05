import type { ImageReference } from 'src/shared/types/image-reference';
import type { UniverseEntity } from '../../domain/models/universe-entity';
import type { UniverseEntityRepository } from '../repositories/universe-entity-repository';

export type CreateUniverseEntityInput = {
  universeId: string;
  name: string;
  description?: string | null;
  image?: ImageReference | null;
} & (
  | {
      type: 'character';
      properties: Extract<UniverseEntity, { type: 'character' }>['properties'];
    }
  | {
      type: 'location';
      properties: Extract<UniverseEntity, { type: 'location' }>['properties'];
    }
  | {
      type: 'event';
      properties: Extract<UniverseEntity, { type: 'event' }>['properties'];
    }
  | {
      type: 'item';
      properties: Extract<UniverseEntity, { type: 'item' }>['properties'];
    }
  | {
      type: 'organization';
      properties: Extract<UniverseEntity, { type: 'organization' }>['properties'];
    }
);

export interface CreateUniverseEntityDependencies {
  universeEntityRepository: UniverseEntityRepository;
  generateId: () => string;
  getCurrentTime: () => string;
}

export function createCreateUniverseEntityUseCase(
  dependencies: CreateUniverseEntityDependencies,
): (input: CreateUniverseEntityInput) => Promise<UniverseEntity> {
  return async (input) => {
    const name = input.name.trim();

    if (!name) {
      throw new Error('Entity name cannot be empty.');
    }

    const now = dependencies.getCurrentTime();

    const entity = {
      id: dependencies.generateId(),
      universeId: input.universeId,
      type: input.type,
      name,
      description: input.description ?? null,
      image: input.image ?? null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      revision: 1,
      properties: input.properties,
    } as UniverseEntity;

    const created =
      await dependencies.universeEntityRepository.createIfUniverseActive(entity);

    if (!created) {
      throw new Error('Universe not found or deleted.');
    }

    return entity;
  };
}
