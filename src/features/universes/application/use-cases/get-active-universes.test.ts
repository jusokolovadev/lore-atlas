import { createGetActiveUniversesUseCase } from './get-active-universes';
import type { Universe } from '../../domain/models/universe';
import type { UniverseRepository } from '../repositories/universe-repository';

describe('createGetActiveUniversesUseCase', () => {
  const universes: Universe[] = [
    {
      id: 'universe-1',
      name: 'Middle-earth',
      description: null,
      coverImage: null,
      createdAt: '2026-11-03T10:00:00.000Z',
      updatedAt: '2026-11-03T10:00:00.000Z',
      deletedAt: null,
      revision: 1,
      enabledStandardCategoryIds: ['species', 'titles'],
    },
    {
      id: 'universe-2',
      name: 'Westeros',
      description: null,
      coverImage: null,
      createdAt: '2026-11-03T10:00:00.000Z',
      updatedAt: '2026-11-03T10:00:00.000Z',
      deletedAt: null,
      revision: 1,
      enabledStandardCategoryIds: ['species', 'titles'],
    },
  ];

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

  it('should return active universes', async () => {
    mockRepository.findAllActive.mockResolvedValue(universes);

    const getActiveUniverses = createGetActiveUniversesUseCase({
      repository: mockRepository,
    });

    const result = await getActiveUniverses();

    expect(result).toEqual(universes);
    expect(mockRepository.findAllActive).toHaveBeenCalledTimes(1);
  });

  it('should return an empty array when there are no active universes', async () => {
    mockRepository.findAllActive.mockResolvedValue([]);

    const getActiveUniverses = createGetActiveUniversesUseCase({
      repository: mockRepository,
    });

    const result = await getActiveUniverses();

    expect(result).toEqual([]);
  });

  it('should propagate repository errors', async () => {
    const error = new Error('Database error');

    mockRepository.findAllActive.mockRejectedValue(error);

    const getActiveUniverses = createGetActiveUniversesUseCase({
      repository: mockRepository,
    });

    await expect(getActiveUniverses()).rejects.toBe(error);
  });
});
