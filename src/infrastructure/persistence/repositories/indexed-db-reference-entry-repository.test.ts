import {
  getDatabase,
  closeDatabase,
} from 'src/infrastructure/persistence/database/database';

import {
  REFERENCE_CATEGORIES_STORE,
  REFERENCE_ENTRIES_STORE,
  REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
  UNIVERSES_STORE,
} from 'src/infrastructure/persistence/database/database.types';

import { IndexedDbReferenceEntryRepository } from './indexed-db-reference-entry-repository';

import type { ReferenceEntry } from 'src/features/reference-entry/domain/models/reference-entry';
import {
  ReferenceEntryCategoryNotFoundError,
  ReferenceEntryCategoryUnavailableError,
  ReferenceEntryConcurrencyError,
  ReferenceEntryNameConflictError,
  ReferenceEntryUniverseUnavailableError,
} from 'src/features/reference-entry/application/errors/reference-entry-repository-errors';
import { idbRequestToPromise } from 'src/infrastructure/persistence/database/idb-request';
import { idbTransactionToPromise } from 'src/infrastructure/persistence/database/idb-transaction';
import { ReferenceEntryNameReservation } from 'src/infrastructure/persistence/repositories/reference-entry-name-reservation';

describe('IndexedDbReferenceEntryRepository', () => {
  let repository: IndexedDbReferenceEntryRepository;

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

  async function seedUniverse(universe: {
    id: string;
    deletedAt: string | null;
    enabledStandardCategoryIds?: string[];
  }) {
    const database = await getDatabase();
    const transaction = database.transaction(UNIVERSES_STORE, 'readwrite');

    transaction.objectStore(UNIVERSES_STORE).add(universe);

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  async function seedCategory(category: {
    id: string;
    universeId: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    deletedAt: string | null;
  }) {
    const database = await getDatabase();
    const transaction = database.transaction(REFERENCE_CATEGORIES_STORE, 'readwrite');

    transaction.objectStore(REFERENCE_CATEGORIES_STORE).add(category);

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  beforeEach(async () => {
    repository = new IndexedDbReferenceEntryRepository();

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

    transaction.objectStore(UNIVERSES_STORE).clear();
    transaction.objectStore(REFERENCE_CATEGORIES_STORE).clear();
    transaction.objectStore(REFERENCE_ENTRIES_STORE).clear();
    transaction.objectStore(REFERENCE_ENTRY_NAME_RESERVATIONS_STORE).clear();

    await idbTransactionToPromise(transaction);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  async function seedEntries(entries: ReferenceEntry[]) {
    const database = await getDatabase();

    const transaction = database.transaction(
      [REFERENCE_ENTRIES_STORE, REFERENCE_ENTRY_NAME_RESERVATIONS_STORE],
      'readwrite',
    );

    const transactionDone = idbTransactionToPromise(transaction);

    const entriesStore = transaction.objectStore(REFERENCE_ENTRIES_STORE);
    const reservationsStore = transaction.objectStore(
      REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
    );

    entries.forEach((entry) => {
      entriesStore.add(entry);

      if (entry.deletedAt === null) {
        const reservation: ReferenceEntryNameReservation = {
          universeId: entry.universeId,
          categoryType: entry.categoryType,
          categoryId: entry.categoryId,
          name: entry.name,
          entryId: entry.id,
        };

        reservationsStore.add(reservation);
      }
    });

    await transactionDone;
  }

  describe('find', () => {
    it('should find an entry by ID', async () => {
      const entry = createEntry();

      await seedEntries([entry]);

      await expect(repository.findById(entry.id)).resolves.toEqual(entry);
    });

    it('should return null when the entry does not exist', async () => {
      await expect(repository.findById('missing')).resolves.toBeNull();
    });

    it('should find active entries by category', async () => {
      const entries = [
        createEntry({ id: 'entry-1' }),
        createEntry({ id: 'entry-2', name: 'Dwarves' }),
        createEntry({
          id: 'entry-3',
          name: 'Deleted',
          deletedAt: '2026-11-02T10:00:00.000Z',
        }),
        createEntry({
          id: 'entry-4',
          categoryId: 'category-2',
          name: 'Other category',
        }),
      ];

      await seedEntries(entries);

      await expect(
        repository.findAllActiveByCategory('universe-1', 'custom', 'category-1'),
      ).resolves.toEqual([entries[0], entries[1]]);
    });

    it('should find active entries by universe', async () => {
      const entries = [
        createEntry({ id: 'entry-1' }),
        createEntry({ id: 'entry-2', name: 'Dwarves' }),
        createEntry({
          id: 'entry-3',
          deletedAt: '2026-11-02T10:00:00.000Z',
        }),
        createEntry({
          id: 'entry-4',
          universeId: 'universe-2',
        }),
      ];

      await seedEntries(entries);

      await expect(repository.findAllActiveByUniverseId('universe-1')).resolves.toEqual([
        entries[0],
        entries[1],
      ]);
    });

    it('should return deleted entries when finding by ID', async () => {
      const entry = createEntry({
        deletedAt: '2026-11-02T10:00:00.000Z',
      });

      await seedEntries([entry]);

      await expect(repository.findById(entry.id)).resolves.toEqual(entry);
    });
  });

  describe('create', () => {
    it('should create an entry and reserve its name atomically', async () => {
      const entry = createEntry();

      await seedUniverse({
        id: 'universe-1',
        deletedAt: null,
      });

      await seedCategory({
        id: 'category-1',
        universeId: 'universe-1',
        name: 'Characters',
        description: null,
        createdAt: entry.createdAt,
        updatedAt: entry.createdAt,
        deletedAt: null,
      });

      await repository.createIfCategoryAvailable(entry);

      await expect(repository.findById(entry.id)).resolves.toEqual(entry);

      const database = await getDatabase();
      const transaction = database.transaction(
        REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
        'readonly',
      );

      const reservation = await idbRequestToPromise(
        transaction
          .objectStore(REFERENCE_ENTRY_NAME_RESERVATIONS_STORE)
          .get(['universe-1', 'custom', 'category-1', 'Elves']),
      );

      expect(reservation).toEqual({
        universeId: 'universe-1',
        categoryType: 'custom',
        categoryId: 'category-1',
        name: 'Elves',
        entryId: 'entry-1',
      });
    });

    it('should reject creation when the universe is unavailable', async () => {
      const entry = createEntry();

      await seedUniverse({
        id: 'universe-1',
        deletedAt: '2026-11-02T10:00:00.000Z',
      });

      await expect(repository.createIfCategoryAvailable(entry)).rejects.toBeInstanceOf(
        ReferenceEntryUniverseUnavailableError,
      );

      await expect(repository.findById(entry.id)).resolves.toBeNull();
    });

    it('should reject creation when the category does not exist', async () => {
      const entry = createEntry();

      await seedUniverse({
        id: 'universe-1',
        deletedAt: null,
      });

      await expect(repository.createIfCategoryAvailable(entry)).rejects.toBeInstanceOf(
        ReferenceEntryCategoryNotFoundError,
      );

      await expect(repository.findById(entry.id)).resolves.toBeNull();
    });

    it('should reject creation when the category is deleted', async () => {
      const entry = createEntry();

      await seedUniverse({
        id: 'universe-1',
        deletedAt: null,
      });

      await seedCategory({
        id: 'category-1',
        universeId: 'universe-1',
        name: 'Characters',
        description: null,
        createdAt: entry.createdAt,
        updatedAt: entry.createdAt,
        deletedAt: '2026-11-02T10:00:00.000Z',
      });

      await expect(repository.createIfCategoryAvailable(entry)).rejects.toBeInstanceOf(
        ReferenceEntryCategoryUnavailableError,
      );

      await expect(repository.findById(entry.id)).resolves.toBeNull();
    });

    it('should reject creation when the name is already reserved', async () => {
      const entry = createEntry();

      await seedUniverse({
        id: 'universe-1',
        deletedAt: null,
      });

      await seedCategory({
        id: 'category-1',
        universeId: 'universe-1',
        name: 'Characters',
        description: null,
        createdAt: entry.createdAt,
        updatedAt: entry.createdAt,
        deletedAt: null,
      });

      await repository.createIfCategoryAvailable(entry);

      const duplicate = createEntry({
        id: 'entry-2',
      });

      await expect(
        repository.createIfCategoryAvailable(duplicate),
      ).rejects.toBeInstanceOf(ReferenceEntryNameConflictError);

      await expect(repository.findById('entry-2')).resolves.toBeNull();
    });

    it('should create an entry in an enabled standard category and reserve its name atomically', async () => {
      const entry = createEntry({
        categoryType: 'standard',
        categoryId: 'species',
      });

      await seedUniverse({
        id: 'universe-1',
        deletedAt: null,
        enabledStandardCategoryIds: ['species'],
      });

      await repository.createIfCategoryAvailable(entry);

      await expect(repository.findById(entry.id)).resolves.toEqual(entry);

      const database = await getDatabase();
      const transaction = database.transaction(
        REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
        'readonly',
      );

      const reservation = await idbRequestToPromise(
        transaction
          .objectStore(REFERENCE_ENTRY_NAME_RESERVATIONS_STORE)
          .get(['universe-1', 'standard', 'species', 'Elves']),
      );

      expect(reservation).toEqual({
        universeId: 'universe-1',
        categoryType: 'standard',
        categoryId: 'species',
        name: 'Elves',
        entryId: 'entry-1',
      });
    });

    it('should reject creation when the standard category does not exist', async () => {
      const entry = createEntry({
        categoryType: 'standard',
        categoryId: 'unknown-category',
      });

      await seedUniverse({
        id: 'universe-1',
        deletedAt: null,
        enabledStandardCategoryIds: ['species'],
      });

      await expect(repository.createIfCategoryAvailable(entry)).rejects.toBeInstanceOf(
        ReferenceEntryCategoryNotFoundError,
      );

      await expect(repository.findById(entry.id)).resolves.toBeNull();
    });

    it('should reject creation when the standard category is disabled', async () => {
      const entry = createEntry({
        categoryType: 'standard',
        categoryId: 'titles',
      });

      await seedUniverse({
        id: 'universe-1',
        deletedAt: null,
        enabledStandardCategoryIds: ['species'],
      });

      await expect(repository.createIfCategoryAvailable(entry)).rejects.toBeInstanceOf(
        ReferenceEntryCategoryUnavailableError,
      );

      await expect(repository.findById(entry.id)).resolves.toBeNull();
    });

    it('should reject creation when the name is already reserved in a standard category', async () => {
      const entry = createEntry({
        categoryType: 'standard',
        categoryId: 'species',
      });

      await seedUniverse({
        id: 'universe-1',
        deletedAt: null,
        enabledStandardCategoryIds: ['species'],
      });

      await repository.createIfCategoryAvailable(entry);

      const duplicate = createEntry({
        id: 'entry-2',
        categoryType: 'standard',
        categoryId: 'species',
      });

      await expect(
        repository.createIfCategoryAvailable(duplicate),
      ).rejects.toBeInstanceOf(ReferenceEntryNameConflictError);

      await expect(repository.findById('entry-2')).resolves.toBeNull();
    });
  });

  describe('update', () => {
    it('should update an entry without changing its name reservation', async () => {
      const entry = createEntry();

      await seedEntries([entry]);

      const updatedEntry = {
        ...entry,
        description: 'Updated description.',
        updatedAt: '2026-11-03T15:00:00.000Z',
        revision: 2,
      };

      await repository.update(updatedEntry, 1);

      await expect(repository.findById(entry.id)).resolves.toEqual(updatedEntry);

      const database = await getDatabase();
      const transaction = database.transaction(
        REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
        'readonly',
      );

      const reservation = await idbRequestToPromise(
        transaction
          .objectStore(REFERENCE_ENTRY_NAME_RESERVATIONS_STORE)
          .get(['universe-1', 'custom', 'category-1', 'Elves']),
      );

      expect(reservation).toEqual({
        universeId: 'universe-1',
        categoryType: 'custom',
        categoryId: 'category-1',
        name: 'Elves',
        entryId: 'entry-1',
      });
    });

    it('should reject a name change when the new name is already reserved', async () => {
      const firstEntry = createEntry();

      const secondEntry = createEntry({
        id: 'entry-2',
        name: 'Dwarves',
      });

      await seedEntries([firstEntry, secondEntry]);

      const updatedEntry = {
        ...firstEntry,
        name: 'Dwarves',
        revision: 2,
      };

      await expect(repository.update(updatedEntry, 1)).rejects.toBeInstanceOf(
        ReferenceEntryNameConflictError,
      );

      // The original entry must remain unchanged.
      await expect(repository.findById(firstEntry.id)).resolves.toEqual(firstEntry);

      const database = await getDatabase();
      const transaction = database.transaction(
        REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
        'readonly',
      );

      const oldReservation = await idbRequestToPromise(
        transaction
          .objectStore(REFERENCE_ENTRY_NAME_RESERVATIONS_STORE)
          .get(['universe-1', 'custom', 'category-1', 'Elves']),
      );

      expect(oldReservation).toEqual({
        universeId: 'universe-1',
        categoryType: 'custom',
        categoryId: 'category-1',
        name: 'Elves',
        entryId: 'entry-1',
      });
    });

    it('should reject an update when the revision is outdated', async () => {
      const entry = createEntry({
        revision: 2,
      });

      await seedEntries([entry]);

      const updatedEntry = {
        ...entry,
        description: 'Updated description.',
        revision: 3,
      };

      await expect(repository.update(updatedEntry, 1)).rejects.toBeInstanceOf(
        ReferenceEntryConcurrencyError,
      );

      await expect(repository.findById(entry.id)).resolves.toEqual(entry);
    });
  });

  describe('restore', () => {
    it('should restore an entry and reserve its name', async () => {
      const entry = createEntry({
        deletedAt: '2026-11-02T10:00:00.000Z',
        revision: 1,
      });

      await seedUniverse({
        id: 'universe-1',
        deletedAt: null,
      });

      await seedCategory({
        id: 'category-1',
        universeId: 'universe-1',
        name: 'Characters',
        description: null,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        deletedAt: null,
      });

      await seedEntries([entry]);

      const restoredEntry: ReferenceEntry = {
        ...entry,
        deletedAt: null,
        revision: 2,
        updatedAt: '2026-11-03T15:00:00.000Z',
      };

      await repository.restore(restoredEntry, 1);

      await expect(repository.findById(entry.id)).resolves.toEqual(restoredEntry);

      const database = await getDatabase();
      const transaction = database.transaction(
        REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
        'readonly',
      );

      const reservation = await idbRequestToPromise(
        transaction
          .objectStore(REFERENCE_ENTRY_NAME_RESERVATIONS_STORE)
          .get(['universe-1', 'custom', 'category-1', 'Elves']),
      );

      expect(reservation).toEqual({
        universeId: 'universe-1',
        categoryType: 'custom',
        categoryId: 'category-1',
        name: 'Elves',
        entryId: 'entry-1',
      });
    });

    it('should reject restoration when the category is deleted', async () => {
      const entry = createEntry({
        deletedAt: '2026-11-02T10:00:00.000Z',
      });

      await seedUniverse({
        id: 'universe-1',
        deletedAt: null,
      });

      await seedCategory({
        id: 'category-1',
        universeId: 'universe-1',
        name: 'Characters',
        description: null,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        deletedAt: '2026-11-02T12:00:00.000Z',
      });

      await seedEntries([entry]);

      const restoredEntry = {
        ...entry,
        deletedAt: null,
        revision: 2,
      };

      await expect(repository.restore(restoredEntry, 1)).rejects.toBeInstanceOf(
        ReferenceEntryCategoryUnavailableError,
      );

      await expect(repository.findById(entry.id)).resolves.toEqual(entry);
    });

    it('should reject restoration when the name is already reserved', async () => {
      const entry = createEntry({
        deletedAt: '2026-11-02T10:00:00.000Z',
      });

      await seedUniverse({
        id: 'universe-1',
        deletedAt: null,
      });

      await seedCategory({
        id: 'category-1',
        universeId: 'universe-1',
        name: 'Characters',
        description: null,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        deletedAt: null,
      });

      await seedEntries([entry]);

      const database = await getDatabase();
      const transaction = database.transaction(
        REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
        'readwrite',
      );

      transaction.objectStore(REFERENCE_ENTRY_NAME_RESERVATIONS_STORE).add({
        universeId: 'universe-1',
        categoryType: 'custom',
        categoryId: 'category-1',
        name: 'Elves',
        entryId: 'another-entry',
      });

      await idbTransactionToPromise(transaction);

      const restoredEntry = {
        ...entry,
        deletedAt: null,
        revision: 2,
      };

      await expect(repository.restore(restoredEntry, 1)).rejects.toBeInstanceOf(
        ReferenceEntryNameConflictError,
      );

      await expect(repository.findById(entry.id)).resolves.toEqual(entry);
    });

    it('should reject restoration when the universe is unavailable', async () => {
      const entry = createEntry({
        deletedAt: '2026-11-02T10:00:00.000Z',
      });

      await seedEntries([entry]);

      const restoredEntry = {
        ...entry,
        deletedAt: null,
        revision: 2,
      };

      await expect(repository.restore(restoredEntry, 1)).rejects.toBeInstanceOf(
        ReferenceEntryUniverseUnavailableError,
      );

      await expect(repository.findById(entry.id)).resolves.toEqual(entry);
    });

    it('should reject restoration when the revision is outdated', async () => {
      const entry = createEntry({
        deletedAt: '2026-11-02T10:00:00.000Z',
        revision: 2,
      });

      await seedEntries([entry]);

      const restoredEntry = {
        ...entry,
        deletedAt: null,
        revision: 3,
      };

      await expect(repository.restore(restoredEntry, 1)).rejects.toBeInstanceOf(
        ReferenceEntryConcurrencyError,
      );

      await expect(repository.findById(entry.id)).resolves.toEqual(entry);
    });

    it('should restore an entry in an enabled standard category and reserve its name', async () => {
      const entry = createEntry({
        categoryType: 'standard',
        categoryId: 'species',
        deletedAt: '2026-11-02T10:00:00.000Z',
        revision: 1,
      });

      await seedUniverse({
        id: 'universe-1',
        deletedAt: null,
        enabledStandardCategoryIds: ['species'],
      });

      await seedEntries([entry]);

      const restoredEntry: ReferenceEntry = {
        ...entry,
        deletedAt: null,
        revision: 2,
        updatedAt: '2026-11-03T15:00:00.000Z',
      };

      await repository.restore(restoredEntry, 1);

      await expect(repository.findById(entry.id)).resolves.toEqual(restoredEntry);

      const database = await getDatabase();
      const transaction = database.transaction(
        REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
        'readonly',
      );

      const reservation = await idbRequestToPromise(
        transaction
          .objectStore(REFERENCE_ENTRY_NAME_RESERVATIONS_STORE)
          .get(['universe-1', 'standard', 'species', 'Elves']),
      );

      expect(reservation).toEqual({
        universeId: 'universe-1',
        categoryType: 'standard',
        categoryId: 'species',
        name: 'Elves',
        entryId: 'entry-1',
      });
    });

    it('should reject restoration when the standard category is disabled', async () => {
      const entry = createEntry({
        categoryType: 'standard',
        categoryId: 'titles',
        deletedAt: '2026-11-02T10:00:00.000Z',
      });

      await seedUniverse({
        id: 'universe-1',
        deletedAt: null,
        enabledStandardCategoryIds: ['species'],
      });

      await seedEntries([entry]);

      const restoredEntry = {
        ...entry,
        deletedAt: null,
        revision: 2,
      };

      await expect(repository.restore(restoredEntry, 1)).rejects.toBeInstanceOf(
        ReferenceEntryCategoryUnavailableError,
      );

      await expect(repository.findById(entry.id)).resolves.toEqual(entry);
    });
  });

  it('should reject restoration when the standard category does not exist', async () => {
    const entry = createEntry({
      categoryType: 'standard',
      categoryId: 'unknown-category',
      deletedAt: '2026-11-02T10:00:00.000Z',
    });

    await seedUniverse({
      id: 'universe-1',
      deletedAt: null,
      enabledStandardCategoryIds: ['species'],
    });

    await seedEntries([entry]);

    const restoredEntry = {
      ...entry,
      deletedAt: null,
      revision: 2,
    };

    await expect(repository.restore(restoredEntry, 1)).rejects.toBeInstanceOf(
      ReferenceEntryCategoryNotFoundError,
    );

    await expect(repository.findById(entry.id)).resolves.toEqual(entry);
  });
});
