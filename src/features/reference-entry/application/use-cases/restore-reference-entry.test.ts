import type { ReferenceEntry } from '../../domain/models/reference-entry';
import { ReferenceEntryError } from '../../domain/errors/reference-entry-error';

import {
  ReferenceEntryCategoryNotFoundError,
  ReferenceEntryCategoryUnavailableError,
  ReferenceEntryConcurrencyError,
  ReferenceEntryNameConflictError,
  ReferenceEntryUniverseUnavailableError,
} from '../errors/reference-entry-repository-errors';

import type { ReferenceEntryRepository } from '../repositories/reference-entry-repository';

import { createRestoreReferenceEntryUseCase } from './restore-reference-entry';

describe('createRestoreReferenceEntryUseCase', () => {
  let repository: jest.Mocked<ReferenceEntryRepository>;
  let getCurrentTime: jest.Mock;

  const now = '2026-11-03T15:00:00.000Z';

  const deletedEntry: ReferenceEntry = {
    id: 'entry-1',
    universeId: 'universe-1',
    categoryType: 'custom',
    categoryId: 'category-1',
    name: 'Elves',
    description: 'An ancient race.',
    image: null,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-02T10:00:00.000Z',
    deletedAt: '2026-11-02T12:00:00.000Z',
    revision: 1,
    isSpoiler: false,
  };

  beforeEach(() => {
    repository = {
      findById: jest.fn().mockResolvedValue(deletedEntry),
      findAllActiveByCategory: jest.fn(),
      findAllActiveByUniverseId: jest.fn(),
      createIfCategoryAvailable: jest.fn(),
      update: jest.fn(),
      restore: jest.fn().mockResolvedValue(undefined),
    };

    getCurrentTime = jest.fn().mockReturnValue(now);
  });

  it('should restore and persist a reference entry', async () => {
    const useCase = createRestoreReferenceEntryUseCase({
      referenceEntryRepository: repository,
      getCurrentTime,
    });

    const result = await useCase('entry-1');

    expect(result).toEqual({
      ...deletedEntry,
      updatedAt: now,
      deletedAt: null,
      revision: 2,
    });

    expect(repository.restore).toHaveBeenCalledWith(result, deletedEntry.revision);
    expect(getCurrentTime).toHaveBeenCalledTimes(1);
  });

  it('should throw NOT_FOUND when the entry does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    const useCase = createRestoreReferenceEntryUseCase({
      referenceEntryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('missing-entry')).rejects.toMatchObject({
      name: 'ReferenceEntryApplicationError',
      code: 'NOT_FOUND',
    });

    expect(repository.restore).not.toHaveBeenCalled();
  });

  it('should propagate a domain error when the entry is already active', async () => {
    repository.findById.mockResolvedValue({
      ...deletedEntry,
      deletedAt: null,
    });

    const useCase = createRestoreReferenceEntryUseCase({
      referenceEntryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('entry-1')).rejects.toBeInstanceOf(ReferenceEntryError);

    expect(repository.restore).not.toHaveBeenCalled();
  });

  it('should map a name conflict to DUPLICATE_NAME', async () => {
    repository.restore.mockRejectedValue(new ReferenceEntryNameConflictError());

    const useCase = createRestoreReferenceEntryUseCase({
      referenceEntryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('entry-1')).rejects.toMatchObject({
      code: 'DUPLICATE_NAME',
    });
  });

  it('should map a concurrency conflict to CONCURRENT_MODIFICATION', async () => {
    repository.restore.mockRejectedValue(new ReferenceEntryConcurrencyError());

    const useCase = createRestoreReferenceEntryUseCase({
      referenceEntryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('entry-1')).rejects.toMatchObject({
      code: 'CONCURRENT_MODIFICATION',
    });
  });

  it('should map an unavailable universe to UNIVERSE_NOT_FOUND', async () => {
    repository.restore.mockRejectedValue(new ReferenceEntryUniverseUnavailableError());

    const useCase = createRestoreReferenceEntryUseCase({
      referenceEntryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('entry-1')).rejects.toMatchObject({
      code: 'UNIVERSE_NOT_FOUND',
    });
  });

  it('should map a missing category to CATEGORY_NOT_FOUND', async () => {
    repository.restore.mockRejectedValue(new ReferenceEntryCategoryNotFoundError());

    const useCase = createRestoreReferenceEntryUseCase({
      referenceEntryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('entry-1')).rejects.toMatchObject({
      code: 'CATEGORY_NOT_FOUND',
    });
  });

  it('should map an unavailable category to CATEGORY_UNAVAILABLE', async () => {
    repository.restore.mockRejectedValue(new ReferenceEntryCategoryUnavailableError());

    const useCase = createRestoreReferenceEntryUseCase({
      referenceEntryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('entry-1')).rejects.toMatchObject({
      code: 'CATEGORY_UNAVAILABLE',
    });
  });

  it('should propagate unexpected repository errors', async () => {
    const error = new Error('Database failure');

    repository.restore.mockRejectedValue(error);

    const useCase = createRestoreReferenceEntryUseCase({
      referenceEntryRepository: repository,
      getCurrentTime,
    });

    await expect(useCase('entry-1')).rejects.toBe(error);
  });
});
