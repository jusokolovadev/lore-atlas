import { createDeleteReferenceCategoryUseCase } from './delete-reference-category';

import type { ReferenceCategoryRepository } from '../repositories/reference-category-repository';
import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';

import { ReferenceCategoryApplicationError } from '../errors/reference-category-application-errors';
import { ReferenceCategoryError } from '../../domain/errors/reference-category-errors';

describe('createDeleteReferenceCategoryUseCase', () => {
  let repository: jest.Mocked<ReferenceCategoryRepository>;
  let getCurrentTime: jest.Mock;

  const category: CustomReferenceCategory = {
    id: 'category-1',
    universeId: 'universe-1',
    name: 'Species',
    description: null,
    createdAt: '2026-11-01T12:00:00.000Z',
    updatedAt: '2026-11-01T12:00:00.000Z',
    deletedAt: null,
  };

  const now = '2026-11-03T12:00:00.000Z';

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findActiveByName: jest.fn(),
      findAllActiveByUniverseId: jest.fn(),
      save: jest.fn(),
      createIfUniverseActive: jest.fn(),
    };

    repository.findById.mockResolvedValue(category);
    repository.save.mockResolvedValue(undefined);

    getCurrentTime = jest.fn().mockReturnValue(now);
  });

  it('soft deletes the category', async () => {
    const useCase = createDeleteReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('category-1');

    expect(result.deletedAt).toBe(now);
    expect(result.updatedAt).toBe(now);
    expect(repository.save).toHaveBeenCalledWith(result);
  });

  it('preserves the category data', async () => {
    const useCase = createDeleteReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('category-1');

    expect(result).toEqual({
      ...category,
      deletedAt: now,
      updatedAt: now,
    });
  });

  it('does not mutate the original category', async () => {
    const useCase = createDeleteReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await useCase('category-1');

    expect(category.deletedAt).toBeNull();
    expect(category.updatedAt).toBe('2026-11-01T12:00:00.000Z');
  });

  it('throws when the category does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    const useCase = createDeleteReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('missing-category')).rejects.toThrow(
      ReferenceCategoryApplicationError,
    );

    expect(repository.save).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('throws when the category is already deleted', async () => {
    repository.findById.mockResolvedValue({
      ...category,
      deletedAt: '2026-11-02T12:00:00.000Z',
    });

    const useCase = createDeleteReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('category-1')).rejects.toThrow(ReferenceCategoryError);

    expect(repository.save).not.toHaveBeenCalled();
  });
});
