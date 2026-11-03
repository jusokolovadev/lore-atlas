import { createUpdateReferenceCategoryUseCase } from './update-reference-category';

import type { ReferenceCategoryRepository } from '../repositories/reference-category-repository';
import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';

import { ReferenceCategoryApplicationError } from '../errors/reference-category-application-errors';

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
  };

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findActiveByName: jest.fn(),
      findAllActiveByUniverseId: jest.fn(),
      save: jest.fn(),
      createIfUniverseActive: jest.fn(),
    };

    repository.findById.mockResolvedValue(category);
    repository.findActiveByName.mockResolvedValue(null);
    repository.save.mockResolvedValue(undefined);

    getCurrentTime = jest.fn().mockReturnValue('2026-11-03T12:00:00.000Z');
  });

  it('updates the category name', async () => {
    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('category-1', {
      name: 'Languages',
    });

    expect(result.name).toBe('Languages');
    expect(result.updatedAt).toBe('2026-11-03T12:00:00.000Z');
    expect(repository.save).toHaveBeenCalledWith(result);
  });

  it('updates the description without checking name uniqueness', async () => {
    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('category-1', {
      description: 'Available species',
    });

    expect(result.description).toBe('Available species');
    expect(repository.findActiveByName).not.toHaveBeenCalled();
    expect(repository.save).toHaveBeenCalledWith(result);
  });

  it('trims the updated name before checking uniqueness', async () => {
    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await useCase('category-1', {
      name: '  Languages  ',
    });

    expect(repository.findActiveByName).toHaveBeenCalledWith('universe-1', 'Languages');
  });

  it('allows keeping the current name', async () => {
    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('category-1', {
      name: 'Species',
    });

    expect(result).toBe(category);
    expect(repository.findActiveByName).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('throws when another category has the same name', async () => {
    repository.findActiveByName.mockResolvedValue({
      ...category,
      id: 'category-2',
    });

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

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('does not treat the current category as a duplicate', async () => {
    repository.findActiveByName.mockResolvedValue(category);

    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('category-1', {
      name: 'Languages',
    });

    expect(result.name).toBe('Languages');
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

    expect(repository.save).not.toHaveBeenCalled();
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

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('does not update when there are no changes', async () => {
    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('category-1', {});

    expect(result).toBe(category);
    expect(repository.save).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('does not check uniqueness when only description changes', async () => {
    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await useCase('category-1', {
      description: 'Updated description',
    });

    expect(repository.findActiveByName).not.toHaveBeenCalled();
  });

  it('does not check uniqueness when the updated name is invalid', async () => {
    const useCase = createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository: repository,
      getCurrentTime,
    });

    await expect(
      useCase('category-1', {
        name: '   ',
      }),
    ).rejects.toThrow();

    expect(repository.findActiveByName).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
  });
});
