import { createDeleteReferenceCategoryUseCase } from './delete-reference-category';

import type { ReferenceCategoryRepository } from '../repositories/reference-category-repository';
import type { ReferenceCategoryDeletionRepository } from '../repositories/reference-category-deletion-repository';
import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';

import {
  ReferenceCategoryApplicationError,
  ReferenceCategoryConcurrencyError,
} from '../errors/reference-category-application-errors';
import { ReferenceCategoryError } from '../../domain/errors/reference-category-errors';

describe('createDeleteReferenceCategoryUseCase', () => {
  let repository: jest.Mocked<ReferenceCategoryRepository>;
  let deletionRepository: jest.Mocked<ReferenceCategoryDeletionRepository>;
  let getCurrentTime: jest.Mock;

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

  const now = '2026-11-03T12:00:00.000Z';

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findActiveByName: jest.fn(),
      findAllActiveByUniverseId: jest.fn(),
      update: jest.fn(),
      restore: jest.fn(),
      createIfUniverseActive: jest.fn(),
    };

    deletionRepository = {
      deleteReferenceCategory: jest.fn(),
    };

    repository.findById.mockResolvedValue(category);
    deletionRepository.deleteReferenceCategory.mockResolvedValue(undefined);

    getCurrentTime = jest.fn().mockReturnValue(now);
  });

  it('soft deletes the category and increments its revision', async () => {
    const useCase = createDeleteReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      deletionRepository,
      getCurrentTime,
    });

    const result = await useCase('category-1');

    expect(result).toEqual({
      ...category,
      deletedAt: now,
      updatedAt: now,
      revision: 2,
    });

    expect(deletionRepository.deleteReferenceCategory).toHaveBeenCalledWith(result, 1);
  });

  it('preserves the category data', async () => {
    const useCase = createDeleteReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      deletionRepository,
      getCurrentTime,
    });

    const result = await useCase('category-1');

    expect(result.id).toBe(category.id);
    expect(result.universeId).toBe(category.universeId);
    expect(result.name).toBe(category.name);
    expect(result.description).toBe(category.description);
    expect(result.createdAt).toBe(category.createdAt);
  });

  it('does not mutate the original category', async () => {
    const useCase = createDeleteReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      deletionRepository,
      getCurrentTime,
    });

    await useCase('category-1');

    expect(category.deletedAt).toBeNull();
    expect(category.updatedAt).toBe('2026-11-01T12:00:00.000Z');
    expect(category.revision).toBe(1);
  });

  it('passes the expected revision to the deletion repository', async () => {
    repository.findById.mockResolvedValue({
      ...category,
      revision: 5,
    });

    const useCase = createDeleteReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      deletionRepository,
      getCurrentTime,
    });

    const result = await useCase('category-1');

    expect(result.revision).toBe(6);
    expect(deletionRepository.deleteReferenceCategory).toHaveBeenCalledWith(result, 5);
  });

  it('throws when the category does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    const useCase = createDeleteReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      deletionRepository,
      getCurrentTime,
    });

    await expect(useCase('missing-category')).rejects.toThrow(
      ReferenceCategoryApplicationError,
    );

    expect(deletionRepository.deleteReferenceCategory).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('throws when the category is already deleted', async () => {
    repository.findById.mockResolvedValue({
      ...category,
      deletedAt: '2026-11-02T12:00:00.000Z',
    });

    const useCase = createDeleteReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      deletionRepository,
      getCurrentTime,
    });

    await expect(useCase('category-1')).rejects.toThrow(ReferenceCategoryError);

    expect(deletionRepository.deleteReferenceCategory).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('throws when the category was concurrently modified', async () => {
    deletionRepository.deleteReferenceCategory.mockRejectedValue(
      new ReferenceCategoryConcurrencyError(),
    );

    const useCase = createDeleteReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      deletionRepository,
      getCurrentTime,
    });

    await expect(useCase('category-1')).rejects.toMatchObject({
      code: 'CONCURRENT_MODIFICATION',
    });
  });

  it('propagates unexpected deletion repository errors', async () => {
    const error = new Error('Database failure');

    deletionRepository.deleteReferenceCategory.mockRejectedValue(error);

    const useCase = createDeleteReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      deletionRepository,
      getCurrentTime,
    });

    await expect(useCase('category-1')).rejects.toBe(error);
  });
});
