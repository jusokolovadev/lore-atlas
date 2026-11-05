import {
  UNIVERSES_STORE,
  REFERENCE_CATEGORIES_STORE,
  REFERENCE_ENTRIES_STORE,
  REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
} from 'src/infrastructure/persistence/database/database.types';

import { getDatabase } from 'src/infrastructure/persistence/database/database';

import { idbRequestToPromise } from 'src/infrastructure/persistence/database/idb-request';
import { idbTransactionToPromise } from 'src/infrastructure/persistence/database/idb-transaction';

import {
  ReferenceEntryCategoryNotFoundError,
  ReferenceEntryCategoryUnavailableError,
  ReferenceEntryConcurrencyError,
  ReferenceEntryNameConflictError,
  ReferenceEntryUniverseUnavailableError,
} from 'src/features/reference-entry/application/errors/reference-entry-repository-errors';

import type { ReferenceEntryNameReservation } from './reference-entry-name-reservation';
import type {
  ReferenceEntry,
  ReferenceEntryCategoryType,
} from 'src/features/reference-entry/domain/models/reference-entry';
import type { ReferenceEntryRepository } from 'src/features/reference-entry/application/repositories/reference-entry-repository';
import { findStandardReferenceCategoryById } from 'src/features/reference-categories/domain/catalog/standard-reference-category-catalog';

export class IndexedDbReferenceEntryRepository implements ReferenceEntryRepository {
  async findById(id: string): Promise<ReferenceEntry | null> {
    const database = await getDatabase();

    const transaction = database.transaction(REFERENCE_ENTRIES_STORE, 'readonly');

    const store = transaction.objectStore(REFERENCE_ENTRIES_STORE);

    const entry = await idbRequestToPromise<ReferenceEntry | undefined>(store.get(id));

    return entry ?? null;
  }

  async findAllActiveByCategory(
    universeId: string,
    categoryType: ReferenceEntryCategoryType,
    categoryId: string,
  ): Promise<ReferenceEntry[]> {
    const database = await getDatabase();

    const transaction = database.transaction(REFERENCE_ENTRIES_STORE, 'readonly');

    const store = transaction.objectStore(REFERENCE_ENTRIES_STORE);
    const index = store.index('by_category');

    const entries = await idbRequestToPromise<ReferenceEntry[]>(
      index.getAll([universeId, categoryType, categoryId]),
    );

    return entries.filter((entry) => entry.deletedAt === null);
  }

  async findAllActiveByUniverseId(universeId: string): Promise<ReferenceEntry[]> {
    const database = await getDatabase();

    const transaction = database.transaction(REFERENCE_ENTRIES_STORE, 'readonly');

    const store = transaction.objectStore(REFERENCE_ENTRIES_STORE);
    const index = store.index('by_universe_id');

    const entries = await idbRequestToPromise<ReferenceEntry[]>(index.getAll(universeId));

    return entries.filter((entry) => entry.deletedAt === null);
  }

  async createIfCategoryAvailable(entry: ReferenceEntry): Promise<void> {
    const database = await getDatabase();

    const transaction = database.transaction(
      [
        UNIVERSES_STORE,
        REFERENCE_CATEGORIES_STORE,
        REFERENCE_ENTRIES_STORE,
        REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
      ],
      'readwrite',
    );

    const transactionDone = idbTransactionToPromise(transaction);

    try {
      const universesStore = transaction.objectStore(UNIVERSES_STORE);
      const categoriesStore = transaction.objectStore(REFERENCE_CATEGORIES_STORE);
      const entriesStore = transaction.objectStore(REFERENCE_ENTRIES_STORE);
      const reservationsStore = transaction.objectStore(
        REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
      );

      const [universe, category, existingReservation] = await Promise.all([
        idbRequestToPromise<
          | {
              id: string;
              deletedAt: string | null;
              enabledStandardCategoryIds: string[];
            }
          | undefined
        >(universesStore.get(entry.universeId)),

        entry.categoryType === 'custom'
          ? idbRequestToPromise<
              | {
                  id: string;
                  universeId: string;
                  deletedAt: string | null;
                }
              | undefined
            >(categoriesStore.get(entry.categoryId))
          : Promise.resolve(undefined),

        idbRequestToPromise<ReferenceEntryNameReservation | undefined>(
          reservationsStore.get([
            entry.universeId,
            entry.categoryType,
            entry.categoryId,
            entry.name,
          ]),
        ),
      ]);

      if (!universe || universe.deletedAt !== null) {
        throw new ReferenceEntryUniverseUnavailableError();
      }

      if (entry.categoryType === 'standard') {
        const category = findStandardReferenceCategoryById(entry.categoryId);

        if (!category) {
          throw new ReferenceEntryCategoryNotFoundError();
        }

        if (!universe.enabledStandardCategoryIds.includes(entry.categoryId)) {
          throw new ReferenceEntryCategoryUnavailableError();
        }
      }

      if (entry.categoryType === 'custom') {
        if (!category || category.universeId !== entry.universeId) {
          throw new ReferenceEntryCategoryNotFoundError();
        }

        if (category.deletedAt !== null) {
          throw new ReferenceEntryCategoryUnavailableError();
        }
      }

      if (existingReservation) {
        throw new ReferenceEntryNameConflictError();
      }

      const reservation: ReferenceEntryNameReservation = {
        universeId: entry.universeId,
        categoryType: entry.categoryType,
        categoryId: entry.categoryId,
        name: entry.name,
        entryId: entry.id,
      };

      await Promise.all([
        idbRequestToPromise(entriesStore.add(entry)),
        idbRequestToPromise(reservationsStore.add(reservation)),
      ]);

      await transactionDone;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // The transaction may already have been aborted or completed.
      }

      await transactionDone.catch(() => undefined);

      throw error;
    }
  }

  async update(entry: ReferenceEntry, expectedRevision: number): Promise<void> {
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
        entriesStore.get(entry.id),
      );

      if (!existing || existing.revision !== expectedRevision) {
        throw new ReferenceEntryConcurrencyError();
      }

      if (existing.deletedAt !== null || entry.revision !== expectedRevision + 1) {
        throw new ReferenceEntryConcurrencyError();
      }

      const nameChanged = existing.name !== entry.name;

      if (nameChanged) {
        const oldReservationKey = [
          existing.universeId,
          existing.categoryType,
          existing.categoryId,
          existing.name,
        ];

        const oldReservation = await idbRequestToPromise<
          ReferenceEntryNameReservation | undefined
        >(reservationsStore.get(oldReservationKey));

        if (!oldReservation || oldReservation.entryId !== existing.id) {
          throw new ReferenceEntryConcurrencyError(
            'Reference entry name reservation is inconsistent.',
          );
        }

        await idbRequestToPromise(reservationsStore.delete(oldReservationKey));

        const newReservation: ReferenceEntryNameReservation = {
          universeId: entry.universeId,
          categoryType: entry.categoryType,
          categoryId: entry.categoryId,
          name: entry.name,
          entryId: entry.id,
        };

        await idbRequestToPromise(reservationsStore.add(newReservation));
      }

      await idbRequestToPromise(entriesStore.put(entry));

      await transactionDone;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // The transaction may already have been aborted or completed.
      }

      await transactionDone.catch(() => undefined);

      if (
        error instanceof ReferenceEntryNameConflictError ||
        error instanceof ReferenceEntryConcurrencyError
      ) {
        throw error;
      }

      if ((error as { name?: string })?.name === 'ConstraintError') {
        throw new ReferenceEntryNameConflictError();
      }

      throw error;
    }
  }

  async restore(entry: ReferenceEntry, expectedRevision: number): Promise<void> {
    const database = await getDatabase();

    const transaction = database.transaction(
      [
        UNIVERSES_STORE,
        REFERENCE_CATEGORIES_STORE,
        REFERENCE_ENTRIES_STORE,
        REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
      ],
      'readwrite',
    );

    const transactionDone = idbTransactionToPromise(transaction);

    try {
      const universesStore = transaction.objectStore(UNIVERSES_STORE);
      const categoriesStore = transaction.objectStore(REFERENCE_CATEGORIES_STORE);
      const entriesStore = transaction.objectStore(REFERENCE_ENTRIES_STORE);
      const reservationsStore = transaction.objectStore(
        REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
      );

      const existing = await idbRequestToPromise<ReferenceEntry | undefined>(
        entriesStore.get(entry.id),
      );

      if (
        !existing ||
        existing.revision !== expectedRevision ||
        existing.deletedAt === null ||
        entry.revision !== expectedRevision + 1 ||
        entry.deletedAt !== null ||
        entry.universeId !== existing.universeId ||
        entry.categoryType !== existing.categoryType ||
        entry.categoryId !== existing.categoryId ||
        entry.name !== existing.name
      ) {
        throw new ReferenceEntryConcurrencyError();
      }

      const [universe, category] = await Promise.all([
        idbRequestToPromise<
          | {
              id: string;
              deletedAt: string | null;
              enabledStandardCategoryIds: string[];
            }
          | undefined
        >(universesStore.get(entry.universeId)),

        entry.categoryType === 'custom'
          ? idbRequestToPromise<
              | {
                  id: string;
                  universeId: string;
                  deletedAt: string | null;
                }
              | undefined
            >(categoriesStore.get(entry.categoryId))
          : Promise.resolve(undefined),
      ]);

      if (!universe || universe.deletedAt !== null) {
        throw new ReferenceEntryUniverseUnavailableError();
      }

      if (entry.categoryType === 'standard') {
        const category = findStandardReferenceCategoryById(entry.categoryId);

        if (!category) {
          throw new ReferenceEntryCategoryNotFoundError();
        }

        if (!universe.enabledStandardCategoryIds.includes(entry.categoryId)) {
          throw new ReferenceEntryCategoryUnavailableError();
        }
      }

      if (entry.categoryType === 'custom') {
        if (!category || category.universeId !== entry.universeId) {
          throw new ReferenceEntryCategoryNotFoundError();
        }

        if (category.deletedAt !== null) {
          throw new ReferenceEntryCategoryUnavailableError();
        }
      }

      const reservation: ReferenceEntryNameReservation = {
        universeId: entry.universeId,
        categoryType: entry.categoryType,
        categoryId: entry.categoryId,
        name: entry.name,
        entryId: entry.id,
      };

      await idbRequestToPromise(reservationsStore.add(reservation));
      await idbRequestToPromise(entriesStore.put(entry));

      await transactionDone;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // The transaction may already have been aborted or completed.
      }

      await transactionDone.catch(() => undefined);

      if (
        error instanceof ReferenceEntryConcurrencyError ||
        error instanceof ReferenceEntryNameConflictError ||
        error instanceof ReferenceEntryUniverseUnavailableError ||
        error instanceof ReferenceEntryCategoryNotFoundError ||
        error instanceof ReferenceEntryCategoryUnavailableError
      ) {
        throw error;
      }

      if ((error as { name?: string })?.name === 'ConstraintError') {
        throw new ReferenceEntryNameConflictError();
      }

      throw error;
    }
  }
}
