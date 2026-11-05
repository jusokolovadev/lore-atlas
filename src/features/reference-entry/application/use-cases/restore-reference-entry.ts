import { restoreReferenceEntry } from '../../domain/operations/restore-reference-entry';
import type { ReferenceEntry } from '../../domain/models/reference-entry';

import { ReferenceEntryApplicationError } from '../errors/reference-entry-application-error';
import {
  ReferenceEntryCategoryNotFoundError,
  ReferenceEntryCategoryUnavailableError,
  ReferenceEntryConcurrencyError,
  ReferenceEntryNameConflictError,
  ReferenceEntryUniverseUnavailableError,
} from '../errors/reference-entry-repository-errors';
import type { ReferenceEntryRepository } from '../repositories/reference-entry-repository';

export interface RestoreReferenceEntryDependencies {
  referenceEntryRepository: ReferenceEntryRepository;
  getCurrentTime: () => string;
}

export function createRestoreReferenceEntryUseCase({
  referenceEntryRepository,
  getCurrentTime,
}: RestoreReferenceEntryDependencies) {
  return async (id: string): Promise<ReferenceEntry> => {
    const existing = await referenceEntryRepository.findById(id);

    if (!existing) {
      throw new ReferenceEntryApplicationError('NOT_FOUND', 'Reference entry not found.');
    }

    const restored = restoreReferenceEntry(existing);

    const entry: ReferenceEntry = {
      ...restored,
      updatedAt: getCurrentTime(),
      revision: existing.revision + 1,
    };

    try {
      await referenceEntryRepository.restore(entry, existing.revision);
    } catch (error) {
      if (error instanceof ReferenceEntryNameConflictError) {
        throw new ReferenceEntryApplicationError(
          'DUPLICATE_NAME',
          'A reference entry with this name already exists in this category.',
          { cause: error },
        );
      }

      if (error instanceof ReferenceEntryConcurrencyError) {
        throw new ReferenceEntryApplicationError(
          'CONCURRENT_MODIFICATION',
          'Reference entry was modified by another operation.',
          { cause: error },
        );
      }

      if (error instanceof ReferenceEntryUniverseUnavailableError) {
        throw new ReferenceEntryApplicationError(
          'UNIVERSE_NOT_FOUND',
          'Universe not found.',
          { cause: error },
        );
      }

      if (error instanceof ReferenceEntryCategoryNotFoundError) {
        throw new ReferenceEntryApplicationError(
          'CATEGORY_NOT_FOUND',
          'Reference category not found.',
          { cause: error },
        );
      }

      if (error instanceof ReferenceEntryCategoryUnavailableError) {
        throw new ReferenceEntryApplicationError(
          'CATEGORY_UNAVAILABLE',
          'Reference category is unavailable.',
          { cause: error },
        );
      }

      throw error;
    }

    return entry;
  };
}
