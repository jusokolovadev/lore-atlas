import { createGetReferenceCategoryByIdUseCase } from './get-reference-category-by-id';

import type { ReferenceCategoryRepository } from '../repositories/reference-category-repository';
import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';

describe('createGetReferenceCategoryByIdUseCase', () => {
  let repository: jest.Mocked<ReferenceCategoryRepository>;

  const category: CustomReferenceCategory = {
    id: 'category-1',
    universeId: 'universe-1',
    name: 'Species',
    description: null,
    createdAt: '2026-11-01T12:00:00.000Z',
    updatedAt: '2026-11-01T12:00:00.000Z',
    deletedAt: null,
    revision: 1,
  };

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

  it('returns the category when found', async () => {
    repository.findById.mockResolvedValue(category);

    const useCase = createGetReferenceCategoryByIdUseCase({
      referenceCategoryRepository: repository,
    });

    const result = await useCase('category-1');

    expect(result).toBe(category);
    expect(repository.findById).toHaveBeenCalledWith('category-1');
  });

  it('returns deleted categories', async () => {
    const deletedCategory: CustomReferenceCategory = {
      ...category,
      deletedAt: '2026-11-02T12:00:00.000Z',
      revision: 2,
    };

    repository.findById.mockResolvedValue(deletedCategory);

    const useCase = createGetReferenceCategoryByIdUseCase({
      referenceCategoryRepository: repository,
    });

    const result = await useCase('category-1');

    expect(result).toBe(deletedCategory);
  });

  it('returns null when the category does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    const useCase = createGetReferenceCategoryByIdUseCase({
      referenceCategoryRepository: repository,
    });

    const result = await useCase('missing-category');

    expect(result).toBeNull();
    expect(repository.findById).toHaveBeenCalledWith('missing-category');
  });
});
