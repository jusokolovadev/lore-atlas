import type { CustomReferenceCategory } from 'src/features/reference-categories/domain/models/custom-reference-category';
import type { ReferenceCategoryRepository } from 'src/features/reference-categories/application/repositories/reference-category-repository';

import {
  ReferenceCategoryConcurrencyError,
  ReferenceCategoryNameConflictError,
} from 'src/features/reference-categories/application/errors/reference-category-application-errors';

import type { ReferenceCategoryNameReservation } from './reference-category-name-reservation';

import { getDatabase } from '../database/database';
import {
  CATEGORY_NAME_RESERVATIONS_STORE,
  REFERENCE_CATEGORIES_STORE,
  UNIVERSES_STORE,
} from '../database/database.types';

import { idbRequestToPromise } from '../database/idb-request';
import { idbTransactionToPromise } from '../database/idb-transaction';

import type { Universe } from 'src/features/universes/domain/models/universe';

function isConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'ConstraintError'
  );
}

function isSameCategoryIdentity(
  existing: CustomReferenceCategory,
  updated: CustomReferenceCategory,
): boolean {
  return (
    existing.id === updated.id &&
    existing.universeId === updated.universeId &&
    existing.createdAt === updated.createdAt
  );
}

export class IndexedDbReferenceCategoryRepository implements ReferenceCategoryRepository {
  async findById(id: string): Promise<CustomReferenceCategory | null> {
    const database = await getDatabase();

    const transaction = database.transaction(REFERENCE_CATEGORIES_STORE, 'readonly');

    const transactionPromise = idbTransactionToPromise(transaction);

    const request = transaction
      .objectStore(REFERENCE_CATEGORIES_STORE)
      .get(id) as IDBRequest<CustomReferenceCategory | undefined>;

    const [category] = await Promise.all([
      idbRequestToPromise(request),
      transactionPromise,
    ]);

    return category ?? null;
  }

  async findActiveByName(
    universeId: string,
    name: string,
  ): Promise<CustomReferenceCategory | null> {
    const database = await getDatabase();

    const transaction = database.transaction(
      [REFERENCE_CATEGORIES_STORE, CATEGORY_NAME_RESERVATIONS_STORE],
      'readonly',
    );

    const transactionPromise = idbTransactionToPromise(transaction);

    const reservationRequest = transaction
      .objectStore(CATEGORY_NAME_RESERVATIONS_STORE)
      .get([universeId, name]) as IDBRequest<
      ReferenceCategoryNameReservation | undefined
    >;

    const categoryPromise = new Promise<CustomReferenceCategory | null>(
      (resolve, reject) => {
        reservationRequest.onsuccess = () => {
          const reservation = reservationRequest.result;

          if (!reservation) {
            resolve(null);
            return;
          }

          const categoryRequest = transaction
            .objectStore(REFERENCE_CATEGORIES_STORE)
            .get(reservation.categoryId) as IDBRequest<
            CustomReferenceCategory | undefined
          >;

          categoryRequest.onsuccess = () => {
            resolve(categoryRequest.result ?? null);
          };

          categoryRequest.onerror = () => {
            reject(categoryRequest.error ?? new Error('IndexedDB request failed.'));
          };
        };

        reservationRequest.onerror = () => {
          reject(reservationRequest.error ?? new Error('IndexedDB request failed.'));
        };
      },
    );

    const [category] = await Promise.all([categoryPromise, transactionPromise]);

    return category;
  }

  async findAllActiveByUniverseId(
    universeId: string,
  ): Promise<CustomReferenceCategory[]> {
    const database = await getDatabase();

    const transaction = database.transaction(REFERENCE_CATEGORIES_STORE, 'readonly');

    const transactionPromise = idbTransactionToPromise(transaction);

    const request = transaction
      .objectStore(REFERENCE_CATEGORIES_STORE)
      .index('by_universe_id')
      .getAll(universeId) as IDBRequest<CustomReferenceCategory[]>;

    const [categories] = await Promise.all([
      idbRequestToPromise(request),
      transactionPromise,
    ]);

    return categories.filter((category) => category.deletedAt === null);
  }

  async createIfUniverseActive(category: CustomReferenceCategory): Promise<boolean> {
    const database = await getDatabase();

    const transaction = database.transaction(
      [UNIVERSES_STORE, REFERENCE_CATEGORIES_STORE, CATEGORY_NAME_RESERVATIONS_STORE],
      'readwrite',
    );

    const transactionPromise = idbTransactionToPromise(transaction);

    const universeRequest = transaction
      .objectStore(UNIVERSES_STORE)
      .get(category.universeId) as IDBRequest<Universe | undefined>;

    const operationPromise = new Promise<boolean>((resolve, reject) => {
      universeRequest.onsuccess = () => {
        const universe = universeRequest.result;

        if (!universe || universe.deletedAt !== null) {
          resolve(false);
          return;
        }

        const categoryRequest = transaction
          .objectStore(REFERENCE_CATEGORIES_STORE)
          .add(category);

        const reservationRequest = transaction
          .objectStore(CATEGORY_NAME_RESERVATIONS_STORE)
          .add({
            universeId: category.universeId,
            name: category.name,
            categoryId: category.id,
          } satisfies ReferenceCategoryNameReservation);

        Promise.all([
          idbRequestToPromise(categoryRequest),
          idbRequestToPromise(reservationRequest),
        ])
          .then(() => resolve(true))
          .catch(reject);
      };

      universeRequest.onerror = () => {
        reject(universeRequest.error ?? new Error('Failed to find universe.'));
      };
    });

    try {
      const [created] = await Promise.all([operationPromise, transactionPromise]);

      return created;
    } catch (error) {
      if (isConstraintError(error)) {
        throw new ReferenceCategoryNameConflictError();
      }

      throw error;
    }
  }

  async update(
    category: CustomReferenceCategory,
    expectedRevision: number,
  ): Promise<void> {
    const database = await getDatabase();

    const transaction = database.transaction(
      [REFERENCE_CATEGORIES_STORE, CATEGORY_NAME_RESERVATIONS_STORE],
      'readwrite',
    );

    const transactionPromise = idbTransactionToPromise(transaction);

    const categoriesStore = transaction.objectStore(REFERENCE_CATEGORIES_STORE);

    const reservationsStore = transaction.objectStore(CATEGORY_NAME_RESERVATIONS_STORE);

    const operationPromise = (async () => {
      const existing = await idbRequestToPromise<CustomReferenceCategory | undefined>(
        categoriesStore.get(category.id),
      );

      if (
        !existing ||
        existing.revision !== expectedRevision ||
        existing.deletedAt !== null ||
        category.deletedAt !== null ||
        category.revision !== expectedRevision + 1 ||
        !isSameCategoryIdentity(existing, category)
      ) {
        throw new ReferenceCategoryConcurrencyError();
      }

      const existingReservation = await idbRequestToPromise<
        ReferenceCategoryNameReservation | undefined
      >(reservationsStore.index('by_category_id').get(category.id));

      if (
        !existingReservation ||
        existingReservation.categoryId !== existing.id ||
        existingReservation.universeId !== existing.universeId ||
        existingReservation.name !== existing.name
      ) {
        throw new ReferenceCategoryConcurrencyError(
          'Category name reservation is inconsistent.',
        );
      }

      const nameChanged = existing.name !== category.name;

      if (nameChanged) {
        reservationsStore.delete([
          existingReservation.universeId,
          existingReservation.name,
        ]);

        const newReservation: ReferenceCategoryNameReservation = {
          universeId: category.universeId,
          name: category.name,
          categoryId: category.id,
        };

        await idbRequestToPromise(reservationsStore.add(newReservation));
      }

      await idbRequestToPromise(categoriesStore.put(category));
    })();

    try {
      await Promise.all([operationPromise, transactionPromise]);
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // Transaction may already be inactive or aborted.
      }

      await transactionPromise.catch(() => undefined);

      if (isConstraintError(error)) {
        throw new ReferenceCategoryNameConflictError();
      }

      throw error;
    }
  }

  async restore(
    category: CustomReferenceCategory,
    expectedRevision: number,
  ): Promise<void> {
    const database = await getDatabase();

    const transaction = database.transaction(
      [REFERENCE_CATEGORIES_STORE, CATEGORY_NAME_RESERVATIONS_STORE],
      'readwrite',
    );

    const transactionPromise = idbTransactionToPromise(transaction);

    const categoriesStore = transaction.objectStore(REFERENCE_CATEGORIES_STORE);

    const reservationsStore = transaction.objectStore(CATEGORY_NAME_RESERVATIONS_STORE);

    const operationPromise = (async () => {
      const existing = await idbRequestToPromise<CustomReferenceCategory | undefined>(
        categoriesStore.get(category.id),
      );

      if (
        !existing ||
        existing.revision !== expectedRevision ||
        existing.deletedAt === null ||
        category.deletedAt !== null ||
        category.revision !== expectedRevision + 1 ||
        !isSameCategoryIdentity(existing, category)
      ) {
        throw new ReferenceCategoryConcurrencyError();
      }

      const existingReservation = await idbRequestToPromise<
        ReferenceCategoryNameReservation | undefined
      >(reservationsStore.index('by_category_id').get(category.id));

      if (existingReservation) {
        throw new ReferenceCategoryConcurrencyError(
          'Deleted category unexpectedly has a name reservation.',
        );
      }

      const newReservation: ReferenceCategoryNameReservation = {
        universeId: category.universeId,
        name: category.name,
        categoryId: category.id,
      };

      await idbRequestToPromise(reservationsStore.add(newReservation));

      await idbRequestToPromise(categoriesStore.put(category));
    })();

    try {
      await Promise.all([operationPromise, transactionPromise]);
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // Transaction may already be inactive or aborted.
      }

      await transactionPromise.catch(() => undefined);

      if (isConstraintError(error)) {
        throw new ReferenceCategoryNameConflictError();
      }

      throw error;
    }
  }
}
