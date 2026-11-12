import type { ReferenceEntry } from '../../domain/models/reference-entry';
import { ReferenceEntryError } from '../../domain/errors/reference-entry-error';

import { ReferenceEntryConcurrencyError } from '../errors/reference-entry-repository-errors';

import type { ReferenceEntryRepository } from '../repositories/reference-entry-repository';
import type { ReferenceEntryDeletionRepository } from '../repositories/reference-entry-deletion-repository';

import { createDeleteReferenceEntryUseCase } from './delete-reference-entry';

describe('createDeleteReferenceEntryUseCase', () => {
  let repository: jest.Mocked<ReferenceEntryRepository>;
  let deletionRepository: jest.Mocked<ReferenceEntryDeletionRepository>;
  let getCurrentTime: jest.Mock;

  const now = '2026-11-03T14:00:00.000Z';

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
    isSpoiler: false,
  };

  beforeEach(() => {
    repository = {
      findById: jest.fn().mockResolvedValue(existing),
      findAllActiveByCategory: jest.fn(),
      findAllActiveByUniverseId: jest.fn(),
      createIfCategoryAvailable: jest.fn(),
      update: jest.fn(),
      restore: jest.fn(),
    };

    deletionRepository = {
      deleteReferenceEntry: jest.fn().mockResolvedValue(undefined),
    };

    getCurrentTime = jest.fn().mockReturnValue(now);
  });

  it('should soft delete a reference entry', async () => {
    const useCase = createDeleteReferenceEntryUseCase({
      referenceEntryRepository: repository,
      referenceEntryDeletionRepository: deletionRepository,
      getCurrentTime,
    });

    await expect(useCase('entry-1')).resolves.toBeUndefined();

    expect(deletionRepository.deleteReferenceEntry).toHaveBeenCalledTimes(1);

    expect(deletionRepository.deleteReferenceEntry).toHaveBeenCalledWith(
      'entry-1',
      existing.revision,
      now,
    );

    expect(getCurrentTime).toHaveBeenCalledTimes(1);
  });

  it('should throw NOT_FOUND when the entry does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    const useCase = createDeleteReferenceEntryUseCase({
      referenceEntryRepository: repository,
      referenceEntryDeletionRepository: deletionRepository,
      getCurrentTime,
    });

    await expect(useCase('missing-entry')).rejects.toMatchObject({
      name: 'ReferenceEntryApplicationError',
      code: 'NOT_FOUND',
    });

    expect(deletionRepository.deleteReferenceEntry).not.toHaveBeenCalled();
  });

  it('should throw a domain error when the entry is already deleted', async () => {
    repository.findById.mockResolvedValue({
      ...existing,
      deletedAt: '2026-11-02T12:00:00.000Z',
    });

    const useCase = createDeleteReferenceEntryUseCase({
      referenceEntryRepository: repository,
      referenceEntryDeletionRepository: deletionRepository,
      getCurrentTime,
    });

    await expect(useCase('entry-1')).rejects.toBeInstanceOf(ReferenceEntryError);

    expect(deletionRepository.deleteReferenceEntry).not.toHaveBeenCalled();
  });

  it('should map a concurrency conflict to CONCURRENT_MODIFICATION', async () => {
    deletionRepository.deleteReferenceEntry.mockRejectedValue(
      new ReferenceEntryConcurrencyError(),
    );

    const useCase = createDeleteReferenceEntryUseCase({
      referenceEntryRepository: repository,
      referenceEntryDeletionRepository: deletionRepository,
      getCurrentTime,
    });

    await expect(useCase('entry-1')).rejects.toMatchObject({
      name: 'ReferenceEntryApplicationError',
      code: 'CONCURRENT_MODIFICATION',
    });
  });

  it('should propagate unexpected repository errors', async () => {
    const error = new Error('Database failure');

    deletionRepository.deleteReferenceEntry.mockRejectedValue(error);

    const useCase = createDeleteReferenceEntryUseCase({
      referenceEntryRepository: repository,
      referenceEntryDeletionRepository: deletionRepository,
      getCurrentTime,
    });

    await expect(useCase('entry-1')).rejects.toBe(error);
  });
});
