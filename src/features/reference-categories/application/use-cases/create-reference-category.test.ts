import { createCreateReferenceCategoryUseCase } from './create-reference-category';

import type { ReferenceCategoryRepository } from '../repositories/reference-category-repository';
import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';

import { ReferenceCategoryNameConflictError } from '../errors/reference-category-application-errors';

describe('createCreateReferenceCategoryUseCase', () => {
  let referenceCategoryRepository: jest.Mocked<ReferenceCategoryRepository>;

  let generateId: jest.Mock;
  let getCurrentTime: jest.Mock;

  beforeEach(() => {
    referenceCategoryRepository = {
      findById: jest.fn(),
      findActiveByName: jest.fn(),
      findAllActiveByUniverseId: jest.fn(),
      createIfUniverseActive: jest.fn(),
      update: jest.fn(),
      restore: jest.fn(),
    };

    generateId = jest.fn().mockReturnValue('category-1');
    getCurrentTime = jest.fn().mockReturnValue('2026-11-03T12:00:00.000Z');

    referenceCategoryRepository.createIfUniverseActive.mockResolvedValue(true);
  });

  it('creates a category', async () => {
    const useCase = createCreateReferenceCategoryUseCase({
      referenceCategoryRepository,
      generateId,
      getCurrentTime,
    });

    const result = await useCase({
      universeId: 'universe-1',
      name: 'Species',
      description: 'Species of Middle-earth',
    });

    expect(result).toEqual<CustomReferenceCategory>({
      id: 'category-1',
      universeId: 'universe-1',
      name: 'Species',
      description: 'Species of Middle-earth',
      createdAt: '2026-11-03T12:00:00.000Z',
      updatedAt: '2026-11-03T12:00:00.000Z',
      deletedAt: null,
      revision: 1,
    });

    expect(referenceCategoryRepository.createIfUniverseActive).toHaveBeenCalledWith(
      result,
    );
  });

  it('generates an ID and gets the current time once', async () => {
    const useCase = createCreateReferenceCategoryUseCase({
      referenceCategoryRepository,
      generateId,
      getCurrentTime,
    });

    await useCase({
      universeId: 'universe-1',
      name: 'Species',
    });

    expect(generateId).toHaveBeenCalledTimes(1);
    expect(getCurrentTime).toHaveBeenCalledTimes(1);
  });

  it('throws when the universe does not exist or is deleted', async () => {
    referenceCategoryRepository.createIfUniverseActive.mockResolvedValue(false);

    const useCase = createCreateReferenceCategoryUseCase({
      referenceCategoryRepository,
      generateId,
      getCurrentTime,
    });

    await expect(
      useCase({
        universeId: 'missing-universe',
        name: 'Species',
      }),
    ).rejects.toMatchObject({
      code: 'UNIVERSE_NOT_FOUND',
    });

    expect(referenceCategoryRepository.createIfUniverseActive).toHaveBeenCalled();
  });

  it('throws when a category with the same name already exists', async () => {
    referenceCategoryRepository.createIfUniverseActive.mockRejectedValue(
      new ReferenceCategoryNameConflictError(),
    );

    const useCase = createCreateReferenceCategoryUseCase({
      referenceCategoryRepository,
      generateId,
      getCurrentTime,
    });

    await expect(
      useCase({
        universeId: 'universe-1',
        name: 'Species',
      }),
    ).rejects.toMatchObject({
      code: 'DUPLICATE_NAME',
    });
  });

  it('passes the trimmed name to the repository', async () => {
    const useCase = createCreateReferenceCategoryUseCase({
      referenceCategoryRepository,
      generateId,
      getCurrentTime,
    });

    await useCase({
      universeId: 'universe-1',
      name: '  Species  ',
    });

    expect(referenceCategoryRepository.createIfUniverseActive).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Species',
      }),
    );
  });

  it('does not create a category when domain validation fails', async () => {
    const useCase = createCreateReferenceCategoryUseCase({
      referenceCategoryRepository,
      generateId,
      getCurrentTime,
    });

    await expect(
      useCase({
        universeId: 'universe-1',
        name: '   ',
      }),
    ).rejects.toThrow();

    expect(referenceCategoryRepository.createIfUniverseActive).not.toHaveBeenCalled();
  });
});
