import {
  CATEGORY_NAME_RESERVATIONS_STORE,
  REFERENCE_CATEGORIES_STORE,
  REFERENCE_ENTRIES_STORE,
  REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
} from '../database/database.types';

import { getDatabase } from '../database/database';
import { idbRequestToPromise } from '../database/idb-request';
import { idbTransactionToPromise } from '../database/idb-transaction';

import type { CustomReferenceCategory } from 'src/features/reference-categories/domain/models/custom-reference-category';
import type { ReferenceEntry } from 'src/features/reference-entry/domain/models/reference-entry';

import type { ReferenceCategoryNameReservation } from './reference-category-name-reservation';
import type { ReferenceEntryNameReservation } from './reference-entry-name-reservation';

import type { ReferenceCategoryDeletionRepository } from 'src/features/reference-categories/application/repositories/reference-category-deletion-repository';

import { ReferenceCategoryConcurrencyError } from 'src/features/reference-categories/application/errors/reference-category-application-errors';

export class IndexedDbReferenceCategoryDeletionRepository implements ReferenceCategoryDeletionRepository {
  async deleteReferenceCategory(
    category: CustomReferenceCategory,
    expectedRevision: number,
  ): Promise<void> {
    const database = await getDatabase();

    const transaction = database.transaction(
      [
        REFERENCE_CATEGORIES_STORE,
        CATEGORY_NAME_RESERVATIONS_STORE,
        REFERENCE_ENTRIES_STORE,
        REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
      ],
      'readwrite',
    );

    const transactionDone = idbTransactionToPromise(transaction);

    try {
      const categoriesStore = transaction.objectStore(REFERENCE_CATEGORIES_STORE);

      const categoryReservationsStore = transaction.objectStore(
        CATEGORY_NAME_RESERVATIONS_STORE,
      );

      const entriesStore = transaction.objectStore(REFERENCE_ENTRIES_STORE);

      const entryReservationsStore = transaction.objectStore(
        REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
      );

      // 1. Проверяем категорию и её ревизию.

      const existingCategory = await idbRequestToPromise<
        CustomReferenceCategory | undefined
      >(categoriesStore.get(category.id));

      if (
        !existingCategory ||
        existingCategory.revision !== expectedRevision ||
        existingCategory.deletedAt !== null ||
        category.revision !== expectedRevision + 1 ||
        category.deletedAt === null ||
        category.universeId !== existingCategory.universeId
      ) {
        throw new ReferenceCategoryConcurrencyError();
      }

      // 2. Проверяем резервирование имени категории.

      const categoryReservation = await idbRequestToPromise<
        ReferenceCategoryNameReservation | undefined
      >(categoryReservationsStore.index('by_category_id').get(category.id));

      if (
        !categoryReservation ||
        categoryReservation.categoryId !== existingCategory.id ||
        categoryReservation.universeId !== existingCategory.universeId ||
        categoryReservation.name !== existingCategory.name
      ) {
        throw new ReferenceCategoryConcurrencyError(
          'Category name reservation is inconsistent.',
        );
      }

      // 3. Получаем все записи категории.

      const entries = await idbRequestToPromise<ReferenceEntry[]>(
        entriesStore
          .index('by_category')
          .getAll([existingCategory.universeId, 'custom', existingCategory.id]),
      );

      const activeEntries = entries.filter((entry) => entry.deletedAt === null);

      // 4. Проверяем резервирование каждой активной записи.

      const reservations: Array<{
        key: IDBValidKey;
        reservation: ReferenceEntryNameReservation;
      }> = [];

      for (const entry of activeEntries) {
        const reservation = await idbRequestToPromise<
          ReferenceEntryNameReservation | undefined
        >(entryReservationsStore.index('by_entry_id').get(entry.id));

        if (
          !reservation ||
          reservation.entryId !== entry.id ||
          reservation.universeId !== entry.universeId ||
          reservation.categoryType !== entry.categoryType ||
          reservation.categoryId !== entry.categoryId ||
          reservation.name !== entry.name
        ) {
          throw new ReferenceCategoryConcurrencyError(
            'Reference entry name reservation is inconsistent.',
          );
        }

        reservations.push({
          key: [
            reservation.universeId,
            reservation.categoryType,
            reservation.categoryId,
            reservation.name,
          ],
          reservation,
        });
      }

      // 5. Удаляем резервирование имени категории.

      categoryReservationsStore.delete([
        categoryReservation.universeId,
        categoryReservation.name,
      ]);

      // 6. Сохраняем удалённую категорию.

      await idbRequestToPromise(categoriesStore.put(category));

      // 7. Удаляем резервирования и soft-delete активных записей.

      const deletedAt = category.deletedAt;

      for (let i = 0; i < activeEntries.length; i += 1) {
        const entry = activeEntries[i];
        const reservation = reservations[i];

        entryReservationsStore.delete(reservation.key);

        const deletedEntry: ReferenceEntry = {
          ...entry,
          deletedAt,
          updatedAt: deletedAt,
          revision: entry.revision + 1,
        };

        await idbRequestToPromise(entriesStore.put(deletedEntry));
      }

      await transactionDone;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // Transaction may already be aborted or completed.
      }

      await transactionDone.catch(() => undefined);

      if (error instanceof ReferenceCategoryConcurrencyError) {
        throw error;
      }

      throw error;
    }
  }
}
