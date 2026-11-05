import type { UniverseEntityRepository } from '../repositories/universe-entity-repository';
import { createCreateUniverseEntityUseCase } from './create-universe-entity';

describe('createCreateUniverseEntityUseCase', () => {
  const universeEntityRepository: jest.Mocked<UniverseEntityRepository> = {
    findById: jest.fn(),
    findAllActiveByUniverseId: jest.fn(),
    findAllActiveByType: jest.fn(),
    createIfUniverseActive: jest.fn(),
    update: jest.fn(),
    restore: jest.fn(),
  };

  const generateId = jest.fn(() => 'entity-1');
  const getCurrentTime = jest.fn(() => '2026-01-01T00:00:00.000Z');

  const dependencies = {
    universeEntityRepository,
    generateId,
    getCurrentTime,
  };

  const createEntity = createCreateUniverseEntityUseCase(dependencies);

  beforeEach(() => {
    jest.clearAllMocks();

    generateId.mockReturnValue('entity-1');
    getCurrentTime.mockReturnValue('2026-01-01T00:00:00.000Z');
  });

  const baseInput = {
    universeId: 'universe-1',
    name: 'Aragorn',
    type: 'character' as const,
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

  it('creates an entity with generated metadata', async () => {
    universeEntityRepository.createIfUniverseActive.mockResolvedValue(true);

    const result = await createEntity(baseInput);

    expect(result).toEqual({
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
      properties: baseInput.properties,
    });

    expect(generateId).toHaveBeenCalledTimes(1);
    expect(getCurrentTime).toHaveBeenCalledTimes(1);

    expect(universeEntityRepository.createIfUniverseActive).toHaveBeenCalledWith(result);
  });

  it('throws when the universe is not active', async () => {
    universeEntityRepository.createIfUniverseActive.mockResolvedValue(false);

    await expect(createEntity(baseInput)).rejects.toThrow(
      'Universe not found or deleted.',
    );
  });

  it('uses provided description and image', async () => {
    universeEntityRepository.createIfUniverseActive.mockResolvedValue(true);

    const input = {
      ...baseInput,
      description: 'King of Gondor',
      image: {
        type: 'url' as const,
        url: 'https://example.com/aragorn.png',
      },
    };

    const result = await createEntity(input);

    expect(result.description).toBe('King of Gondor');
    expect(result.image).toEqual(input.image);
  });

  it('trims entity name', async () => {
    universeEntityRepository.createIfUniverseActive.mockResolvedValue(true);

    const result = await createEntity({
      ...baseInput,
      name: '  Aragorn  ',
    });

    expect(result.name).toBe('Aragorn');
  });

  it('throws when entity name is empty', async () => {
    await expect(
      createEntity({
        ...baseInput,
        name: '   ',
      }),
    ).rejects.toThrow('Entity name cannot be empty.');

    expect(universeEntityRepository.createIfUniverseActive).not.toHaveBeenCalled();
    expect(generateId).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });
});
