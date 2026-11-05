import type { UniverseDeletionRepository } from 'src/features/universes/application/repositories/universe-deletion-repository';

import type { Universe } from 'src/features/universes/domain/models/universe';
import type { CustomReferenceCategory } from 'src/features/reference-categories/domain/models/custom-reference-category';
import type { ReferenceEntry } from 'src/features/reference-entry/domain/models/reference-entry';

import { UniverseError } from 'src/features/universes/domain/errors/universe-error';
import { deleteUniverse } from 'src/features/universes/domain/operations/delete-universe';
import { deleteReferenceCategory } from 'src/features/reference-categories/domain/operations/delete-reference-category';
import { deleteReferenceEntry } from 'src/features/reference-entry/domain/operations/delete-reference-entry';

import { getDatabase } from '../database/database';
import {
  UNIVERSES_STORE,
  REFERENCE_CATEGORIES_STORE,
  CATEGORY_NAME_RESERVATIONS_STORE,
  REFERENCE_ENTRIES_STORE,
  REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
} from '../database/database.types';

import { idbTransactionToPromise } from '../database/idb-transaction';

interface CategoryNameReservation {
  universeId: string;
  name: string;
  categoryId: string;
}

interface ReferenceEntryNameReservation {
  universeId: string;
  categoryType: ReferenceEntry['categoryType'];
  categoryId: string;
  name: string;
  entryId: string;
}

export class IndexedDbUniverseDeletionRepository implements UniverseDeletionRepository {
  async deleteUniverseWithCategories(universeId: string, now: string): Promise<void> {
    const database = await getDatabase();

    const transaction = database.transaction(
      [
        UNIVERSES_STORE,
        REFERENCE_CATEGORIES_STORE,
        CATEGORY_NAME_RESERVATIONS_STORE,
        REFERENCE_ENTRIES_STORE,
        REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
      ],
      'readwrite',
    );

    const transactionPromise = idbTransactionToPromise(transaction);

    const operationPromise = new Promise<void>((resolve, reject) => {
      let settled = false;

      const fail = (error: unknown) => {
        if (settled) {
          return;
        }

        settled = true;
        reject(error);

        try {
          transaction.abort();
        } catch {
          // Transaction may already be inactive or aborted.
        }
      };

      const succeed = () => {
        if (settled) {
          return;
        }

        settled = true;
        resolve();
      };

      const universesStore = transaction.objectStore(UNIVERSES_STORE);
      const categoriesStore = transaction.objectStore(REFERENCE_CATEGORIES_STORE);
      const categoryReservationsStore = transaction.objectStore(
        CATEGORY_NAME_RESERVATIONS_STORE,
      );
      const entriesStore = transaction.objectStore(REFERENCE_ENTRIES_STORE);
      const entryReservationsStore = transaction.objectStore(
        REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
      );

      const universeRequest = universesStore.get(universeId) as IDBRequest<
        Universe | undefined
      >;

      universeRequest.onsuccess = () => {
        try {
          const universe = universeRequest.result;

          if (!universe) {
            fail(new UniverseError('NOT_FOUND', 'Universe not found.'));
            return;
          }

          const deletedUniverse: Universe = {
            ...deleteUniverse(universe, now),
            updatedAt: now,
          };

          universesStore.put(deletedUniverse);

          const categoriesRequest = categoriesStore
            .index('by_universe_id')
            .getAll(universeId) as IDBRequest<CustomReferenceCategory[]>;

          const entriesRequest = entriesStore
            .index('by_universe_id')
            .getAll(universeId) as IDBRequest<ReferenceEntry[]>;

          let categories: CustomReferenceCategory[] | undefined;
          let entries: ReferenceEntry[] | undefined;

          const processRecords = () => {
            if (!categories || !entries) {
              return;
            }

            try {
              const activeCategories = categories.filter(
                (category) => category.deletedAt === null,
              );

              const activeEntries = entries.filter((entry) => entry.deletedAt === null);

              let pendingReservations = activeCategories.length + activeEntries.length;

              if (pendingReservations === 0) {
                succeed();
                return;
              }

              const completeReservation = () => {
                pendingReservations -= 1;

                if (pendingReservations === 0) {
                  succeed();
                }
              };

              for (const category of activeCategories) {
                const reservationRequest = categoryReservationsStore
                  .index('by_category_id')
                  .get(category.id) as IDBRequest<CategoryNameReservation | undefined>;

                reservationRequest.onsuccess = () => {
                  try {
                    const reservation = reservationRequest.result;

                    if (
                      !reservation ||
                      reservation.universeId !== category.universeId ||
                      reservation.name !== category.name ||
                      reservation.categoryId !== category.id
                    ) {
                      fail(
                        new Error(
                          `Invalid or missing name reservation for category "${category.id}".`,
                        ),
                      );
                      return;
                    }

                    const deletedCategory: CustomReferenceCategory = {
                      ...deleteReferenceCategory(category, now),
                      updatedAt: now,
                      revision: category.revision + 1,
                    };

                    categoryReservationsStore.delete([
                      reservation.universeId,
                      reservation.name,
                    ]);

                    categoriesStore.put(deletedCategory);

                    completeReservation();
                  } catch (error) {
                    fail(error);
                  }
                };

                reservationRequest.onerror = () => {
                  fail(
                    reservationRequest.error ??
                      new Error(
                        `Failed to retrieve name reservation for category "${category.id}".`,
                      ),
                  );
                };
              }

              for (const entry of activeEntries) {
                const reservationRequest = entryReservationsStore
                  .index('by_entry_id')
                  .get(entry.id) as IDBRequest<ReferenceEntryNameReservation | undefined>;

                reservationRequest.onsuccess = () => {
                  try {
                    const reservation = reservationRequest.result;

                    if (
                      !reservation ||
                      reservation.universeId !== entry.universeId ||
                      reservation.categoryType !== entry.categoryType ||
                      reservation.categoryId !== entry.categoryId ||
                      reservation.name !== entry.name ||
                      reservation.entryId !== entry.id
                    ) {
                      fail(
                        new Error(
                          `Invalid or missing name reservation for reference entry "${entry.id}".`,
                        ),
                      );
                      return;
                    }

                    const deletedEntry: ReferenceEntry = {
                      ...deleteReferenceEntry(entry, now),
                      updatedAt: now,
                      revision: entry.revision + 1,
                    };

                    entryReservationsStore.delete([
                      reservation.universeId,
                      reservation.categoryType,
                      reservation.categoryId,
                      reservation.name,
                    ]);

                    entriesStore.put(deletedEntry);

                    completeReservation();
                  } catch (error) {
                    fail(error);
                  }
                };

                reservationRequest.onerror = () => {
                  fail(
                    reservationRequest.error ??
                      new Error(
                        `Failed to retrieve name reservation for reference entry "${entry.id}".`,
                      ),
                  );
                };
              }
            } catch (error) {
              fail(error);
            }
          };

          categoriesRequest.onsuccess = () => {
            categories = categoriesRequest.result;
            processRecords();
          };

          categoriesRequest.onerror = () => {
            fail(
              categoriesRequest.error ??
                new Error('Failed to retrieve reference categories.'),
            );
          };

          entriesRequest.onsuccess = () => {
            entries = entriesRequest.result;
            processRecords();
          };

          entriesRequest.onerror = () => {
            fail(
              entriesRequest.error ?? new Error('Failed to retrieve reference entries.'),
            );
          };
        } catch (error) {
          fail(error);
        }
      };

      universeRequest.onerror = () => {
        fail(universeRequest.error ?? new Error('Failed to retrieve universe.'));
      };
    });

    try {
      await Promise.all([operationPromise, transactionPromise]);
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // Transaction may already be inactive or aborted.
      }

      await transactionPromise.catch(() => undefined);

      throw error;
    }
  }
}
