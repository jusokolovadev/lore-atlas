import { createDeleteUniverseUseCase } from './delete-universe';
import type { Universe } from '../../domain/models/universe';
import type { UniverseRepository } from '../repositories/universe-repository';
import type { UniverseDeletionRepository } from 'src/features/universes/application/repositories/universe-deletion-repository';
import type { ReferenceCategoryRepository } from 'src/features/reference-categories/application/repositories/reference-category-repository';
import { CustomReferenceCategory } from 'src/features/reference-categories/domain/models/custom-reference-category';

describe('createDeleteUniverseUseCase', () => {
  const universe: Universe = {
    id: 'test-universe-id',
    name: 'Middle-earth',
    description: null,
    coverImage: null,
    createdAt: '2026-11-03T10:00:00.000Z',
    updatedAt: '2026-11-03T10:00:00.000Z',
    deletedAt: null,
  };

  const categories: CustomReferenceCategory[] = [
    {
      id: 'category-1',
      universeId: universe.id,
      name: 'Species',
      description: null,
      createdAt: '2026-11-03T10:00:00.000Z',
      updatedAt: '2026-11-03T10:00:00.000Z',
      deletedAt: null,
    },
    {
      id: 'category-2',
      universeId: universe.id,
      name: 'Languages',
      description: null,
      createdAt: '2026-11-03T10:00:00.000Z',
      updatedAt: '2026-11-03T10:00:00.000Z',
      deletedAt: null,
    },
  ];

  const mockUniverseRepository: jest.Mocked<UniverseRepository> = {
    findById: jest.fn(),
    findAllActive: jest.fn(),
    save: jest.fn(),
  };

  const mockReferenceCategoryRepository: jest.Mocked<ReferenceCategoryRepository> = {
    findById: jest.fn(),
    findActiveByName: jest.fn(),
    findAllActiveByUniverseId: jest.fn(),
    save: jest.fn(),
    createIfUniverseActive: jest.fn(),
  };

  const mockUniverseDeletionRepository: jest.Mocked<UniverseDeletionRepository> = {
    deleteUniverseWithCategories: jest.fn(),
  };

  const getCurrentTime = jest.fn(() => '2026-11-03T11:00:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();

    mockUniverseRepository.findById.mockResolvedValue(universe);
    mockReferenceCategoryRepository.findAllActiveByUniverseId.mockResolvedValue([]);
    mockUniverseDeletionRepository.deleteUniverseWithCategories.mockResolvedValue(
      undefined,
    );
  });

  it('should delete a universe and its active categories', async () => {
    const deleteUniverse = createDeleteUniverseUseCase({
      repository: mockUniverseRepository,
      referenceCategoryRepository: mockReferenceCategoryRepository,
      deletionRepository: mockUniverseDeletionRepository,
      getCurrentTime,
    });

    await deleteUniverse(universe.id);

    const timestamp = '2026-11-03T11:00:00.000Z';

    expect(
      mockUniverseDeletionRepository.deleteUniverseWithCategories,
    ).toHaveBeenCalledWith(
      {
        ...universe,
        deletedAt: timestamp,
        updatedAt: timestamp,
      },
      [],
    );

    expect(
      mockReferenceCategoryRepository.findAllActiveByUniverseId,
    ).toHaveBeenCalledWith(universe.id);

    expect(getCurrentTime).toHaveBeenCalledTimes(1);
  });

  it('should throw NOT_FOUND when universe does not exist', async () => {
    mockUniverseRepository.findById.mockResolvedValueOnce(null);

    const deleteUniverse = createDeleteUniverseUseCase({
      repository: mockUniverseRepository,
      referenceCategoryRepository: mockReferenceCategoryRepository,
      deletionRepository: mockUniverseDeletionRepository,
      getCurrentTime,
    });

    await expect(deleteUniverse('unknown-id')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });

    expect(mockUniverseRepository.save).not.toHaveBeenCalled();
    expect(
      mockUniverseDeletionRepository.deleteUniverseWithCategories,
    ).not.toHaveBeenCalled();

    expect(
      mockReferenceCategoryRepository.findAllActiveByUniverseId,
    ).not.toHaveBeenCalled();

    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('should throw ALREADY_DELETED when universe is already deleted', async () => {
    mockUniverseRepository.findById.mockResolvedValueOnce({
      ...universe,
      deletedAt: '2026-11-03T10:30:00.000Z',
    });

    const deleteUniverse = createDeleteUniverseUseCase({
      repository: mockUniverseRepository,
      referenceCategoryRepository: mockReferenceCategoryRepository,
      deletionRepository: mockUniverseDeletionRepository,
      getCurrentTime,
    });

    await expect(deleteUniverse(universe.id)).rejects.toMatchObject({
      code: 'ALREADY_DELETED',
    });

    expect(mockUniverseRepository.save).not.toHaveBeenCalled();
    expect(
      mockUniverseDeletionRepository.deleteUniverseWithCategories,
    ).not.toHaveBeenCalled();

    expect(
      mockReferenceCategoryRepository.findAllActiveByUniverseId,
    ).not.toHaveBeenCalled();
  });

  it('should propagate repository errors', async () => {
    const error = new Error('Database error');

    mockUniverseDeletionRepository.deleteUniverseWithCategories.mockRejectedValueOnce(
      error,
    );

    const deleteUniverse = createDeleteUniverseUseCase({
      repository: mockUniverseRepository,
      referenceCategoryRepository: mockReferenceCategoryRepository,
      deletionRepository: mockUniverseDeletionRepository,
      getCurrentTime,
    });

    await expect(deleteUniverse(universe.id)).rejects.toBe(error);
  });

  it('should delete all active categories of the universe', async () => {
    mockReferenceCategoryRepository.findAllActiveByUniverseId.mockResolvedValue(
      categories,
    );

    const deleteUniverse = createDeleteUniverseUseCase({
      repository: mockUniverseRepository,
      referenceCategoryRepository: mockReferenceCategoryRepository,
      deletionRepository: mockUniverseDeletionRepository,
      getCurrentTime,
    });

    await deleteUniverse(universe.id);

    const timestamp = '2026-11-03T11:00:00.000Z';

    expect(
      mockUniverseDeletionRepository.deleteUniverseWithCategories,
    ).toHaveBeenCalledWith(
      {
        ...universe,
        deletedAt: timestamp,
        updatedAt: timestamp,
      },
      categories.map((category) => ({
        ...category,
        deletedAt: timestamp,
        updatedAt: timestamp,
      })),
    );
  });

  it('should not restore or modify already deleted categories', async () => {
    mockReferenceCategoryRepository.findAllActiveByUniverseId.mockResolvedValue([]);

    const deleteUniverse = createDeleteUniverseUseCase({
      repository: mockUniverseRepository,
      referenceCategoryRepository: mockReferenceCategoryRepository,
      deletionRepository: mockUniverseDeletionRepository,
      getCurrentTime,
    });

    await deleteUniverse(universe.id);

    expect(
      mockUniverseDeletionRepository.deleteUniverseWithCategories,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        deletedAt: '2026-11-03T11:00:00.000Z',
      }),
      [],
    );
  });
});
