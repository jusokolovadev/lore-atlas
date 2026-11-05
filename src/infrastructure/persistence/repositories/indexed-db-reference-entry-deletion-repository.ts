import {
  REFERENCE_ENTRIES_STORE,
  REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
} from '../database/database.types';

import { getDatabase } from '../database/database';
import { idbRequestToPromise } from '../database/idb-request';
import { idbTransactionToPromise } from '../database/idb-transaction';

import type { ReferenceEntryNameReservation } from './reference-entry-name-reservation';
import type { ReferenceEntryDeletionRepository } from 'src/features/reference-entry/application/repositories/reference-entry-deletion-repository';
import type { ReferenceEntry } from 'src/features/reference-entry/domain/models/reference-entry';
import { ReferenceEntryConcurrencyError } from 'src/features/reference-entry/application/errors/reference-entry-repository-errors';

export class IndexedDbReferenceEntryDeletionRepository implements ReferenceEntryDeletionRepository {
  async deleteReferenceEntry(
    id: string,
    expectedRevision: number,
    deletedAt: string,
  ): Promise<void> {
    const database = await getDatabase();

    const transaction = database.transaction(
      [REFERENCE_ENTRIES_STORE, REFERENCE_ENTRY_NAME_RESERVATIONS_STORE],
      'readwrite',
    );

    const transactionDone = idbTransactionToPromise(transaction);

    try {
      const entriesStore = transaction.objectStore(REFERENCE_ENTRIES_STORE);
      const reservationsStore = transaction.objectStore(
        REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
      );

      const existing = await idbRequestToPromise<ReferenceEntry | undefined>(
        entriesStore.get(id),
      );

      if (
        !existing ||
        existing.revision !== expectedRevision ||
        existing.deletedAt !== null
      ) {
        throw new ReferenceEntryConcurrencyError();
      }

      const reservationKey = [
        existing.universeId,
        existing.categoryType,
        existing.categoryId,
        existing.name,
      ];

      const reservation = await idbRequestToPromise<
        ReferenceEntryNameReservation | undefined
      >(reservationsStore.get(reservationKey));

      if (!reservation || reservation.entryId !== existing.id) {
        throw new ReferenceEntryConcurrencyError();
      }

      const deletedEntry: ReferenceEntry = {
        ...existing,
        deletedAt,
        updatedAt: deletedAt,
        revision: existing.revision + 1,
      };

      reservationsStore.delete(reservationKey);

      await idbRequestToPromise(entriesStore.put(deletedEntry));

      await transactionDone;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // The transaction may already have been aborted or completed.
      }

      await transactionDone.catch(() => undefined);

      if (error instanceof ReferenceEntryConcurrencyError) {
        throw error;
      }

      throw error;
    }
  }
}
