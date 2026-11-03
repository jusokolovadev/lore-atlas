import type { UniverseRepository } from 'src/features/universes/application/repositories/universe-repository';
import type { ReferenceCategoryRepository } from 'src/features/reference-categories/application/repositories/reference-category-repository';
import type { UniverseDeletionRepository } from 'src/features/universes/application/repositories/universe-deletion-repository';

import { createAppServices } from './create-app-services';

describe('createAppServices', () => {
  let universeRepository: jest.Mocked<UniverseRepository>;
  let referenceCategoryRepository: jest.Mocked<ReferenceCategoryRepository>;
  let universeDeletionRepository: jest.Mocked<UniverseDeletionRepository>;

  beforeEach(() => {
    universeRepository = {
      findById: jest.fn().mockResolvedValue(null),
      findAllActive: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
    };

    referenceCategoryRepository = {
      findById: jest.fn().mockResolvedValue(null),
      findActiveByName: jest.fn().mockResolvedValue(null),
      findAllActiveByUniverseId: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
      createIfUniverseActive: jest.fn().mockResolvedValue(true),
    };

    universeDeletionRepository = {
      deleteUniverseWithCategories: jest.fn().mockResolvedValue(undefined),
    };
  });

  it('should create universe services with the provided dependencies', async () => {
    const services = createAppServices({
      universeRepository,
      referenceCategoryRepository,
      universeDeletionRepository,
      generateId: () => 'universe-1',
      getCurrentTime: () => '2026-01-01T00:00:00.000Z',
    });

    const universe = await services.createUniverse({
      name: ' Middle-earth ',
    });

    expect(universe).toEqual({
      id: 'universe-1',
      name: 'Middle-earth',
      description: null,
      coverImage: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      deletedAt: null,
    });

    expect(universeRepository.save).toHaveBeenCalledWith(universe);
  });

  it('should use the same universe repository for all universe services', async () => {
    const services = createAppServices({
      universeRepository,
      referenceCategoryRepository,
      universeDeletionRepository,
    });

    await services.getActiveUniverses();
    await services.getUniverseById('universe-1');

    expect(universeRepository.findAllActive).toHaveBeenCalledTimes(1);
    expect(universeRepository.findById).toHaveBeenCalledWith('universe-1');
  });

  it('should use the provided repositories for reference category services', async () => {
    const services = createAppServices({
      universeRepository,
      referenceCategoryRepository,
      universeDeletionRepository,
    });

    await services.getReferenceCategoryById('category-1');
    await services.getReferenceCategoriesByUniverseId('universe-1');

    expect(referenceCategoryRepository.findById).toHaveBeenCalledWith('category-1');

    expect(referenceCategoryRepository.findAllActiveByUniverseId).toHaveBeenCalledWith(
      'universe-1',
    );
  });

  it('should use the reference category repository when creating a category', async () => {
    const services = createAppServices({
      universeRepository,
      referenceCategoryRepository,
      universeDeletionRepository,
      generateId: () => 'category-1',
      getCurrentTime: () => '2026-01-01T00:00:00.000Z',
    });

    await services.createReferenceCategory({
      universeId: 'universe-1',
      name: 'Species',
    });

    expect(referenceCategoryRepository.createIfUniverseActive).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'category-1',
        universeId: 'universe-1',
        name: 'Species',
        deletedAt: null,
      }),
    );

    expect(universeRepository.findById).not.toHaveBeenCalled();
    expect(referenceCategoryRepository.save).not.toHaveBeenCalled();
  });

  it('should use the provided repositories when deleting a universe', async () => {
    universeRepository.findById.mockResolvedValue({
      id: 'universe-1',
      name: 'Middle-earth',
      description: null,
      coverImage: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      deletedAt: null,
    });

    const services = createAppServices({
      universeRepository,
      referenceCategoryRepository,
      universeDeletionRepository,
      getCurrentTime: () => '2026-01-02T00:00:00.000Z',
    });

    await services.deleteUniverse('universe-1');

    expect(referenceCategoryRepository.findAllActiveByUniverseId).toHaveBeenCalledWith(
      'universe-1',
    );

    expect(universeDeletionRepository.deleteUniverseWithCategories).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'universe-1',
        deletedAt: '2026-01-02T00:00:00.000Z',
      }),
      [],
    );
  });
});
