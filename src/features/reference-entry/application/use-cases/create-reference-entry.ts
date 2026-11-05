import { createReferenceEntry } from '../../domain/operations/create-reference-entry';
import type { ReferenceEntry } from '../../domain/models/reference-entry';

import { ReferenceEntryApplicationError } from '../errors/reference-entry-application-error';
import {
  ReferenceEntryCategoryNotFoundError,
  ReferenceEntryCategoryUnavailableError,
  ReferenceEntryNameConflictError,
  ReferenceEntryUniverseUnavailableError,
} from '../errors/reference-entry-repository-errors';
import type { ReferenceEntryRepository } from '../repositories/reference-entry-repository';

import type { CreateReferenceEntryInput } from '../../domain/operations/create-reference-entry';

export interface CreateReferenceEntryDependencies {
  referenceEntryRepository: ReferenceEntryRepository;
  generateId: () => string;
  getCurrentTime: () => string;
}

export function createCreateReferenceEntryUseCase({
  referenceEntryRepository,
  generateId,
  getCurrentTime,
}: CreateReferenceEntryDependencies) {
  return async (input: CreateReferenceEntryInput): Promise<ReferenceEntry> => {
    const now = getCurrentTime();

    const entry = createReferenceEntry(input, {
      id: generateId(),
      now,
    });

    try {
      await referenceEntryRepository.createIfCategoryAvailable(entry);
    } catch (error) {
      if (error instanceof ReferenceEntryNameConflictError) {
        throw new ReferenceEntryApplicationError(
          'DUPLICATE_NAME',
          'A reference entry with this name already exists in this category.',
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

      if (error instanceof ReferenceEntryCategoryUnavailableError) {
        throw new ReferenceEntryApplicationError(
          'CATEGORY_UNAVAILABLE',
          'Reference category is unavailable.',
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

      throw error;
    }

    return entry;
  };
}
