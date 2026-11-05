import { createRestoreReferenceCategoryUseCase } from './restore-reference-category';

import type { ReferenceCategoryRepository } from '../repositories/reference-category-repository';
import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';

import {
  ReferenceCategoryApplicationError,
  ReferenceCategoryNameConflictError,
  ReferenceCategoryConcurrencyError,
} from '../errors/reference-category-application-errors';
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
    revision: 2,
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

    repository.findById.mockResolvedValue(deletedCategory);
    repository.restore.mockResolvedValue(undefined);

    getCurrentTime = jest.fn().mockReturnValue(now);
  });

  it('restores a deleted category and increments revision', async () => {
    const useCase = createRestoreReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('category-1');

    expect(result).toEqual({
      ...deletedCategory,
      deletedAt: null,
      updatedAt: now,
      revision: 3,
    });

    expect(repository.restore).toHaveBeenCalledWith(result, 2);
    expect(getCurrentTime).toHaveBeenCalledTimes(1);
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
      revision: 3,
    });

    expect(result.id).toBe(deletedCategory.id);
    expect(result.universeId).toBe(deletedCategory.universeId);
    expect(result.name).toBe(deletedCategory.name);
    expect(result.description).toBe(deletedCategory.description);
    expect(result.createdAt).toBe(deletedCategory.createdAt);
  });

  it('does not mutate the original category', async () => {
    const useCase = createRestoreReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await useCase('category-1');

    expect(deletedCategory.deletedAt).not.toBeNull();
    expect(deletedCategory.updatedAt).toBe('2026-11-02T12:00:00.000Z');
    expect(deletedCategory.revision).toBe(2);
  });

  it('passes the expected revision to the repository', async () => {
    repository.findById.mockResolvedValue({
      ...deletedCategory,
      revision: 5,
    });

    const useCase = createRestoreReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('category-1');

    expect(result.revision).toBe(6);
    expect(repository.restore).toHaveBeenCalledWith(result, 5);
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

    expect(repository.restore).not.toHaveBeenCalled();
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

    expect(repository.restore).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('throws when another active category has the same name', async () => {
    repository.restore.mockRejectedValue(new ReferenceCategoryNameConflictError());

    const useCase = createRestoreReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('category-1')).rejects.toMatchObject({
      code: 'DUPLICATE_NAME',
    });

    expect(repository.restore).toHaveBeenCalledTimes(1);
  });

  it('throws when the category was concurrently modified', async () => {
    repository.restore.mockRejectedValue(new ReferenceCategoryConcurrencyError());

    const useCase = createRestoreReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('category-1')).rejects.toMatchObject({
      code: 'CONCURRENT_MODIFICATION',
    });
  });

  it('does not check name uniqueness in Application', async () => {
    const useCase = createRestoreReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await useCase('category-1');

    expect(repository.findActiveByName).not.toHaveBeenCalled();
  });

  it('propagates unexpected repository errors', async () => {
    const error = new Error('Database failure');

    repository.restore.mockRejectedValue(error);

    const useCase = createRestoreReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('category-1')).rejects.toBe(error);
  });
});
