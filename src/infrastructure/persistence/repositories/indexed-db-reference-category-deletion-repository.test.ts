import { getDatabase, closeDatabase } from '../database/database';

import {
  CATEGORY_NAME_RESERVATIONS_STORE,
  REFERENCE_CATEGORIES_STORE,
  REFERENCE_ENTRIES_STORE,
  REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
} from '../database/database.types';

import { idbRequestToPromise } from '../database/idb-request';
import { idbTransactionToPromise } from '../database/idb-transaction';

import { IndexedDbReferenceCategoryDeletionRepository } from './indexed-db-reference-category-deletion-repository';

import { ReferenceCategoryConcurrencyError } from 'src/features/reference-categories/application/errors/reference-category-application-errors';

import type { CustomReferenceCategory } from 'src/features/reference-categories/domain/models/custom-reference-category';
import type { ReferenceEntry } from 'src/features/reference-entry/domain/models/reference-entry';

import type { ReferenceCategoryNameReservation } from './reference-category-name-reservation';
import type { ReferenceEntryNameReservation } from './reference-entry-name-reservation';

describe('IndexedDbReferenceCategoryDeletionRepository', () => {
  let repository: IndexedDbReferenceCategoryDeletionRepository;

  const createCategory = (
    overrides: Partial<CustomReferenceCategory> = {},
  ): CustomReferenceCategory => ({
    id: 'category-1',
    universeId: 'universe-1',
    name: 'Characters',
    description: 'Character reference',
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
    deletedAt: null,
    revision: 1,
    ...overrides,
  });

  const createEntry = (overrides: Partial<ReferenceEntry> = {}): ReferenceEntry => ({
    id: 'entry-1',
    universeId: 'universe-1',
    categoryType: 'custom',
    categoryId: 'category-1',
    name: 'Elves',
    description: null,
    image: null,
    revision: 1,
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
    deletedAt: null,
    ...overrides,
  });

  const createDeletedCategory = (
    category: CustomReferenceCategory,
    deletedAt: string,
  ): CustomReferenceCategory => ({
    ...category,
    deletedAt,
    updatedAt: deletedAt,
    revision: category.revision + 1,
  });

  async function seedData(
    category: CustomReferenceCategory,
    entries: ReferenceEntry[],
    options: {
      categoryReservation?: boolean;
      entryReservationIds?: string[];
    } = {},
  ) {
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

    const categoriesStore = transaction.objectStore(REFERENCE_CATEGORIES_STORE);

    const categoryReservationsStore = transaction.objectStore(
      CATEGORY_NAME_RESERVATIONS_STORE,
    );

    const entriesStore = transaction.objectStore(REFERENCE_ENTRIES_STORE);

    const entryReservationsStore = transaction.objectStore(
      REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
    );

    categoriesStore.add(category);

    if (options.categoryReservation !== false) {
      const reservation: ReferenceCategoryNameReservation = {
        universeId: category.universeId,
        name: category.name,
        categoryId: category.id,
      };

      categoryReservationsStore.add(reservation);
    }

    const entryReservationIds =
      options.entryReservationIds ??
      entries.filter((entry) => entry.deletedAt === null).map((entry) => entry.id);

    entries.forEach((entry) => {
      entriesStore.add(entry);

      if (entryReservationIds.includes(entry.id)) {
        const reservation: ReferenceEntryNameReservation = {
          universeId: entry.universeId,
          categoryType: entry.categoryType,
          categoryId: entry.categoryId,
          name: entry.name,
          entryId: entry.id,
        };

        entryReservationsStore.add(reservation);
      }
    });

    await transactionDone;
  }

  beforeEach(async () => {
    repository = new IndexedDbReferenceCategoryDeletionRepository();

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

    transaction.objectStore(REFERENCE_CATEGORIES_STORE).clear();
    transaction.objectStore(CATEGORY_NAME_RESERVATIONS_STORE).clear();
    transaction.objectStore(REFERENCE_ENTRIES_STORE).clear();
    transaction.objectStore(REFERENCE_ENTRY_NAME_RESERVATIONS_STORE).clear();

    await idbTransactionToPromise(transaction);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  async function getStoredCategory(id: string) {
    const database = await getDatabase();

    const transaction = database.transaction(REFERENCE_CATEGORIES_STORE, 'readonly');

    const transactionDone = idbTransactionToPromise(transaction);

    const category = await idbRequestToPromise(
      transaction.objectStore(REFERENCE_CATEGORIES_STORE).get(id),
    );

    await transactionDone;

    return category;
  }

  async function getStoredEntry(id: string) {
    const database = await getDatabase();

    const transaction = database.transaction(REFERENCE_ENTRIES_STORE, 'readonly');

    const transactionDone = idbTransactionToPromise(transaction);

    const entry = await idbRequestToPromise(
      transaction.objectStore(REFERENCE_ENTRIES_STORE).get(id),
    );

    await transactionDone;

    return entry;
  }

  it('should delete a category without entries and release its name reservation', async () => {
    const category = createCategory();
    const deletedAt = '2026-11-03T15:00:00.000Z';

    await seedData(category, []);

    const deletedCategory = createDeletedCategory(category, deletedAt);

    await repository.deleteReferenceCategory(deletedCategory, 1);

    expect(await getStoredCategory(category.id)).toEqual(deletedCategory);

    const database = await getDatabase();

    const transaction = database.transaction(
      CATEGORY_NAME_RESERVATIONS_STORE,
      'readonly',
    );

    const transactionDone = idbTransactionToPromise(transaction);

    const reservation = await idbRequestToPromise(
      transaction
        .objectStore(CATEGORY_NAME_RESERVATIONS_STORE)
        .get([category.universeId, category.name]),
    );

    await transactionDone;

    expect(reservation).toBeUndefined();
  });

  it('should delete a category and all its active entries', async () => {
    const category = createCategory();

    const entries = [
      createEntry({
        id: 'entry-1',
        name: 'Elves',
      }),
      createEntry({
        id: 'entry-2',
        name: 'Dwarves',
        revision: 3,
      }),
    ];

    const deletedAt = '2026-11-03T15:00:00.000Z';

    await seedData(category, entries);

    const deletedCategory = createDeletedCategory(category, deletedAt);

    await repository.deleteReferenceCategory(deletedCategory, 1);

    expect(await getStoredCategory(category.id)).toEqual(deletedCategory);

    expect(await getStoredEntry('entry-1')).toEqual({
      ...entries[0],
      deletedAt,
      updatedAt: deletedAt,
      revision: 2,
    });

    expect(await getStoredEntry('entry-2')).toEqual({
      ...entries[1],
      deletedAt,
      updatedAt: deletedAt,
      revision: 4,
    });

    const database = await getDatabase();

    const transaction = database.transaction(
      REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
      'readonly',
    );

    const transactionDone = idbTransactionToPromise(transaction);

    const reservations = await idbRequestToPromise(
      transaction.objectStore(REFERENCE_ENTRY_NAME_RESERVATIONS_STORE).getAll(),
    );

    await transactionDone;

    expect(reservations).toHaveLength(0);
  });

  it('should preserve entries that were already deleted', async () => {
    const category = createCategory();

    const activeEntry = createEntry({
      id: 'active-entry',
      name: 'Elves',
    });

    const alreadyDeletedEntry = createEntry({
      id: 'deleted-entry',
      name: 'Dwarves',
      revision: 4,
      deletedAt: '2026-11-02T12:00:00.000Z',
      updatedAt: '2026-11-02T12:00:00.000Z',
    });

    await seedData(category, [activeEntry, alreadyDeletedEntry]);

    const deletedAt = '2026-11-03T15:00:00.000Z';
    const deletedCategory = createDeletedCategory(category, deletedAt);

    await repository.deleteReferenceCategory(deletedCategory, 1);

    expect(await getStoredEntry(activeEntry.id)).toEqual({
      ...activeEntry,
      deletedAt,
      updatedAt: deletedAt,
      revision: 2,
    });

    expect(await getStoredEntry(alreadyDeletedEntry.id)).toEqual(alreadyDeletedEntry);
  });

  it('should reject deletion when the category does not exist', async () => {
    const category = createCategory();
    const deletedCategory = createDeletedCategory(category, '2026-11-03T15:00:00.000Z');

    await expect(
      repository.deleteReferenceCategory(deletedCategory, 1),
    ).rejects.toBeInstanceOf(ReferenceCategoryConcurrencyError);
  });

  it('should reject deletion when the category revision is outdated', async () => {
    const category = createCategory();

    await seedData(category, []);

    const deletedCategory = createDeletedCategory(category, '2026-11-03T15:00:00.000Z');

    await expect(
      repository.deleteReferenceCategory(deletedCategory, 2),
    ).rejects.toBeInstanceOf(ReferenceCategoryConcurrencyError);

    expect(await getStoredCategory(category.id)).toEqual(category);
  });

  it('should reject deletion when the category name reservation is missing', async () => {
    const category = createCategory();

    await seedData(category, [], {
      categoryReservation: false,
    });

    const deletedCategory = createDeletedCategory(category, '2026-11-03T15:00:00.000Z');

    await expect(
      repository.deleteReferenceCategory(deletedCategory, 1),
    ).rejects.toBeInstanceOf(ReferenceCategoryConcurrencyError);

    expect(await getStoredCategory(category.id)).toEqual(category);
  });

  it('should reject deletion when an entry name reservation is missing', async () => {
    const category = createCategory();

    const entries = [
      createEntry({
        id: 'entry-1',
        name: 'Elves',
      }),
      createEntry({
        id: 'entry-2',
        name: 'Dwarves',
      }),
    ];

    await seedData(category, entries, {
      entryReservationIds: ['entry-1'],
    });

    const deletedCategory = createDeletedCategory(category, '2026-11-03T15:00:00.000Z');

    await expect(
      repository.deleteReferenceCategory(deletedCategory, 1),
    ).rejects.toBeInstanceOf(ReferenceCategoryConcurrencyError);

    // The entire transaction must be rolled back.

    expect(await getStoredCategory(category.id)).toEqual(category);

    expect(await getStoredEntry('entry-1')).toEqual(entries[0]);
    expect(await getStoredEntry('entry-2')).toEqual(entries[1]);

    const database = await getDatabase();

    const transaction = database.transaction(
      [CATEGORY_NAME_RESERVATIONS_STORE, REFERENCE_ENTRY_NAME_RESERVATIONS_STORE],
      'readonly',
    );

    const transactionDone = idbTransactionToPromise(transaction);

    const categoryReservation = await idbRequestToPromise(
      transaction
        .objectStore(CATEGORY_NAME_RESERVATIONS_STORE)
        .get([category.universeId, category.name]),
    );

    const entryReservations = await idbRequestToPromise(
      transaction.objectStore(REFERENCE_ENTRY_NAME_RESERVATIONS_STORE).getAll(),
    );

    await transactionDone;

    expect(categoryReservation).toBeDefined();
    expect(entryReservations).toHaveLength(1);
    expect(entryReservations[0].entryId).toBe('entry-1');
  });

  it('should delete only entries belonging to the specified category in the specified universe', async () => {
    const category = createCategory();

    const targetEntry = createEntry({
      id: 'target-entry',
      name: 'Elves',
    });

    const entryFromAnotherCategory = createEntry({
      id: 'another-category-entry',
      universeId: category.universeId,
      categoryId: 'another-category',
      name: 'Dwarves',
    });

    const entryFromAnotherUniverse = createEntry({
      id: 'another-universe-entry',
      universeId: 'universe-2',
      categoryId: category.id,
      name: 'Humans',
    });

    await seedData(category, [
      targetEntry,
      entryFromAnotherCategory,
      entryFromAnotherUniverse,
    ]);

    const deletedAt = '2026-11-03T15:00:00.000Z';
    const deletedCategory = createDeletedCategory(category, deletedAt);

    await repository.deleteReferenceCategory(deletedCategory, 1);

    // The target entry must be deleted.
    expect(await getStoredEntry(targetEntry.id)).toEqual({
      ...targetEntry,
      deletedAt,
      updatedAt: deletedAt,
      revision: 2,
    });

    // Entries outside the target category must remain unchanged.
    expect(await getStoredEntry(entryFromAnotherCategory.id)).toEqual(
      entryFromAnotherCategory,
    );

    // Entries from another universe must remain unchanged too.
    expect(await getStoredEntry(entryFromAnotherUniverse.id)).toEqual(
      entryFromAnotherUniverse,
    );

    const database = await getDatabase();

    const transaction = database.transaction(
      REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
      'readonly',
    );

    const transactionDone = idbTransactionToPromise(transaction);

    const reservations = await idbRequestToPromise(
      transaction.objectStore(REFERENCE_ENTRY_NAME_RESERVATIONS_STORE).getAll(),
    );

    await transactionDone;

    expect(reservations).toHaveLength(2);
    expect(reservations.map((reservation) => reservation.entryId)).toEqual(
      expect.arrayContaining([entryFromAnotherCategory.id, entryFromAnotherUniverse.id]),
    );
  });
});
