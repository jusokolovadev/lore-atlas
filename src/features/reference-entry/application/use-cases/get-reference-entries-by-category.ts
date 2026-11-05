import type { ReferenceEntryCategoryType } from '../../domain/models/reference-entry';
import type { ReferenceEntryRepository } from '../repositories/reference-entry-repository';
import type { ReferenceEntryResult } from '../models/reference-entry-result';

import { getStandardReferenceEntriesByCategoryId } from '../../domain/catalog/standard-reference-entry-catalog';

export interface GetReferenceEntriesByCategoryInput {
  universeId: string;
  categoryType: ReferenceEntryCategoryType;
  categoryId: string;
}

export interface GetReferenceEntriesByCategoryDependencies {
  referenceEntryRepository: ReferenceEntryRepository;
}

export function createGetReferenceEntriesByCategory(
  dependencies: GetReferenceEntriesByCategoryDependencies,
) {
  return async function getReferenceEntriesByCategory(
    input: GetReferenceEntriesByCategoryInput,
  ): Promise<ReferenceEntryResult[]> {
    const customEntries =
      await dependencies.referenceEntryRepository.findAllActiveByCategory(
        input.universeId,
        input.categoryType,
        input.categoryId,
      );

    if (input.categoryType === 'custom') {
      return customEntries.map((entry) => ({
        source: 'custom',
        entry,
      }));
    }

    const standardEntries = getStandardReferenceEntriesByCategoryId(input.categoryId);

    return [
      ...standardEntries.map((entry) => ({
        source: 'standard' as const,
        entry,
      })),
      ...customEntries.map((entry) => ({
        source: 'custom' as const,
        entry,
      })),
    ];
  };
}
