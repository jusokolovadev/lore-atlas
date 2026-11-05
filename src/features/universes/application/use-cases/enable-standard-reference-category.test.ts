import type { Universe } from 'src/features/universes/domain/models/universe';
import type { UniverseRepository } from 'src/features/universes/application/repositories/universe-repository';

import { createEnableStandardReferenceCategoryUseCase } from './enable-standard-reference-category';

describe('EnableStandardReferenceCategoryUseCase', () => {
  const universeRepository: jest.Mocked<UniverseRepository> = {
    findById: jest.fn(),
    findAllActive: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    restore: jest.fn(),
  };

  const createUniverse = (overrides: Partial<Universe> = {}): Universe => ({
    id: 'universe-1',
    name: 'Test Universe',
    description: null,
    coverImage: null,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    deletedAt: null,
    revision: 1,
    enabledStandardCategoryIds: ['species'],
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enables a standard category and updates the universe', async () => {
    const universe = createUniverse();

    universeRepository.findById.mockResolvedValue(universe);

    const getCurrentTime = jest.fn(() => '2026-01-02T12:00:00.000Z');

    const useCase = createEnableStandardReferenceCategoryUseCase({
      universeRepository: universeRepository as UniverseRepository,
    });

    await useCase({
      universeId: universe.id,
      categoryId: 'titles',
      getCurrentTime,
    });

    expect(getCurrentTime).toHaveBeenCalledTimes(1);

    expect(universeRepository.update).toHaveBeenCalledWith(
      {
        ...universe,
        enabledStandardCategoryIds: ['species', 'titles'],
        updatedAt: '2026-01-02T12:00:00.000Z',
        revision: 2,
      },
      universe.revision,
    );
  });

  it('does not update the universe if the category is already enabled', async () => {
    const universe = createUniverse({
      enabledStandardCategoryIds: ['species', 'titles'],
    });

    universeRepository.findById.mockResolvedValue(universe);

    const getCurrentTime = jest.fn(() => '2026-01-02T12:00:00.000Z');

    const useCase = createEnableStandardReferenceCategoryUseCase({
      universeRepository: universeRepository as UniverseRepository,
    });

    await useCase({
      universeId: universe.id,
      categoryId: 'titles',
      getCurrentTime,
    });

    expect(universeRepository.update).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('throws if the universe does not exist', async () => {
    universeRepository.findById.mockResolvedValue(null);

    const useCase = createEnableStandardReferenceCategoryUseCase({
      universeRepository: universeRepository as UniverseRepository,
    });

    await expect(
      useCase({
        universeId: 'universe-1',
        categoryId: 'titles',
        getCurrentTime: jest.fn(),
      }),
    ).rejects.toThrow('Active universe not found.');

    expect(universeRepository.update).not.toHaveBeenCalled();
  });

  it('throws if the universe is deleted', async () => {
    const universe = createUniverse({
      deletedAt: '2026-01-02T12:00:00.000Z',
    });

    universeRepository.findById.mockResolvedValue(universe);

    const useCase = createEnableStandardReferenceCategoryUseCase({
      universeRepository: universeRepository as UniverseRepository,
    });

    await expect(
      useCase({
        universeId: universe.id,
        categoryId: 'titles',
        getCurrentTime: jest.fn(),
      }),
    ).rejects.toThrow('Active universe not found.');

    expect(universeRepository.update).not.toHaveBeenCalled();
  });

  it('propagates an error if the standard category does not exist', async () => {
    const universe = createUniverse();

    universeRepository.findById.mockResolvedValue(universe);

    const useCase = createEnableStandardReferenceCategoryUseCase({
      universeRepository: universeRepository as UniverseRepository,
    });

    await expect(
      useCase({
        universeId: universe.id,
        categoryId: 'unknown-category',
        getCurrentTime: jest.fn(),
      }),
    ).rejects.toThrow();

    expect(universeRepository.update).not.toHaveBeenCalled();
  });
});
