import type { Universe } from 'src/features/universes/domain/models/universe';
import type { UniverseRepository } from 'src/features/universes/application/repositories/universe-repository';
import type { ReferenceCategoryRepository } from '../repositories/reference-category-repository';
import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';

import { getAllStandardReferenceCategories } from '../../domain/catalog/standard-reference-category-catalog';

import { createGetReferenceCategoriesByUniverse } from './get-reference-categories-by-universe';

describe('getReferenceCategoriesByUniverse', () => {
  const universe: Universe = {
    id: 'universe-1',
    name: 'Test Universe',
    description: null,
    coverImage: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    revision: 1,
    enabledStandardCategoryIds: ['species', 'organization-types'],
  };

  const customCategory: CustomReferenceCategory = {
    id: 'custom-category-1',
    universeId: 'universe-1',
    name: 'Custom Category',
    description: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    revision: 1,
  };

  const universeRepository: jest.Mocked<UniverseRepository> = {
    findById: jest.fn(),
    findAllActive: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    restore: jest.fn(),
  };

  const referenceCategoryRepository: jest.Mocked<ReferenceCategoryRepository> = {
    findById: jest.fn(),
    findActiveByName: jest.fn(),
    findAllActiveByUniverseId: jest.fn(),
    createIfUniverseActive: jest.fn(),
    update: jest.fn(),
    restore: jest.fn(),
  };

  const getReferenceCategoriesByUniverse = createGetReferenceCategoriesByUniverse({
    universeRepository,
    referenceCategoryRepository,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns enabled standard categories', async () => {
    universeRepository.findById.mockResolvedValue(universe);
    referenceCategoryRepository.findAllActiveByUniverseId.mockResolvedValue([]);

    const result = await getReferenceCategoriesByUniverse({
      universeId: universe.id,
    });

    const expectedCategories = getAllStandardReferenceCategories()
      .filter((category) => universe.enabledStandardCategoryIds.includes(category.id))
      .map((category) => ({
        type: 'standard' as const,
        category,
      }));

    expect(result).toEqual(expectedCategories);
  });

  it('does not return disabled standard categories', async () => {
    universeRepository.findById.mockResolvedValue(universe);
    referenceCategoryRepository.findAllActiveByUniverseId.mockResolvedValue([]);

    const result = await getReferenceCategoriesByUniverse({
      universeId: universe.id,
    });

    const returnedIds = result
      .filter((item) => item.type === 'standard')
      .map((item) => item.category.id);

    expect(returnedIds).not.toContain('titles');
    expect(returnedIds).not.toContain('ranks');
  });

  it('returns active custom categories', async () => {
    universeRepository.findById.mockResolvedValue(universe);
    referenceCategoryRepository.findAllActiveByUniverseId.mockResolvedValue([
      customCategory,
    ]);

    const result = await getReferenceCategoriesByUniverse({
      universeId: universe.id,
    });

    expect(result).toContainEqual({
      type: 'custom',
      category: customCategory,
    });
  });

  it('returns standard categories before custom categories', async () => {
    universeRepository.findById.mockResolvedValue(universe);
    referenceCategoryRepository.findAllActiveByUniverseId.mockResolvedValue([
      customCategory,
    ]);

    const result = await getReferenceCategoriesByUniverse({
      universeId: universe.id,
    });

    const firstCustomCategoryIndex = result.findIndex((item) => item.type === 'custom');

    const lastStandardCategoryIndex = result.reduce(
      (lastIndex, item, index) => (item.type === 'standard' ? index : lastIndex),
      -1,
    );

    expect(lastStandardCategoryIndex).toBeLessThan(firstCustomCategoryIndex);
  });

  it('returns only standard categories when there are no custom categories', async () => {
    universeRepository.findById.mockResolvedValue(universe);
    referenceCategoryRepository.findAllActiveByUniverseId.mockResolvedValue([]);

    const result = await getReferenceCategoriesByUniverse({
      universeId: universe.id,
    });

    expect(result.every((item) => item.type === 'standard')).toBe(true);
  });

  it('throws when universe does not exist', async () => {
    universeRepository.findById.mockResolvedValue(null);

    await expect(
      getReferenceCategoriesByUniverse({
        universeId: 'unknown',
      }),
    ).rejects.toThrow('Universe "unknown" not found.');

    expect(referenceCategoryRepository.findAllActiveByUniverseId).not.toHaveBeenCalled();
  });

  it('throws when universe is deleted', async () => {
    universeRepository.findById.mockResolvedValue({
      ...universe,
      deletedAt: '2026-01-02T00:00:00.000Z',
    });

    await expect(
      getReferenceCategoriesByUniverse({
        universeId: universe.id,
      }),
    ).rejects.toThrow(`Universe "${universe.id}" not found.`);

    expect(referenceCategoryRepository.findAllActiveByUniverseId).not.toHaveBeenCalled();
  });

  it('passes universe ID to repositories', async () => {
    universeRepository.findById.mockResolvedValue(universe);
    referenceCategoryRepository.findAllActiveByUniverseId.mockResolvedValue([]);

    await getReferenceCategoriesByUniverse({
      universeId: universe.id,
    });

    expect(universeRepository.findById).toHaveBeenCalledWith(universe.id);
    expect(referenceCategoryRepository.findAllActiveByUniverseId).toHaveBeenCalledWith(
      universe.id,
    );
  });
});
