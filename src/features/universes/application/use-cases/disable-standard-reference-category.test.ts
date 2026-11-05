import type { Universe } from 'src/features/universes/domain/models/universe';
import type { UniverseRepository } from 'src/features/universes/application/repositories/universe-repository';
import { createDisableStandardReferenceCategoryUseCase } from './disable-standard-reference-category';

describe('DisableStandardReferenceCategoryUseCase', () => {
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
    enabledStandardCategoryIds: ['species', 'titles'],
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws if the universe does not exist', async () => {
    universeRepository.findById.mockResolvedValue(null);

    const useCase = createDisableStandardReferenceCategoryUseCase({
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

    const useCase = createDisableStandardReferenceCategoryUseCase({
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

  it('propagates an error if trying to disable a Core category', async () => {
    const universe = createUniverse();

    universeRepository.findById.mockResolvedValue(universe);

    const useCase = createDisableStandardReferenceCategoryUseCase({
      universeRepository: universeRepository as UniverseRepository,
    });

    await expect(
      useCase({
        universeId: universe.id,
        categoryId: 'species',
        getCurrentTime: jest.fn(),
      }),
    ).rejects.toThrow();

    expect(universeRepository.update).not.toHaveBeenCalled();
  });

  it('propagates an error if the standard category does not exist', async () => {
    const universe = createUniverse();

    universeRepository.findById.mockResolvedValue(universe);

    const useCase = createDisableStandardReferenceCategoryUseCase({
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
