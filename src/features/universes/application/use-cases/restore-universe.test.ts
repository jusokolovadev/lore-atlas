import { createRestoreUniverseUseCase } from './restore-universe';
import type { Universe } from '../../domain/models/universe';
import type { UniverseRepository } from '../repositories/universe-repository';

describe('createRestoreUniverseUseCase', () => {
  const deletedUniverse: Universe = {
    id: 'test-universe-id',
    name: 'Middle-earth',
    description: null,
    coverImage: null,
    createdAt: '2026-11-03T10:00:00.000Z',
    updatedAt: '2026-11-03T10:30:00.000Z',
    deletedAt: '2026-11-03T10:30:00.000Z',
  };

  const mockRepository: jest.Mocked<UniverseRepository> = {
    findById: jest.fn(),
    findAllActive: jest.fn(),
    save: jest.fn(),
  };

  const getCurrentTime = jest.fn(() => '2026-11-03T11:00:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository.findById.mockResolvedValue(deletedUniverse);
    mockRepository.save.mockResolvedValue(undefined);
  });

  it('should restore and save a universe', async () => {
    const restoreUniverse = createRestoreUniverseUseCase({
      repository: mockRepository,
      getCurrentTime,
    });

    await restoreUniverse(deletedUniverse.id);

    expect(mockRepository.save).toHaveBeenCalledWith({
      ...deletedUniverse,
      deletedAt: null,
      updatedAt: '2026-11-03T11:00:00.000Z',
    });

    expect(getCurrentTime).toHaveBeenCalledTimes(1);
  });

  it('should throw NOT_FOUND when universe does not exist', async () => {
    mockRepository.findById.mockResolvedValueOnce(null);

    const restoreUniverse = createRestoreUniverseUseCase({
      repository: mockRepository,
      getCurrentTime,
    });

    await expect(restoreUniverse('unknown-id')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });

    expect(mockRepository.save).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('should throw NOT_DELETED when universe is already active', async () => {
    mockRepository.findById.mockResolvedValueOnce({
      ...deletedUniverse,
      deletedAt: null,
    });

    const restoreUniverse = createRestoreUniverseUseCase({
      repository: mockRepository,
      getCurrentTime,
    });

    await expect(restoreUniverse(deletedUniverse.id)).rejects.toMatchObject({
      code: 'NOT_DELETED',
    });

    expect(mockRepository.save).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('should propagate repository errors', async () => {
    const error = new Error('Database error');

    mockRepository.save.mockRejectedValueOnce(error);

    const restoreUniverse = createRestoreUniverseUseCase({
      repository: mockRepository,
      getCurrentTime,
    });

    await expect(restoreUniverse(deletedUniverse.id)).rejects.toBe(error);
  });
});
