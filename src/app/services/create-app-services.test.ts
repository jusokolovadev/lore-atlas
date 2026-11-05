import type { UniverseRepository } from 'src/features/universes/application/repositories/universe-repository';
import type { UniverseDeletionRepository } from 'src/features/universes/application/repositories/universe-deletion-repository';

import type { ReferenceCategoryRepository } from 'src/features/reference-categories/application/repositories/reference-category-repository';
import type { ReferenceCategoryDeletionRepository } from 'src/features/reference-categories/application/repositories/reference-category-deletion-repository';

import type { ReferenceEntryRepository } from 'src/features/reference-entry/application/repositories/reference-entry-repository';
import type { ReferenceEntryDeletionRepository } from 'src/features/reference-entry/application/repositories/reference-entry-deletion-repository';

import { createAppServices } from './create-app-services';

describe('createAppServices', () => {
  let universeRepository: jest.Mocked<UniverseRepository>;
  let referenceCategoryRepository: jest.Mocked<ReferenceCategoryRepository>;
  let referenceCategoryDeletionRepository: jest.Mocked<ReferenceCategoryDeletionRepository>;
  let universeDeletionRepository: jest.Mocked<UniverseDeletionRepository>;
  let referenceEntryRepository: jest.Mocked<ReferenceEntryRepository>;
  let referenceEntryDeletionRepository: jest.Mocked<ReferenceEntryDeletionRepository>;

  beforeEach(() => {
    universeRepository = {
      findById: jest.fn().mockResolvedValue(null),
      findAllActive: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      restore: jest.fn().mockResolvedValue(undefined),
    };

    referenceCategoryRepository = {
      findById: jest.fn().mockResolvedValue(null),
      findActiveByName: jest.fn().mockResolvedValue(null),
      findAllActiveByUniverseId: jest.fn().mockResolvedValue([]),
      createIfUniverseActive: jest.fn().mockResolvedValue(true),
      update: jest.fn().mockResolvedValue(undefined),
      restore: jest.fn().mockResolvedValue(undefined),
    };

    referenceCategoryDeletionRepository = {
      deleteReferenceCategory: jest.fn().mockResolvedValue(undefined),
    };

    universeDeletionRepository = {
      deleteUniverseWithCategories: jest.fn().mockResolvedValue(undefined),
    };

    referenceEntryRepository = {
      findById: jest.fn().mockResolvedValue(null),
      findAllActiveByCategory: jest.fn().mockResolvedValue([]),
      findAllActiveByUniverseId: jest.fn().mockResolvedValue([]),
      createIfCategoryAvailable: jest.fn().mockResolvedValue(undefined),
      update: jest.fn().mockResolvedValue(undefined),
      restore: jest.fn().mockResolvedValue(undefined),
    };

    referenceEntryDeletionRepository = {
      deleteReferenceEntry: jest.fn().mockResolvedValue(undefined),
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
      revision: 1,
      enabledStandardCategoryIds: [
        'species',
        'organization-types',
        'titles',
        'ranks',
        'settlement-types',
      ],
    });

    expect(universeRepository.create).toHaveBeenCalledWith(universe);
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
        revision: 1,
      }),
    );

    expect(universeRepository.findById).not.toHaveBeenCalled();
  });

  it('should use the reference category repositories when deleting a category', async () => {
    const getCurrentTime = jest.fn(() => '2026-01-02T00:00:00.000Z');

    const category = {
      id: 'category-1',
      universeId: 'universe-1',
      name: 'Species',
      description: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      deletedAt: null,
      revision: 3,
    };

    referenceCategoryRepository.findById.mockResolvedValue(category);

    const services = createAppServices({
      universeRepository,
      referenceCategoryRepository,
      referenceCategoryDeletionRepository,
      universeDeletionRepository,
      getCurrentTime,
    });

    const result = await services.deleteReferenceCategory('category-1');

    expect(referenceCategoryRepository.findById).toHaveBeenCalledWith('category-1');
    expect(getCurrentTime).toHaveBeenCalledTimes(1);

    expect(
      referenceCategoryDeletionRepository.deleteReferenceCategory,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        ...category,
        deletedAt: '2026-01-02T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
        revision: 4,
      }),
      3,
    );

    expect(result).toEqual(
      expect.objectContaining({
        id: 'category-1',
        deletedAt: '2026-01-02T00:00:00.000Z',
        revision: 4,
      }),
    );
  });

  it('should use the universe deletion repository when deleting a universe', async () => {
    const getCurrentTime = jest.fn(() => '2026-01-02T00:00:00.000Z');

    const services = createAppServices({
      universeRepository,
      referenceCategoryRepository,
      universeDeletionRepository,
      getCurrentTime,
    });

    await services.deleteUniverse('universe-1');

    expect(getCurrentTime).toHaveBeenCalledTimes(1);

    expect(universeDeletionRepository.deleteUniverseWithCategories).toHaveBeenCalledWith(
      'universe-1',
      '2026-01-02T00:00:00.000Z',
    );

    expect(universeRepository.findById).not.toHaveBeenCalled();
    expect(universeRepository.update).not.toHaveBeenCalled();

    expect(referenceCategoryRepository.findAllActiveByUniverseId).not.toHaveBeenCalled();
  });

  it('should use the reference entry repositories when deleting an entry', async () => {
    const getCurrentTime = jest.fn(() => '2026-01-02T00:00:00.000Z');

    const entry = {
      id: 'entry-1',
      universeId: 'universe-1',
      categoryType: 'custom' as const,
      categoryId: 'category-1',
      name: 'Elves',
      description: null,
      image: null,
      revision: 3,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      deletedAt: null,
    };

    referenceEntryRepository.findById.mockResolvedValue(entry);

    const services = createAppServices({
      universeRepository,
      referenceCategoryRepository,
      universeDeletionRepository,
      referenceEntryRepository,
      referenceEntryDeletionRepository,
      getCurrentTime,
    });

    await services.deleteReferenceEntry('entry-1');

    expect(referenceEntryRepository.findById).toHaveBeenCalledWith('entry-1');
    expect(getCurrentTime).toHaveBeenCalledTimes(1);

    expect(referenceEntryDeletionRepository.deleteReferenceEntry).toHaveBeenCalledWith(
      'entry-1',
      3,
      '2026-01-02T00:00:00.000Z',
    );
  });
});
