import type { ReferenceEntryRepository } from '../repositories/reference-entry-repository';
import type { ReferenceEntry } from '../../domain/models/reference-entry';

import { getStandardReferenceEntriesByCategoryId } from '../../domain/catalog/standard-reference-entry-catalog';

import { createGetReferenceEntriesByCategory } from './get-reference-entries-by-category';

describe('getReferenceEntriesByCategory', () => {
  const standardCategoryId = 'species';
  const customCategoryId = 'custom-category';

  const customEntry: ReferenceEntry = {
    id: 'custom-vampire',
    universeId: 'universe-1',
    categoryType: 'standard',
    categoryId: standardCategoryId,
    name: 'Custom Vampire',
    description: null,
    image: null,
    revision: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    isSpoiler: false,
  };

  const repository: jest.Mocked<ReferenceEntryRepository> = {
    findById: jest.fn(),
    findAllActiveByCategory: jest.fn(),
    findAllActiveByUniverseId: jest.fn(),
    createIfCategoryAvailable: jest.fn(),
    update: jest.fn(),
    restore: jest.fn(),
  };

  const getReferenceEntriesByCategory = createGetReferenceEntriesByCategory({
    referenceEntryRepository: repository,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns standard and custom entries for a standard category', async () => {
    repository.findAllActiveByCategory.mockResolvedValue([customEntry]);

    const result = await getReferenceEntriesByCategory({
      universeId: 'universe-1',
      categoryType: 'standard',
      categoryId: standardCategoryId,
    });

    const standardEntries = getStandardReferenceEntriesByCategoryId(standardCategoryId);

    expect(result).toHaveLength(standardEntries.length + 1);

    expect(result.slice(0, standardEntries.length)).toEqual(
      standardEntries.map((entry) => ({
        source: 'standard',
        entry,
      })),
    );

    expect(result[result.length - 1]).toEqual({
      source: 'custom',
      entry: customEntry,
    });
  });

  it('returns only custom entries for a custom category', async () => {
    const customCategoryEntry: ReferenceEntry = {
      ...customEntry,
      categoryType: 'custom',
      categoryId: customCategoryId,
    };

    repository.findAllActiveByCategory.mockResolvedValue([customCategoryEntry]);

    const result = await getReferenceEntriesByCategory({
      universeId: 'universe-1',
      categoryType: 'custom',
      categoryId: customCategoryId,
    });

    expect(result).toEqual([
      {
        source: 'custom',
        entry: customCategoryEntry,
      },
    ]);
  });

  it('returns standard entries when there are no custom entries', async () => {
    repository.findAllActiveByCategory.mockResolvedValue([]);

    const result = await getReferenceEntriesByCategory({
      universeId: 'universe-1',
      categoryType: 'standard',
      categoryId: standardCategoryId,
    });

    expect(result).toEqual(
      getStandardReferenceEntriesByCategoryId(standardCategoryId).map((entry) => ({
        source: 'standard',
        entry,
      })),
    );
  });

  it('returns an empty array when a custom category has no entries', async () => {
    repository.findAllActiveByCategory.mockResolvedValue([]);

    const result = await getReferenceEntriesByCategory({
      universeId: 'universe-1',
      categoryType: 'custom',
      categoryId: customCategoryId,
    });

    expect(result).toEqual([]);
  });

  it('passes the requested category and universe to the repository', async () => {
    repository.findAllActiveByCategory.mockResolvedValue([]);

    await getReferenceEntriesByCategory({
      universeId: 'universe-1',
      categoryType: 'standard',
      categoryId: standardCategoryId,
    });

    expect(repository.findAllActiveByCategory).toHaveBeenCalledWith(
      'universe-1',
      'standard',
      standardCategoryId,
    );
  });
});
