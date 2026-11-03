import { createRestoreReferenceCategoryUseCase } from './restore-reference-category';

import type { ReferenceCategoryRepository } from '../repositories/reference-category-repository';
import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';

import { ReferenceCategoryApplicationError } from '../errors/reference-category-application-errors';
import { ReferenceCategoryError } from '../../domain/errors/reference-category-errors';

describe('createRestoreReferenceCategoryUseCase', () => {
  let repository: jest.Mocked<ReferenceCategoryRepository>;
  let getCurrentTime: jest.Mock;

  const deletedCategory: CustomReferenceCategory = {
    id: 'category-1',
    universeId: 'universe-1',
    name: 'Species',
    description: null,
    createdAt: '2026-11-01T12:00:00.000Z',
    updatedAt: '2026-11-02T12:00:00.000Z',
    deletedAt: '2026-11-02T12:00:00.000Z',
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

    repository.findById.mockResolvedValue(deletedCategory);
    repository.findActiveByName.mockResolvedValue(null);
    repository.save.mockResolvedValue(undefined);

    getCurrentTime = jest.fn().mockReturnValue(now);
  });

  it('restores a deleted category', async () => {
    const useCase = createRestoreReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('category-1');

    expect(result.deletedAt).toBeNull();
    expect(result.updatedAt).toBe(now);
    expect(repository.save).toHaveBeenCalledWith(result);
  });

  it('preserves the category data', async () => {
    const useCase = createRestoreReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('category-1');

    expect(result).toEqual({
      ...deletedCategory,
      deletedAt: null,
      updatedAt: now,
    });
  });

  it('does not mutate the original category', async () => {
    const useCase = createRestoreReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await useCase('category-1');

    expect(deletedCategory.deletedAt).not.toBeNull();
    expect(deletedCategory.updatedAt).toBe('2026-11-02T12:00:00.000Z');
  });

  it('throws when the category does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    const useCase = createRestoreReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('missing-category')).rejects.toThrow(
      ReferenceCategoryApplicationError,
    );

    expect(repository.save).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('throws when the category is already active', async () => {
    repository.findById.mockResolvedValue({
      ...deletedCategory,
      deletedAt: null,
    });

    const useCase = createRestoreReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('category-1')).rejects.toThrow(ReferenceCategoryError);

    expect(repository.findActiveByName).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('throws when another active category has the same name', async () => {
    repository.findActiveByName.mockResolvedValue({
      ...deletedCategory,
      id: 'category-2',
      deletedAt: null,
    });

    const useCase = createRestoreReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('category-1')).rejects.toMatchObject({
      code: 'DUPLICATE_NAME',
    });

    expect(repository.save).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('allows restoration when the repository returns the same category', async () => {
    repository.findActiveByName.mockResolvedValue(deletedCategory);

    const useCase = createRestoreReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('category-1');

    expect(result.deletedAt).toBeNull();
    expect(repository.save).toHaveBeenCalledWith(result);
  });
});
