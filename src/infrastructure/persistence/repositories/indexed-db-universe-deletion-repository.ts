import type { Universe } from 'src/features/universes/domain/models/universe';
import type { CustomReferenceCategory } from 'src/features/reference-categories/domain/models/custom-reference-category';
import type { UniverseDeletionRepository } from 'src/features/universes/application/repositories/universe-deletion-repository';

import { getDatabase } from '../database/database';
import {
  UNIVERSES_STORE,
  REFERENCE_CATEGORIES_STORE,
  CATEGORY_NAME_RESERVATIONS_STORE,
} from '../database/database.types';
import { idbRequestToPromise } from '../database/idb-request';
import { idbTransactionToPromise } from '../database/idb-transaction';

export class IndexedDbUniverseDeletionRepository implements UniverseDeletionRepository {
  async deleteUniverseWithCategories(
    universe: Universe,
    categories: CustomReferenceCategory[],
  ): Promise<void> {
    const database = await getDatabase();

    const transaction = database.transaction(
      [UNIVERSES_STORE, REFERENCE_CATEGORIES_STORE, CATEGORY_NAME_RESERVATIONS_STORE],
      'readwrite',
    );

    const transactionPromise = idbTransactionToPromise(transaction);

    const requests: Promise<unknown>[] = [];

    try {
      const universesStore = transaction.objectStore(UNIVERSES_STORE);
      const categoriesStore = transaction.objectStore(REFERENCE_CATEGORIES_STORE);
      const reservationsStore = transaction.objectStore(CATEGORY_NAME_RESERVATIONS_STORE);

      requests.push(idbRequestToPromise(universesStore.put(universe)));

      for (const category of categories) {
        requests.push(idbRequestToPromise(categoriesStore.put(category)));

        const reservationRequest = reservationsStore
          .index('by_category_id')
          .get(category.id) as IDBRequest<
          { universeId: string; name: string; categoryId: string } | undefined
        >;

        const reservationPromise = new Promise<void>((resolve, reject) => {
          reservationRequest.onsuccess = () => {
            const reservation = reservationRequest.result;

            if (!reservation) {
              resolve();
              return;
            }

            const deleteRequest = reservationsStore.delete([
              reservation.universeId,
              reservation.name,
            ]);

            deleteRequest.onsuccess = () => resolve();

            deleteRequest.onerror = () => {
              reject(
                deleteRequest.error ??
                  new Error('Failed to release category name reservation.'),
              );
            };
          };

          reservationRequest.onerror = () => {
            reject(
              reservationRequest.error ??
                new Error('Failed to find category name reservation.'),
            );
          };
        });

        requests.push(reservationPromise);
      }

      const results = await Promise.allSettled([...requests, transactionPromise]);

      const requestFailure = results
        .slice(0, -1)
        .find((result) => result.status === 'rejected');

      const transactionResult = results[results.length - 1];

      if (requestFailure?.status === 'rejected') {
        throw requestFailure.reason;
      }

      if (transactionResult.status === 'rejected') {
        throw transactionResult.reason;
      }
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // Transaction may already be inactive or aborted.
      }

      await Promise.allSettled([...requests, transactionPromise]);

      throw error;
    }
  }
}
