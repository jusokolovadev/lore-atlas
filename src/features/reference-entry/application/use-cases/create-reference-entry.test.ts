import type { CreateReferenceEntryInput } from 'src/features/reference-entry/domain/operations/create-reference-entry';
import type { ReferenceEntry } from '../../domain/models/reference-entry';
import { ReferenceEntryError } from '../../domain/errors/reference-entry-error';

import {
  ReferenceEntryCategoryNotFoundError,
  ReferenceEntryCategoryUnavailableError,
  ReferenceEntryNameConflictError,
  ReferenceEntryUniverseUnavailableError,
} from '../errors/reference-entry-repository-errors';

import type { ReferenceEntryRepository } from '../repositories/reference-entry-repository';

import { createCreateReferenceEntryUseCase } from './create-reference-entry';

describe('createCreateReferenceEntryUseCase', () => {
  let repository: jest.Mocked<ReferenceEntryRepository>;
  let generateId: jest.Mock;
  let getCurrentTime: jest.Mock;

  const input: CreateReferenceEntryInput = {
    universeId: 'universe-1',
    categoryType: 'custom',
    categoryId: 'category-1',
    name: '  Elves  ',
    description: 'An ancient race.',
    image: null,
  };

  const now = '2026-11-03T12:00:00.000Z';

  beforeEach(() => {
    repository = {
      findById: jest.fn(),
      findAllActiveByCategory: jest.fn(),
      findAllActiveByUniverseId: jest.fn(),
      createIfCategoryAvailable: jest.fn().mockResolvedValue(undefined),
      update: jest.fn(),
      restore: jest.fn(),
    };

    generateId = jest.fn().mockReturnValue('entry-1');
    getCurrentTime = jest.fn().mockReturnValue(now);
  });

  it('should create and persist a reference entry', async () => {
    const useCase = createCreateReferenceEntryUseCase({
      referenceEntryRepository: repository,
      generateId,
      getCurrentTime,
    });

    const result = await useCase(input);

    const expectedEntry: ReferenceEntry = {
      id: 'entry-1',
      universeId: 'universe-1',
      categoryType: 'custom',
      categoryId: 'category-1',
      name: 'Elves',
      description: 'An ancient race.',
      image: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      revision: 1,
      isSpoiler: false,
    };

    expect(result).toEqual(expectedEntry);

    expect(repository.createIfCategoryAvailable).toHaveBeenCalledTimes(1);
    expect(repository.createIfCategoryAvailable).toHaveBeenCalledWith(expectedEntry);

    expect(generateId).toHaveBeenCalledTimes(1);
    expect(getCurrentTime).toHaveBeenCalledTimes(1);
  });

  it('should preserve the provided image', async () => {
    const image = {
      type: 'url' as const,
      url: 'https://example.com/elf.png',
    };

    const useCase = createCreateReferenceEntryUseCase({
      referenceEntryRepository: repository,
      generateId,
      getCurrentTime,
    });

    const result = await useCase({
      ...input,
      image,
    });

    expect(result.image).toEqual(image);
  });

  it('should map a name conflict to DUPLICATE_NAME', async () => {
    repository.createIfCategoryAvailable.mockRejectedValue(
      new ReferenceEntryNameConflictError(),
    );

    const useCase = createCreateReferenceEntryUseCase({
      referenceEntryRepository: repository,
      generateId,
      getCurrentTime,
    });

    await expect(useCase(input)).rejects.toMatchObject({
      name: 'ReferenceEntryApplicationError',
      code: 'DUPLICATE_NAME',
    });
  });

  it('should map an unavailable universe to UNIVERSE_NOT_FOUND', async () => {
    repository.createIfCategoryAvailable.mockRejectedValue(
      new ReferenceEntryUniverseUnavailableError(),
    );

    const useCase = createCreateReferenceEntryUseCase({
      referenceEntryRepository: repository,
      generateId,
      getCurrentTime,
    });

    await expect(useCase(input)).rejects.toMatchObject({
      name: 'ReferenceEntryApplicationError',
      code: 'UNIVERSE_NOT_FOUND',
    });
  });

  it('should map a missing category to CATEGORY_NOT_FOUND', async () => {
    repository.createIfCategoryAvailable.mockRejectedValue(
      new ReferenceEntryCategoryNotFoundError(),
    );

    const useCase = createCreateReferenceEntryUseCase({
      referenceEntryRepository: repository,
      generateId,
      getCurrentTime,
    });

    await expect(useCase(input)).rejects.toMatchObject({
      name: 'ReferenceEntryApplicationError',
      code: 'CATEGORY_NOT_FOUND',
    });
  });

  it('should map an unavailable category to CATEGORY_UNAVAILABLE', async () => {
    repository.createIfCategoryAvailable.mockRejectedValue(
      new ReferenceEntryCategoryUnavailableError(),
    );

    const useCase = createCreateReferenceEntryUseCase({
      referenceEntryRepository: repository,
      generateId,
      getCurrentTime,
    });

    await expect(useCase(input)).rejects.toMatchObject({
      name: 'ReferenceEntryApplicationError',
      code: 'CATEGORY_UNAVAILABLE',
    });
  });

  it('should preserve the original error as cause', async () => {
    const originalError = new ReferenceEntryNameConflictError();

    repository.createIfCategoryAvailable.mockRejectedValue(originalError);

    const useCase = createCreateReferenceEntryUseCase({
      referenceEntryRepository: repository,
      generateId,
      getCurrentTime,
    });

    await expect(useCase(input)).rejects.toMatchObject({
      code: 'DUPLICATE_NAME',
      cause: originalError,
    });
  });

  it('should propagate unexpected repository errors', async () => {
    const unexpectedError = new Error('Database failure');

    repository.createIfCategoryAvailable.mockRejectedValue(unexpectedError);

    const useCase = createCreateReferenceEntryUseCase({
      referenceEntryRepository: repository,
      generateId,
      getCurrentTime,
    });

    await expect(useCase(input)).rejects.toBe(unexpectedError);
  });

  it('should not persist an entry when domain validation fails', async () => {
    const useCase = createCreateReferenceEntryUseCase({
      referenceEntryRepository: repository,
      generateId,
      getCurrentTime,
    });

    await expect(
      useCase({
        ...input,
        name: '   ',
      }),
    ).rejects.toBeInstanceOf(ReferenceEntryError);

    expect(repository.createIfCategoryAvailable).not.toHaveBeenCalled();
  });
});
