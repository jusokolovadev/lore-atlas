import { createDeleteUniverseUseCase } from './delete-universe';
import type { Universe } from '../../domain/models/universe';
import type { UniverseRepository } from '../repositories/universe-repository';

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

  const mockRepository: jest.Mocked<UniverseRepository> = {
    findById: jest.fn(),
    findAllActive: jest.fn(),
    save: jest.fn(),
  };

  const getCurrentTime = jest.fn(() => '2026-11-03T11:00:00.000Z');

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository.findById.mockResolvedValue(universe);
    mockRepository.save.mockResolvedValue(undefined);
  });

  it('should delete and save a universe', async () => {
    const deleteUniverse = createDeleteUniverseUseCase({
      repository: mockRepository,
      getCurrentTime,
    });

    await deleteUniverse(universe.id);

    expect(mockRepository.save).toHaveBeenCalledWith({
      ...universe,
      deletedAt: '2026-11-03T11:00:00.000Z',
      updatedAt: '2026-11-03T11:00:00.000Z',
    });

    expect(getCurrentTime).toHaveBeenCalledTimes(1);
  });

  it('should throw NOT_FOUND when universe does not exist', async () => {
    mockRepository.findById.mockResolvedValueOnce(null);

    const deleteUniverse = createDeleteUniverseUseCase({
      repository: mockRepository,
      getCurrentTime,
    });

    await expect(deleteUniverse('unknown-id')).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });

    expect(mockRepository.save).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('should throw ALREADY_DELETED when universe is already deleted', async () => {
    mockRepository.findById.mockResolvedValueOnce({
      ...universe,
      deletedAt: '2026-11-03T10:30:00.000Z',
    });

    const deleteUniverse = createDeleteUniverseUseCase({
      repository: mockRepository,
      getCurrentTime,
    });

    await expect(deleteUniverse(universe.id)).rejects.toMatchObject({
      code: 'ALREADY_DELETED',
    });

    expect(mockRepository.save).not.toHaveBeenCalled();
  });

  it('should propagate repository errors', async () => {
    const error = new Error('Database error');

    mockRepository.save.mockRejectedValueOnce(error);

    const deleteUniverse = createDeleteUniverseUseCase({
      repository: mockRepository,
      getCurrentTime,
    });

    await expect(deleteUniverse(universe.id)).rejects.toBe(error);
  });
});
