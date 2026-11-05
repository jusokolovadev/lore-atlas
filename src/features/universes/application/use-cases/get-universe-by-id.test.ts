import { createGetUniverseByIdUseCase } from './get-universe-by-id';
import type { Universe } from '../../domain/models/universe';
import type { UniverseRepository } from '../repositories/universe-repository';

describe('createGetUniverseByIdUseCase', () => {
  const universe: Universe = {
    id: 'test-universe-id',
    name: 'Middle-earth',
    description: null,
    coverImage: null,
    createdAt: '2026-11-03T10:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    deletedAt: null,
    revision: 1,
    enabledStandardCategoryIds: ['species', 'titles'],
  };

  const mockRepository: jest.Mocked<UniverseRepository> = {
    findById: jest.fn(),
    findAllActive: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    restore: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return a universe when it exists', async () => {
    mockRepository.findById.mockResolvedValue(universe);

    const getUniverseById = createGetUniverseByIdUseCase({
      repository: mockRepository,
    });

    const result = await getUniverseById(universe.id);

    expect(result).toBe(universe);
    expect(mockRepository.findById).toHaveBeenCalledWith(universe.id);
  });

  it('should return null when universe does not exist', async () => {
    mockRepository.findById.mockResolvedValue(null);

    const getUniverseById = createGetUniverseByIdUseCase({
      repository: mockRepository,
    });

    const result = await getUniverseById('unknown-id');

    expect(result).toBeNull();
  });

  it('should return a deleted universe', async () => {
    const deletedUniverse = {
      ...universe,
      deletedAt: '2026-11-03T10:30:00.000Z',
    };

    mockRepository.findById.mockResolvedValue(deletedUniverse);

    const getUniverseById = createGetUniverseByIdUseCase({
      repository: mockRepository,
    });

    const result = await getUniverseById(universe.id);

    expect(result).toBe(deletedUniverse);
  });

  it('should propagate repository errors', async () => {
    const error = new Error('Database error');

    mockRepository.findById.mockRejectedValue(error);

    const getUniverseById = createGetUniverseByIdUseCase({
      repository: mockRepository,
    });

    await expect(getUniverseById(universe.id)).rejects.toBe(error);
  });
});
