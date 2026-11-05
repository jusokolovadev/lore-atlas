import { getDatabase, closeDatabase } from '../database/database';

import {
  REFERENCE_ENTRIES_STORE,
  REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
} from '../database/database.types';

import { idbRequestToPromise } from '../database/idb-request';

import { idbTransactionToPromise } from '../database/idb-transaction';

import { IndexedDbReferenceEntryDeletionRepository } from './indexed-db-reference-entry-deletion-repository';
import { ReferenceEntryConcurrencyError } from 'src/features/reference-entry/application/errors/reference-entry-repository-errors';
import { ReferenceEntry } from 'src/features/reference-entry/domain/models/reference-entry';
import { ReferenceEntryNameReservation } from 'src/infrastructure/persistence/repositories/reference-entry-name-reservation';

describe('IndexedDbReferenceEntryDeletionRepository', () => {
  let repository: IndexedDbReferenceEntryDeletionRepository;

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

  beforeEach(async () => {
    repository = new IndexedDbReferenceEntryDeletionRepository();

    const database = await getDatabase();

    const transaction = database.transaction(
      [REFERENCE_ENTRIES_STORE, REFERENCE_ENTRY_NAME_RESERVATIONS_STORE],
      'readwrite',
    );

    transaction.objectStore(REFERENCE_ENTRIES_STORE).clear();
    transaction.objectStore(REFERENCE_ENTRY_NAME_RESERVATIONS_STORE).clear();

    await idbTransactionToPromise(transaction);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('should delete an entry and release its name reservation', async () => {
    const entry = createEntry();

    await seedEntries([entry]);

    const deletedAt = '2026-11-03T15:00:00.000Z';

    await repository.deleteReferenceEntry(entry.id, 1, deletedAt);

    const database = await getDatabase();

    const transaction = database.transaction(
      [REFERENCE_ENTRIES_STORE, REFERENCE_ENTRY_NAME_RESERVATIONS_STORE],
      'readonly',
    );

    const entriesStore = transaction.objectStore(REFERENCE_ENTRIES_STORE);
    const reservationsStore = transaction.objectStore(
      REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
    );

    const deletedEntry = await idbRequestToPromise(entriesStore.get(entry.id));

    const reservation = await idbRequestToPromise(
      reservationsStore.get([
        entry.universeId,
        entry.categoryType,
        entry.categoryId,
        entry.name,
      ]),
    );

    expect(deletedEntry).toEqual({
      ...entry,
      deletedAt,
      updatedAt: deletedAt,
      revision: 2,
    });

    expect(reservation).toBeUndefined();
  });

  it('should reject deletion when the entry does not exist', async () => {
    await expect(
      repository.deleteReferenceEntry('missing-entry', 1, '2026-11-03T15:00:00.000Z'),
    ).rejects.toBeInstanceOf(ReferenceEntryConcurrencyError);
  });

  it('should reject deletion when the revision is outdated', async () => {
    const entry = createEntry();

    await seedEntries([entry]);

    await expect(
      repository.deleteReferenceEntry(entry.id, 2, '2026-11-03T15:00:00.000Z'),
    ).rejects.toBeInstanceOf(ReferenceEntryConcurrencyError);

    // Entry and reservation must remain unchanged.
    const database = await getDatabase();

    const transaction = database.transaction(REFERENCE_ENTRIES_STORE, 'readonly');

    const storedEntry = await idbRequestToPromise(
      transaction.objectStore(REFERENCE_ENTRIES_STORE).get(entry.id),
    );

    expect(storedEntry).toEqual(entry);
  });

  it('should reject deletion when the name reservation is missing', async () => {
    const entry = createEntry();

    // Intentionally seed only the entry, without its reservation.
    const database = await getDatabase();
    const transaction = database.transaction(REFERENCE_ENTRIES_STORE, 'readwrite');

    const transactionDone = idbTransactionToPromise(transaction);

    transaction.objectStore(REFERENCE_ENTRIES_STORE).add(entry);

    await transactionDone;

    await expect(
      repository.deleteReferenceEntry(entry.id, 1, '2026-11-03T15:00:00.000Z'),
    ).rejects.toBeInstanceOf(ReferenceEntryConcurrencyError);

    const readTransaction = database.transaction(REFERENCE_ENTRIES_STORE, 'readonly');

    const storedEntry = await idbRequestToPromise(
      readTransaction.objectStore(REFERENCE_ENTRIES_STORE).get(entry.id),
    );

    expect(storedEntry).toEqual(entry);
  });
});
