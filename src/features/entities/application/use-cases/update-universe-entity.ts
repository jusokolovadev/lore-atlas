import type { UniverseEntity } from '../../domain/models/universe-entity';
import type { UniverseEntityRepository } from '../repositories/universe-entity-repository';
import type { UniverseEntityChanges } from '../models/universe-entity-changes';

export interface UpdateUniverseEntityInput {
  id: string;
  expectedRevision: number;
  changes: UniverseEntityChanges;
}

export interface UpdateUniverseEntityDependencies {
  universeEntityRepository: UniverseEntityRepository;
  getCurrentTime: () => string;
}

export function createUpdateUniverseEntityUseCase(
  dependencies: UpdateUniverseEntityDependencies,
): (input: UpdateUniverseEntityInput) => Promise<UniverseEntity> {
  return async (input) => {
    const { universeEntityRepository } = dependencies;

    const currentEntity = await universeEntityRepository.findById(input.id);

    if (!currentEntity || currentEntity.deletedAt !== null) {
      throw new Error('Entity not found or deleted.');
    }

    if (currentEntity.revision !== input.expectedRevision) {
      throw new Error('Entity revision conflict.');
    }

    const name =
      input.changes.name === undefined ? currentEntity.name : input.changes.name.trim();

    if (!name) {
      throw new Error('Entity name cannot be empty.');
    }

    const updatedAt = dependencies.getCurrentTime();

    const base = {
      ...currentEntity,
      name,
      description:
        input.changes.description === undefined
          ? currentEntity.description
          : input.changes.description,
      image:
        input.changes.image === undefined ? currentEntity.image : input.changes.image,
      updatedAt,
      revision: currentEntity.revision + 1,
    };

    let updatedEntity: UniverseEntity;

    switch (currentEntity.type) {
      case 'character':
        if (input.changes.type !== 'character') {
          throw new Error('Entity type cannot be changed.');
        }

        updatedEntity = {
          ...base,
          type: 'character',
          properties: input.changes.properties ?? currentEntity.properties,
        };
        break;

      case 'location':
        if (input.changes.type !== 'location') {
          throw new Error('Entity type cannot be changed.');
        }

        updatedEntity = {
          ...base,
          type: 'location',
          properties: input.changes.properties ?? currentEntity.properties,
        };
        break;

      case 'event':
        if (input.changes.type !== 'event') {
          throw new Error('Entity type cannot be changed.');
        }

        updatedEntity = {
          ...base,
          type: 'event',
          properties: input.changes.properties ?? currentEntity.properties,
        };
        break;

      case 'item':
        if (input.changes.type !== 'item') {
          throw new Error('Entity type cannot be changed.');
        }

        updatedEntity = {
          ...base,
          type: 'item',
          properties: input.changes.properties ?? currentEntity.properties,
        };
        break;

      case 'organization':
        if (input.changes.type !== 'organization') {
          throw new Error('Entity type cannot be changed.');
        }

        updatedEntity = {
          ...base,
          type: 'organization',
          properties: input.changes.properties ?? currentEntity.properties,
        };
        break;
    }

    await universeEntityRepository.update(updatedEntity, input.expectedRevision);

    return updatedEntity;
  };
}
