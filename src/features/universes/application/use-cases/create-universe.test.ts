import { createCreateUniverseUseCase } from './create-universe';
import type { UniverseRepository } from '../repositories/universe-repository';

describe('createCreateUniverseUseCase', () => {
  const mockRepository: jest.Mocked<UniverseRepository> = {
    findById: jest.fn(),
    findAllActive: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    restore: jest.fn(),
  };

  const generateId = jest.fn(() => 'test-universe-id');
  const getCurrentTime = jest.fn(() => '2026-11-03T10:00:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();
    mockRepository.create.mockResolvedValue(undefined);
    mockRepository.update.mockResolvedValue(undefined);
    mockRepository.restore.mockResolvedValue(undefined);
  });

  it('should create and save a universe', async () => {
    const createUniverse = createCreateUniverseUseCase({
      repository: mockRepository,
      generateId,
      getCurrentTime,
    });

    const result = await createUniverse({
      name: 'Middle-earth',
    });

    expect(result).toEqual({
      id: 'test-universe-id',
      name: 'Middle-earth',
      description: null,
      coverImage: null,
      createdAt: '2026-11-03T10:00:00.000Z',
      updatedAt: '2026-11-03T10:00:00.000Z',
      deletedAt: null,
      revision: 1,
      enabledStandardCategoryIds: [
        'species',
        'organization-types',
        'titles',
        'ranks',
        'settlement-types',
      ],
    });

    expect(mockRepository.create).toHaveBeenCalledWith(result);
    expect(generateId).toHaveBeenCalledTimes(1);
    expect(getCurrentTime).toHaveBeenCalledTimes(1);
  });

  it('should not save a universe with an invalid name', async () => {
    const createUniverse = createCreateUniverseUseCase({
      repository: mockRepository,
      generateId,
      getCurrentTime,
    });

    await expect(createUniverse({ name: '   ' })).rejects.toMatchObject({
      code: 'INVALID_NAME',
    });

    expect(mockRepository.create).not.toHaveBeenCalled();
  });

  it('should propagate repository errors', async () => {
    const error = new Error('Database error');

    mockRepository.create.mockRejectedValueOnce(error);

    const createUniverse = createCreateUniverseUseCase({
      repository: mockRepository,
      generateId,
      getCurrentTime,
    });

    await expect(createUniverse({ name: 'Middle-earth' })).rejects.toBe(error);
  });
});
