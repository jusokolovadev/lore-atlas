import { deleteReferenceEntry } from '../../domain/operations/delete-reference-entry';

import { ReferenceEntryApplicationError } from '../errors/reference-entry-application-error';
import { ReferenceEntryConcurrencyError } from '../errors/reference-entry-repository-errors';
import type { ReferenceEntryRepository } from '../repositories/reference-entry-repository';
import type { ReferenceEntryDeletionRepository } from '../repositories/reference-entry-deletion-repository';

export interface DeleteReferenceEntryDependencies {
  referenceEntryRepository: ReferenceEntryRepository;
  referenceEntryDeletionRepository: ReferenceEntryDeletionRepository;
  getCurrentTime: () => string;
}

export function createDeleteReferenceEntryUseCase({
  referenceEntryRepository,
  referenceEntryDeletionRepository,
  getCurrentTime,
}: DeleteReferenceEntryDependencies) {
  return async (id: string): Promise<void> => {
    const existing = await referenceEntryRepository.findById(id);

    if (!existing) {
      throw new ReferenceEntryApplicationError('NOT_FOUND', 'Reference entry not found.');
    }

    const deletedAt = getCurrentTime();

    // Domain validation: the entry must not already be deleted.
    deleteReferenceEntry(existing, deletedAt);

    try {
      await referenceEntryDeletionRepository.deleteReferenceEntry(
        id,
        existing.revision,
        deletedAt,
      );
    } catch (error) {
      if (error instanceof ReferenceEntryConcurrencyError) {
        throw new ReferenceEntryApplicationError(
          'CONCURRENT_MODIFICATION',
          'Reference entry was modified by another operation.',
          { cause: error },
        );
      }

      throw error;
    }
  };
}
