import type { ReferenceEntry } from '../../domain/models/reference-entry';
import { ReferenceEntryError } from '../../domain/errors/reference-entry-error';

import {
  ReferenceEntryConcurrencyError,
  ReferenceEntryNameConflictError,
} from '../errors/reference-entry-repository-errors';
import type { ReferenceEntryRepository } from '../repositories/reference-entry-repository';

import { createUpdateReferenceEntryUseCase } from './update-reference-entry';

describe('createUpdateReferenceEntryUseCase', () => {
  let repository: jest.Mocked<ReferenceEntryRepository>;
  let getCurrentTime: jest.Mock;

  const now = '2026-11-03T13:00:00.000Z';

  const existing: ReferenceEntry = {
    id: 'entry-1',
    universeId: 'universe-1',
    categoryType: 'custom',
    categoryId: 'category-1',
    name: 'Elves',
    description: 'An ancient race.',
    image: null,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-02T10:00:00.000Z',
    deletedAt: null,
    revision: 1,
  };

  beforeEach(() => {
    repository = {
      findById: jest.fn().mockResolvedValue(existing),
      findAllActiveByCategory: jest.fn(),
      findAllActiveByUniverseId: jest.fn(),
      createIfCategoryAvailable: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      restore: jest.fn(),
    };

    getCurrentTime = jest.fn().mockReturnValue(now);
  });

  it('should update and persist a reference entry', async () => {
    const useCase = createUpdateReferenceEntryUseCase({
      referenceEntryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('entry-1', {
      name: '  High Elves  ',
      description: 'An ancient and powerful race.',
    });

    expect(result).toEqual({
      ...existing,
      name: 'High Elves',
      description: 'An ancient and powerful race.',
      updatedAt: now,
      revision: 2,
    });

    expect(repository.update).toHaveBeenCalledWith(result, existing.revision);

    expect(getCurrentTime).toHaveBeenCalledTimes(1);
  });

  it('should return the existing entry without saving when nothing changes', async () => {
    const useCase = createUpdateReferenceEntryUseCase({
      referenceEntryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('entry-1', {
      name: 'Elves',
      description: 'An ancient race.',
    });

    expect(result).toBe(existing);
    expect(repository.update).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('should throw NOT_FOUND when the entry does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    const useCase = createUpdateReferenceEntryUseCase({
      referenceEntryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('missing-entry', { name: 'Elves' })).rejects.toMatchObject({
      name: 'ReferenceEntryApplicationError',
      code: 'NOT_FOUND',
    });

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should propagate domain validation errors', async () => {
    const useCase = createUpdateReferenceEntryUseCase({
      referenceEntryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('entry-1', { name: '   ' })).rejects.toBeInstanceOf(
      ReferenceEntryError,
    );

    expect(repository.update).not.toHaveBeenCalled();
  });

  it('should map a name conflict to DUPLICATE_NAME', async () => {
    repository.update.mockRejectedValue(new ReferenceEntryNameConflictError());

    const useCase = createUpdateReferenceEntryUseCase({
      referenceEntryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('entry-1', { name: 'Dwarves' })).rejects.toMatchObject({
      code: 'DUPLICATE_NAME',
    });
  });

  it('should map a concurrency conflict to CONCURRENT_MODIFICATION', async () => {
    repository.update.mockRejectedValue(new ReferenceEntryConcurrencyError());

    const useCase = createUpdateReferenceEntryUseCase({
      referenceEntryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('entry-1', { name: 'Dwarves' })).rejects.toMatchObject({
      code: 'CONCURRENT_MODIFICATION',
    });
  });

  it('should propagate unexpected repository errors', async () => {
    const error = new Error('Database failure');

    repository.update.mockRejectedValue(error);

    const useCase = createUpdateReferenceEntryUseCase({
      referenceEntryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('entry-1', { name: 'Dwarves' })).rejects.toBe(error);
  });

  it('should preserve immutable entry fields', async () => {
    const useCase = createUpdateReferenceEntryUseCase({
      referenceEntryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('entry-1', {
      name: 'Dwarves',
    });

    expect(result.id).toBe(existing.id);
    expect(result.universeId).toBe(existing.universeId);
    expect(result.categoryType).toBe(existing.categoryType);
    expect(result.categoryId).toBe(existing.categoryId);
    expect(result.createdAt).toBe(existing.createdAt);
  });
});
