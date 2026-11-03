import { createDeleteUniverseUseCase } from './delete-universe';
import type { UniverseDeletionRepository } from '../repositories/universe-deletion-repository';

describe('createDeleteUniverseUseCase', () => {
  const universeId = 'test-universe-id';
  const timestamp = '2026-11-03T11:00:00.000Z';

  const mockUniverseDeletionRepository: jest.Mocked<UniverseDeletionRepository> = {
    deleteUniverseWithCategories: jest.fn(),
  };

  const getCurrentTime = jest.fn(() => timestamp);

  beforeEach(() => {
    jest.clearAllMocks();

    mockUniverseDeletionRepository.deleteUniverseWithCategories.mockResolvedValue(
      undefined,
    );
  });

  it('should delete a universe and its active categories', async () => {
    const deleteUniverse = createDeleteUniverseUseCase({
      deletionRepository: mockUniverseDeletionRepository,
      getCurrentTime,
    });

    await deleteUniverse(universeId);

    expect(getCurrentTime).toHaveBeenCalledTimes(1);

    expect(
      mockUniverseDeletionRepository.deleteUniverseWithCategories,
    ).toHaveBeenCalledTimes(1);

    expect(
      mockUniverseDeletionRepository.deleteUniverseWithCategories,
    ).toHaveBeenCalledWith(universeId, timestamp);
  });

  it('should propagate repository errors', async () => {
    const error = new Error('Database error');

    mockUniverseDeletionRepository.deleteUniverseWithCategories.mockRejectedValueOnce(
      error,
    );

    const deleteUniverse = createDeleteUniverseUseCase({
      deletionRepository: mockUniverseDeletionRepository,
      getCurrentTime,
    });

    await expect(deleteUniverse(universeId)).rejects.toBe(error);
  });

  it('should not call the repository when getting the current time fails', async () => {
    const error = new Error('Clock error');

    getCurrentTime.mockImplementationOnce(() => {
      throw error;
    });

    const deleteUniverse = createDeleteUniverseUseCase({
      deletionRepository: mockUniverseDeletionRepository,
      getCurrentTime,
    });

    await expect(deleteUniverse(universeId)).rejects.toBe(error);

    expect(
      mockUniverseDeletionRepository.deleteUniverseWithCategories,
    ).not.toHaveBeenCalled();
  });

  it('should use a fresh timestamp for every deletion', async () => {
    const secondTimestamp = '2026-11-03T12:00:00.000Z';

    getCurrentTime.mockReturnValueOnce(timestamp).mockReturnValueOnce(secondTimestamp);

    const deleteUniverse = createDeleteUniverseUseCase({
      deletionRepository: mockUniverseDeletionRepository,
      getCurrentTime,
    });

    await deleteUniverse(universeId);
    await deleteUniverse(universeId);

    expect(
      mockUniverseDeletionRepository.deleteUniverseWithCategories,
    ).toHaveBeenNthCalledWith(1, universeId, timestamp);

    expect(
      mockUniverseDeletionRepository.deleteUniverseWithCategories,
    ).toHaveBeenNthCalledWith(2, universeId, secondTimestamp);
  });
});
