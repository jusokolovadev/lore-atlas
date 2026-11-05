import { createUpdateReferenceCategoryUseCase } from './update-reference-category';

import type { ReferenceCategoryRepository } from '../repositories/reference-category-repository';
import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';

import {
  ReferenceCategoryApplicationError,
  ReferenceCategoryNameConflictError,
  ReferenceCategoryConcurrencyError,
} from '../errors/reference-category-application-errors';

describe('createUpdateReferenceCategoryUseCase', () => {
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

    repository.findById.mockResolvedValue(category);
    repository.update.mockResolvedValue(undefined);

    getCurrentTime = jest.fn().mockReturnValue(now);
  });

  it('updates the category name and increments revision', async () => {
    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('category-1', {
      name: 'Languages',
    });

    expect(result).toEqual({
      ...category,
      name: 'Languages',
      updatedAt: now,
      revision: 2,
    });

    expect(repository.update).toHaveBeenCalledWith(result, 1);
    expect(getCurrentTime).toHaveBeenCalledTimes(1);
  });

  it('updates the description and increments revision', async () => {
    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('category-1', {
      description: 'Available species',
    });

    expect(result.description).toBe('Available species');
    expect(result.revision).toBe(2);
    expect(result.updatedAt).toBe(now);

    expect(repository.update).toHaveBeenCalledWith(result, 1);
    expect(repository.findActiveByName).not.toHaveBeenCalled();
  });

  it('trims the updated name before saving', async () => {
    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('category-1', {
      name: '  Languages  ',
    });

    expect(result.name).toBe('Languages');
    expect(repository.update).toHaveBeenCalledWith(result, 1);
    expect(repository.findActiveByName).not.toHaveBeenCalled();
  });

  it('allows keeping the current name without updating the category', async () => {
    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('category-1', {
      name: 'Species',
    });

    expect(result).toBe(category);
    expect(repository.update).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('does not update when there are no changes', async () => {
    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('category-1', {});

    expect(result).toBe(category);
    expect(repository.update).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('does not check name uniqueness in Application', async () => {
    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await useCase('category-1', {
      name: 'Languages',
    });

    expect(repository.findActiveByName).not.toHaveBeenCalled();
  });

  it('throws when another category has the same name', async () => {
    repository.update.mockRejectedValue(new ReferenceCategoryNameConflictError());

    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await expect(
      useCase('category-1', {
        name: 'Languages',
      }),
    ).rejects.toMatchObject({
      code: 'DUPLICATE_NAME',
    });
  });

  it('throws when the category was concurrently modified', async () => {
    repository.update.mockRejectedValue(new ReferenceCategoryConcurrencyError());

    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await expect(
      useCase('category-1', {
        name: 'Languages',
      }),
    ).rejects.toMatchObject({
      code: 'CONCURRENT_MODIFICATION',
    });
  });

  it('passes the expected revision to the repository', async () => {
    repository.findById.mockResolvedValue({
      ...category,
      revision: 5,
    });

    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('category-1', {
      name: 'Languages',
    });

    expect(result.revision).toBe(6);
    expect(repository.update).toHaveBeenCalledWith(result, 5);
  });

  it('throws when the category does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await expect(
      useCase('missing-category', {
        name: 'Languages',
      }),
    ).rejects.toThrow(ReferenceCategoryApplicationError);

    expect(repository.update).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('does not update a deleted category', async () => {
    repository.findById.mockResolvedValue({
      ...category,
      deletedAt: '2026-11-02T12:00:00.000Z',
    });

    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await expect(
      useCase('category-1', {
        name: 'Languages',
      }),
    ).rejects.toThrow();

    expect(repository.update).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('does not update when the new name is empty', async () => {
    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await expect(
      useCase('category-1', {
        name: '   ',
      }),
    ).rejects.toThrow();

    expect(repository.update).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('propagates unexpected repository errors', async () => {
    const error = new Error('Database failure');

    repository.update.mockRejectedValue(error);

    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await expect(
      useCase('category-1', {
        name: 'Languages',
      }),
    ).rejects.toBe(error);
  });
});
