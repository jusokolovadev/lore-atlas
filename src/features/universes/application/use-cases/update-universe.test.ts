import type { Universe } from '../../domain/models/universe';

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

import { createUpdateUniverseUseCase } from './update-universe';
import type { UniverseRepository } from '../repositories/universe-repository';

describe('createUpdateUniverseUseCase', () => {
  const mockRepository: jest.Mocked<UniverseRepository> = {
    findById: jest.fn(),
    findAllActive: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    restore: jest.fn(),
  };

  const getCurrentTime = jest.fn(() => '2026-11-03T11:00:00.000Z');

  beforeEach(() => {
    jest.resetAllMocks();

    mockRepository.findById.mockResolvedValue(universe);
    mockRepository.update.mockResolvedValue(undefined);

    getCurrentTime.mockReturnValue('2026-11-03T11:00:00.000Z');
  });

  it('should update and save a universe', async () => {
    const updateUniverse = createUpdateUniverseUseCase({
      repository: mockRepository,
      getCurrentTime,
    });

    const result = await updateUniverse(universe.id, { name: 'The Shire' });

    expect(result).toEqual({
      ...universe,
      name: 'The Shire',
      updatedAt: '2026-11-03T11:00:00.000Z',
      revision: 2,
    });

    expect(mockRepository.findById).toHaveBeenCalledWith(universe.id);

    expect(mockRepository.update).toHaveBeenCalledWith(result, universe.revision);
    expect(getCurrentTime).toHaveBeenCalledTimes(1);
  });

  it('should throw NOT_FOUND when universe does not exist', async () => {
    mockRepository.findById.mockResolvedValueOnce(null);

    const updateUniverse = createUpdateUniverseUseCase({
      repository: mockRepository,
      getCurrentTime,
    });

    await expect(
      updateUniverse('unknown-id', { name: 'The Shire' }),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });

    expect(mockRepository.update).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('should not save when nothing has changed', async () => {
    const updateUniverse = createUpdateUniverseUseCase({
      repository: mockRepository,
      getCurrentTime,
    });

    const result = await updateUniverse(universe.id, { name: 'Middle-earth' });

    expect(result).toBe(universe);
    expect(mockRepository.update).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('should propagate domain errors', async () => {
    const updateUniverse = createUpdateUniverseUseCase({
      repository: mockRepository,
      getCurrentTime,
    });

    await expect(updateUniverse(universe.id, { name: '   ' })).rejects.toMatchObject({
      code: 'INVALID_NAME',
    });

    expect(mockRepository.update).not.toHaveBeenCalled();
  });

  it('should propagate repository errors', async () => {
    const error = new Error('Database error');

    mockRepository.update.mockRejectedValueOnce(error);

    const updateUniverse = createUpdateUniverseUseCase({
      repository: mockRepository,
      getCurrentTime,
    });

    await expect(updateUniverse(universe.id, { name: 'The Shire' })).rejects.toBe(error);
  });
});
