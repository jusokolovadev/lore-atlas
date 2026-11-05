import { createGetReferenceCategoriesByUniverseIdUseCase } from './get-reference-categories-by-universe-id';

import type { ReferenceCategoryRepository } from '../repositories/reference-category-repository';
import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';

describe('createGetReferenceCategoriesByUniverseIdUseCase', () => {
  let repository: jest.Mocked<ReferenceCategoryRepository>;

  const categories: CustomReferenceCategory[] = [
    {
      id: 'category-1',
      universeId: 'universe-1',
      name: 'Species',
      description: null,
      createdAt: '2026-11-01T12:00:00.000Z',
      updatedAt: '2026-11-01T12:00:00.000Z',
      deletedAt: null,
      revision: 1,
    },
    {
      id: 'category-2',
      universeId: 'universe-1',
      name: 'Languages',
      description: null,
      createdAt: '2026-11-02T12:00:00.000Z',
      updatedAt: '2026-11-02T12:00:00.000Z',
      deletedAt: null,
      revision: 1,
    },
  ];

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findActiveByName: jest.fn(),
      findAllActiveByUniverseId: jest.fn(),
      update: jest.fn(),
      restore: jest.fn(),
      createIfUniverseActive: jest.fn(),
    };
  });

  it('returns active categories for the specified universe', async () => {
    repository.findAllActiveByUniverseId.mockResolvedValue(categories);

    const useCase = createGetReferenceCategoriesByUniverseIdUseCase({
      referenceCategoryRepository: repository,
    });

    const result = await useCase('universe-1');

    expect(result).toBe(categories);
    expect(repository.findAllActiveByUniverseId).toHaveBeenCalledWith('universe-1');
  });

  it('returns an empty array when no categories exist', async () => {
    repository.findAllActiveByUniverseId.mockResolvedValue([]);

    const useCase = createGetReferenceCategoriesByUniverseIdUseCase({
      referenceCategoryRepository: repository,
    });

    const result = await useCase('universe-1');

    expect(result).toEqual([]);
    expect(repository.findAllActiveByUniverseId).toHaveBeenCalledWith('universe-1');
  });
});
