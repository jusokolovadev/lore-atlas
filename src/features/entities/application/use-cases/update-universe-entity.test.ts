import type { UniverseEntity } from '../../domain/models/universe-entity';
import type { UniverseEntityRepository } from '../repositories/universe-entity-repository';
import { createUpdateUniverseEntityUseCase } from './update-universe-entity';

describe('createUpdateUniverseEntityUseCase', () => {
  const currentEntity: UniverseEntity = {
    id: 'entity-1',
    universeId: 'universe-1',
    type: 'character',
    name: 'Aragorn',
    description: null,
    image: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    revision: 1,
    isSpoiler: false,
    properties: {
      species: null,
      gender: 'Male',
      birthDate: null,
      deathDate: null,
      ageDescription: null,
      height: null,
      weight: null,
      eyeColor: null,
      hairColor: null,
      appearance: null,
      titles: [],
      rank: null,
      socialClass: null,
      professions: [],
      abilities: [],
      personality: null,
      backstory: null,
      goals: null,
    },
  };

  const universeEntityRepository: jest.Mocked<UniverseEntityRepository> = {
    findById: jest.fn(),
    findAllActiveByUniverseId: jest.fn(),
    findAllActiveByType: jest.fn(),
    createIfUniverseActive: jest.fn(),
    update: jest.fn(),
    restore: jest.fn(),
  };

  const getCurrentTime = jest.fn(() => '2026-02-01T00:00:00.000Z');

  const updateEntity = createUpdateUniverseEntityUseCase({
    universeEntityRepository,
    getCurrentTime,
  });

  const baseInput = {
    id: 'entity-1',
    expectedRevision: 1,
    changes: {
      type: 'character' as const,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    getCurrentTime.mockReturnValue('2026-02-01T00:00:00.000Z');
    universeEntityRepository.findById.mockResolvedValue(currentEntity);
    universeEntityRepository.update.mockResolvedValue(undefined);
  });

  it('updates an entity and increments its revision', async () => {
    const result = await updateEntity({
      ...baseInput,
      changes: {
        type: 'character',
        name: '  Aragorn II  ',
      },
    });

    expect(result).toEqual({
      ...currentEntity,
      name: 'Aragorn II',
      updatedAt: '2026-02-01T00:00:00.000Z',
      revision: 2,
    });

    expect(universeEntityRepository.update).toHaveBeenCalledWith(result, 1);
    expect(getCurrentTime).toHaveBeenCalledTimes(1);
  });

  it('preserves fields that were not included in changes', async () => {
    const result = await updateEntity({
      ...baseInput,
      changes: {
        type: 'character',
        name: 'Aragorn II',
      },
    });

    expect(result.description).toBe(currentEntity.description);
    expect(result.image).toBe(currentEntity.image);
    expect(result.properties).toBe(currentEntity.properties);
  });

  it('allows explicitly clearing nullable fields', async () => {
    const result = await updateEntity({
      ...baseInput,
      changes: {
        type: 'character',
        description: null,
      },
    });

    expect(result.description).toBeNull();
  });

  it('throws when the entity does not exist', async () => {
    universeEntityRepository.findById.mockResolvedValue(null);

    await expect(updateEntity(baseInput)).rejects.toThrow('Entity not found or deleted.');

    expect(universeEntityRepository.update).not.toHaveBeenCalled();
  });

  it('throws when the entity is deleted', async () => {
    universeEntityRepository.findById.mockResolvedValue({
      ...currentEntity,
      deletedAt: '2026-01-15T00:00:00.000Z',
    });

    await expect(updateEntity(baseInput)).rejects.toThrow('Entity not found or deleted.');
  });

  it('throws on revision conflict', async () => {
    await expect(updateEntity({ ...baseInput, expectedRevision: 2 })).rejects.toThrow(
      'Entity revision conflict.',
    );

    expect(universeEntityRepository.update).not.toHaveBeenCalled();
  });

  it('throws when attempting to change entity type', async () => {
    await expect(
      updateEntity({
        ...baseInput,
        changes: {
          type: 'location',
        },
      }),
    ).rejects.toThrow('Entity type cannot be changed.');

    expect(universeEntityRepository.update).not.toHaveBeenCalled();
  });

  it('throws when the updated name is empty', async () => {
    await expect(
      updateEntity({
        ...baseInput,
        changes: {
          type: 'character',
          name: '   ',
        },
      }),
    ).rejects.toThrow('Entity name cannot be empty.');

    expect(universeEntityRepository.update).not.toHaveBeenCalled();
  });
});
