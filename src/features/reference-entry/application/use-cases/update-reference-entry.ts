import { updateReferenceEntry } from '../../domain/operations/update-reference-entry';
import type { ReferenceEntry } from '../../domain/models/reference-entry';

import { ReferenceEntryApplicationError } from '../errors/reference-entry-application-error';
import {
  ReferenceEntryConcurrencyError,
  ReferenceEntryNameConflictError,
} from '../errors/reference-entry-repository-errors';
import type { ReferenceEntryRepository } from '../repositories/reference-entry-repository';

import type { UpdateReferenceEntryInput } from '../../domain/operations/update-reference-entry';

export interface UpdateReferenceEntryDependencies {
  referenceEntryRepository: ReferenceEntryRepository;
  getCurrentTime: () => string;
}

export function createUpdateReferenceEntryUseCase({
  referenceEntryRepository,
  getCurrentTime,
}: UpdateReferenceEntryDependencies) {
  return async (
    id: string,
    input: UpdateReferenceEntryInput,
  ): Promise<ReferenceEntry> => {
    const existing = await referenceEntryRepository.findById(id);

    if (!existing) {
      throw new ReferenceEntryApplicationError('NOT_FOUND', 'Reference entry not found.');
    }

    const updated = updateReferenceEntry(existing, input);

    if (updated === existing) {
      return existing;
    }

    const entry: ReferenceEntry = {
      ...updated,
      updatedAt: getCurrentTime(),
      revision: existing.revision + 1,
    };

    try {
      await referenceEntryRepository.update(entry, existing.revision);
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

      throw error;
    }

    return entry;
  };
}
