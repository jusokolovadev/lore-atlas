import type { UniverseEntity } from '../../domain/models/universe-entity';
import type { UniverseEntityRepository } from '../repositories/universe-entity-repository';
import { createRestoreUniverseEntityUseCase } from './restore-universe-entity';

describe('createRestoreUniverseEntityUseCase', () => {
  const deletedEntity: UniverseEntity = {
    id: 'entity-1',
    universeId: 'universe-1',
    type: 'character',
    name: 'Aragorn',
    description: null,
    image: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
    deletedAt: '2026-01-15T00:00:00.000Z',
    revision: 2,
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

  const restoreEntity = createRestoreUniverseEntityUseCase({
    universeEntityRepository,
    getCurrentTime,
  });

  const baseInput = {
    id: 'entity-1',
    expectedRevision: 2,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    getCurrentTime.mockReturnValue('2026-02-01T00:00:00.000Z');
    universeEntityRepository.findById.mockResolvedValue(deletedEntity);
    universeEntityRepository.restore.mockResolvedValue(undefined);
  });

  it('restores an entity and increments its revision', async () => {
    const result = await restoreEntity(baseInput);

    expect(result).toEqual({
      ...deletedEntity,
      deletedAt: null,
      updatedAt: '2026-02-01T00:00:00.000Z',
      revision: 3,
    });

    expect(universeEntityRepository.restore).toHaveBeenCalledWith(result, 2);

    expect(getCurrentTime).toHaveBeenCalledTimes(1);
  });

  it('preserves all entity fields except deletion metadata', async () => {
    const result = await restoreEntity(baseInput);

    expect(result.id).toBe(deletedEntity.id);
    expect(result.universeId).toBe(deletedEntity.universeId);
    expect(result.type).toBe(deletedEntity.type);
    expect(result.name).toBe(deletedEntity.name);
    expect(result.description).toBe(deletedEntity.description);
    expect(result.image).toBe(deletedEntity.image);
    expect(result.createdAt).toBe(deletedEntity.createdAt);
    expect(result.properties).toBe(deletedEntity.properties);
  });

  it('throws when the entity does not exist', async () => {
    universeEntityRepository.findById.mockResolvedValue(null);

    await expect(restoreEntity(baseInput)).rejects.toThrow('Entity not found.');

    expect(universeEntityRepository.restore).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('throws when the entity is not deleted', async () => {
    universeEntityRepository.findById.mockResolvedValue({
      ...deletedEntity,
      deletedAt: null,
    });

    await expect(restoreEntity(baseInput)).rejects.toThrow('Entity is not deleted.');

    expect(universeEntityRepository.restore).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('throws on revision conflict', async () => {
    await expect(
      restoreEntity({
        ...baseInput,
        expectedRevision: 1,
      }),
    ).rejects.toThrow('Entity revision conflict.');

    expect(universeEntityRepository.restore).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    const error = new Error('Entity revision conflict.');

    universeEntityRepository.restore.mockRejectedValue(error);

    await expect(restoreEntity(baseInput)).rejects.toBe(error);
  });
});
