import type { UniverseDeletionRepository } from 'src/features/universes/application/repositories/universe-deletion-repository';

import type { Universe } from 'src/features/universes/domain/models/universe';
import type { CustomReferenceCategory } from 'src/features/reference-categories/domain/models/custom-reference-category';

import { UniverseError } from 'src/features/universes/domain/errors/universe-error';
import { deleteUniverse } from 'src/features/universes/domain/operations/delete-universe';
import { deleteReferenceCategory } from 'src/features/reference-categories/domain/operations/delete-reference-category';

import { getDatabase } from '../database/database';
import {
  UNIVERSES_STORE,
  REFERENCE_CATEGORIES_STORE,
  CATEGORY_NAME_RESERVATIONS_STORE,
} from '../database/database.types';
import { idbTransactionToPromise } from '../database/idb-transaction';

interface CategoryNameReservation {
  universeId: string;
  name: string;
  categoryId: string;
}

export class IndexedDbUniverseDeletionRepository implements UniverseDeletionRepository {
  async deleteUniverseWithCategories(universeId: string, now: string): Promise<void> {
    const database = await getDatabase();

    const transaction = database.transaction(
      [UNIVERSES_STORE, REFERENCE_CATEGORIES_STORE, CATEGORY_NAME_RESERVATIONS_STORE],
      'readwrite',
    );

    const transactionPromise = idbTransactionToPromise(transaction);

    const operationPromise = new Promise<void>((resolve, reject) => {
      const fail = (error: unknown) => {
        reject(error);

        try {
          transaction.abort();
        } catch {
          // Transaction may already be inactive or aborted.
        }
      };

      const universesStore = transaction.objectStore(UNIVERSES_STORE);
      const categoriesStore = transaction.objectStore(REFERENCE_CATEGORIES_STORE);
      const reservationsStore = transaction.objectStore(CATEGORY_NAME_RESERVATIONS_STORE);

      const universeRequest = universesStore.get(universeId) as IDBRequest<
        Universe | undefined
      >;

      universeRequest.onsuccess = () => {
        const universe = universeRequest.result;

        if (!universe) {
          fail(new UniverseError('NOT_FOUND', 'Universe not found.'));
          return;
        }

        let deletedUniverse: Universe;

        try {
          deletedUniverse = {
            ...deleteUniverse(universe, now),
            updatedAt: now,
          };
        } catch (error) {
          fail(error);
          return;
        }

        const categoriesRequest = categoriesStore
          .index('by_universe_id')
          .getAll(universeId) as IDBRequest<CustomReferenceCategory[]>;

        categoriesRequest.onsuccess = () => {
          try {
            const activeCategories = categoriesRequest.result.filter(
              (category) => category.deletedAt === null,
            );

            universesStore.put(deletedUniverse);

            for (const category of activeCategories) {
              const deletedCategory = {
                ...deleteReferenceCategory(category, now),
                updatedAt: now,
              };

              categoriesStore.put(deletedCategory);

              const reservationRequest = reservationsStore
                .index('by_category_id')
                .get(category.id) as IDBRequest<CategoryNameReservation | undefined>;

              reservationRequest.onsuccess = () => {
                const reservation = reservationRequest.result;

                if (!reservation) {
                  return;
                }

                reservationsStore.delete([reservation.universeId, reservation.name]);
              };
            }

            resolve();
          } catch (error) {
            fail(error);
          }
        };

        categoriesRequest.onerror = () => {
          fail(
            categoriesRequest.error ??
              new Error('Failed to retrieve reference categories.'),
          );
        };
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
