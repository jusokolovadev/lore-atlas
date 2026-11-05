import {
  getDatabase,
  closeDatabase,
} from 'src/infrastructure/persistence/database/database';

import { idbRequestToPromise } from '../database/idb-request';
import { idbTransactionToPromise } from '../database/idb-transaction';

import {
  UNIVERSES_STORE,
  REFERENCE_CATEGORIES_STORE,
  CATEGORY_NAME_RESERVATIONS_STORE,
  REFERENCE_ENTRIES_STORE,
  REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
} from '../database/database.types';

import type { Universe } from 'src/features/universes/domain/models/universe';
import type { CustomReferenceCategory } from 'src/features/reference-categories/domain/models/custom-reference-category';
import type { ReferenceEntry } from 'src/features/reference-entry/domain/models/reference-entry';

import { IndexedDbUniverseDeletionRepository } from './indexed-db-universe-deletion-repository';

const DELETION_TIME = '2026-02-01T00:00:00.000Z';

function createUniverse(overrides: Partial<Universe> = {}): Universe {
  return {
    id: 'universe-1',
    name: 'Middle-earth',
    description: null,
    coverImage: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

function createCategory(
  overrides: Partial<CustomReferenceCategory> = {},
): CustomReferenceCategory {
  return {
    id: crypto.randomUUID(),
    universeId: 'universe-1',
    name: 'Species',
    description: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    revision: 1,
    ...overrides,
  };
}

function createEntry(overrides: Partial<ReferenceEntry> = {}): ReferenceEntry {
  return {
    id: crypto.randomUUID(),
    universeId: 'universe-1',
    categoryType: 'custom',
    categoryId: 'category-1',
    name: 'Elf',
    description: null,
    image: null,
    revision: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

describe('IndexedDbUniverseDeletionRepository', () => {
  let repository: IndexedDbUniverseDeletionRepository;

  beforeEach(async () => {
    await closeDatabase();

    repository = new IndexedDbUniverseDeletionRepository();
  });

  afterEach(async () => {
    await closeDatabase();
  });

  async function saveUniverse(universe: Universe): Promise<void> {
    const database = await getDatabase();
    const transaction = database.transaction(UNIVERSES_STORE, 'readwrite');
    const transactionPromise = idbTransactionToPromise(transaction);

    const request = transaction.objectStore(UNIVERSES_STORE).put(universe);

    await Promise.all([idbRequestToPromise(request), transactionPromise]);
  }

  async function saveCategory(category: CustomReferenceCategory): Promise<void> {
    const database = await getDatabase();
    const transaction = database.transaction(REFERENCE_CATEGORIES_STORE, 'readwrite');
    const transactionPromise = idbTransactionToPromise(transaction);

    const request = transaction.objectStore(REFERENCE_CATEGORIES_STORE).put(category);

    await Promise.all([idbRequestToPromise(request), transactionPromise]);
  }

  async function saveReservation(category: CustomReferenceCategory): Promise<void> {
    const database = await getDatabase();
    const transaction = database.transaction(
      CATEGORY_NAME_RESERVATIONS_STORE,
      'readwrite',
    );
    const transactionPromise = idbTransactionToPromise(transaction);

    const request = transaction.objectStore(CATEGORY_NAME_RESERVATIONS_STORE).put({
      universeId: category.universeId,
      name: category.name,
      categoryId: category.id,
    });

    await Promise.all([idbRequestToPromise(request), transactionPromise]);
  }

  async function saveEntry(entry: ReferenceEntry): Promise<void> {
    const database = await getDatabase();
    const transaction = database.transaction(REFERENCE_ENTRIES_STORE, 'readwrite');
    const transactionPromise = idbTransactionToPromise(transaction);

    const request = transaction.objectStore(REFERENCE_ENTRIES_STORE).put(entry);

    await Promise.all([idbRequestToPromise(request), transactionPromise]);
  }

  async function saveEntryReservation(entry: ReferenceEntry): Promise<void> {
    const database = await getDatabase();
    const transaction = database.transaction(
      REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
      'readwrite',
    );
    const transactionPromise = idbTransactionToPromise(transaction);

    const request = transaction.objectStore(REFERENCE_ENTRY_NAME_RESERVATIONS_STORE).put({
      universeId: entry.universeId,
      categoryType: entry.categoryType,
      categoryId: entry.categoryId,
      name: entry.name,
      entryId: entry.id,
    });

    await Promise.all([idbRequestToPromise(request), transactionPromise]);
  }

  async function findUniverse(id: string): Promise<Universe | undefined> {
    const database = await getDatabase();
    const transaction = database.transaction(UNIVERSES_STORE, 'readonly');
    const transactionPromise = idbTransactionToPromise(transaction);

    const request = transaction.objectStore(UNIVERSES_STORE).get(id);

    const [universe] = await Promise.all([
      idbRequestToPromise(request),
      transactionPromise,
    ]);

    return universe;
  }

  async function findCategory(id: string): Promise<CustomReferenceCategory | undefined> {
    const database = await getDatabase();
    const transaction = database.transaction(REFERENCE_CATEGORIES_STORE, 'readonly');
    const transactionPromise = idbTransactionToPromise(transaction);

    const request = transaction.objectStore(REFERENCE_CATEGORIES_STORE).get(id);

    const [category] = await Promise.all([
      idbRequestToPromise(request),
      transactionPromise,
    ]);

    return category;
  }

  async function findEntry(id: string): Promise<ReferenceEntry | undefined> {
    const database = await getDatabase();
    const transaction = database.transaction(REFERENCE_ENTRIES_STORE, 'readonly');
    const transactionPromise = idbTransactionToPromise(transaction);

    const request = transaction.objectStore(REFERENCE_ENTRIES_STORE).get(id);

    const [entry] = await Promise.all([idbRequestToPromise(request), transactionPromise]);

    return entry;
  }

  async function findReservation(
    universeId: string,
    name: string,
  ): Promise<{ universeId: string; name: string; categoryId: string } | undefined> {
    const database = await getDatabase();
    const transaction = database.transaction(
      CATEGORY_NAME_RESERVATIONS_STORE,
      'readonly',
    );
    const transactionPromise = idbTransactionToPromise(transaction);

    const request = transaction
      .objectStore(CATEGORY_NAME_RESERVATIONS_STORE)
      .get([universeId, name]);

    const [reservation] = await Promise.all([
      idbRequestToPromise(request),
      transactionPromise,
    ]);

    return reservation;
  }

  async function findEntryReservation(entry: ReferenceEntry): Promise<
    | {
        universeId: string;
        categoryType: ReferenceEntry['categoryType'];
        categoryId: string;
        name: string;
        entryId: string;
      }
    | undefined
  > {
    const database = await getDatabase();
    const transaction = database.transaction(
      REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
      'readonly',
    );
    const transactionPromise = idbTransactionToPromise(transaction);

    const request = transaction
      .objectStore(REFERENCE_ENTRY_NAME_RESERVATIONS_STORE)
      .get([entry.universeId, entry.categoryType, entry.categoryId, entry.name]);

    const [reservation] = await Promise.all([
      idbRequestToPromise(request),
      transactionPromise,
    ]);

    return reservation;
  }

  it('deletes a universe and all its active categories and entries atomically', async () => {
    const universe = createUniverse();

    const firstCategory = createCategory({
      id: 'category-1',
      name: 'Species',
    });

    const secondCategory = createCategory({
      id: 'category-2',
      name: 'Languages',
    });

    const alreadyDeletedCategory = createCategory({
      id: 'category-3',
      name: 'Archived categories',
      deletedAt: '2026-01-15T00:00:00.000Z',
    });

    const firstEntry = createEntry({
      id: 'entry-1',
      categoryId: firstCategory.id,
      name: 'Elf',
    });

    const secondEntry = createEntry({
      id: 'entry-2',
      categoryId: firstCategory.id,
      name: 'Dwarf',
    });

    const alreadyDeletedEntry = createEntry({
      id: 'entry-3',
      categoryId: firstCategory.id,
      name: 'Archived entry',
      deletedAt: '2026-01-15T00:00:00.000Z',
    });

    await saveUniverse(universe);

    await Promise.all([
      saveCategory(firstCategory),
      saveCategory(secondCategory),
      saveCategory(alreadyDeletedCategory),

      saveReservation(firstCategory),
      saveReservation(secondCategory),

      saveEntry(firstEntry),
      saveEntry(secondEntry),
      saveEntry(alreadyDeletedEntry),

      saveEntryReservation(firstEntry),
      saveEntryReservation(secondEntry),
    ]);

    await repository.deleteUniverseWithCategories(universe.id, DELETION_TIME);

    expect(await findUniverse(universe.id)).toEqual({
      ...universe,
      deletedAt: DELETION_TIME,
      updatedAt: DELETION_TIME,
    });

    expect(await findCategory(firstCategory.id)).toEqual({
      ...firstCategory,
      deletedAt: DELETION_TIME,
      updatedAt: DELETION_TIME,
      revision: 2,
    });

    expect(await findCategory(secondCategory.id)).toEqual({
      ...secondCategory,
      deletedAt: DELETION_TIME,
      updatedAt: DELETION_TIME,
      revision: 2,
    });

    // Previously deleted categories must remain unchanged.
    expect(await findCategory(alreadyDeletedCategory.id)).toEqual(alreadyDeletedCategory);

    expect(await findEntry(firstEntry.id)).toEqual({
      ...firstEntry,
      deletedAt: DELETION_TIME,
      updatedAt: DELETION_TIME,
      revision: 2,
    });

    expect(await findEntry(secondEntry.id)).toEqual({
      ...secondEntry,
      deletedAt: DELETION_TIME,
      updatedAt: DELETION_TIME,
      revision: 2,
    });

    // Previously deleted entries must remain unchanged.
    expect(await findEntry(alreadyDeletedEntry.id)).toEqual(alreadyDeletedEntry);
  });

  it('releases name reservations for all active categories and entries', async () => {
    const universe = createUniverse();

    const category = createCategory({
      id: 'category-1',
      name: 'Species',
    });

    const firstEntry = createEntry({
      id: 'entry-1',
      categoryId: category.id,
      name: 'Elf',
    });

    const secondEntry = createEntry({
      id: 'entry-2',
      categoryId: category.id,
      name: 'Dwarf',
    });

    await saveUniverse(universe);

    await Promise.all([
      saveCategory(category),
      saveReservation(category),

      saveEntry(firstEntry),
      saveEntry(secondEntry),

      saveEntryReservation(firstEntry),
      saveEntryReservation(secondEntry),
    ]);

    await repository.deleteUniverseWithCategories(universe.id, DELETION_TIME);

    expect(await findReservation(universe.id, category.name)).toBeUndefined();

    expect(await findEntryReservation(firstEntry)).toBeUndefined();
    expect(await findEntryReservation(secondEntry)).toBeUndefined();
  });

  it('does not affect categories and entries belonging to another universe', async () => {
    const universe = createUniverse();

    const otherCategory = createCategory({
      id: 'category-2',
      universeId: 'universe-2',
      name: 'Species',
    });

    const otherEntry = createEntry({
      id: 'entry-2',
      universeId: 'universe-2',
      categoryId: otherCategory.id,
      name: 'Elf',
    });

    await saveUniverse(universe);
    await saveCategory(otherCategory);
    await saveReservation(otherCategory);
    await saveEntry(otherEntry);
    await saveEntryReservation(otherEntry);

    await repository.deleteUniverseWithCategories(universe.id, DELETION_TIME);

    expect(await findCategory(otherCategory.id)).toEqual(otherCategory);
    expect(await findEntry(otherEntry.id)).toEqual(otherEntry);

    expect(await findReservation('universe-2', 'Species')).toEqual({
      universeId: 'universe-2',
      name: 'Species',
      categoryId: otherCategory.id,
    });

    expect(await findEntryReservation(otherEntry)).toEqual({
      universeId: 'universe-2',
      categoryType: otherEntry.categoryType,
      categoryId: otherEntry.categoryId,
      name: otherEntry.name,
      entryId: otherEntry.id,
    });
  });

  it('deletes a universe without categories or entries', async () => {
    const universe = createUniverse();

    await saveUniverse(universe);

    await repository.deleteUniverseWithCategories(universe.id, DELETION_TIME);

    expect(await findUniverse(universe.id)).toEqual({
      ...universe,
      deletedAt: DELETION_TIME,
      updatedAt: DELETION_TIME,
    });
  });

  it('throws NOT_FOUND when the universe does not exist', async () => {
    await expect(
      repository.deleteUniverseWithCategories('missing-universe', DELETION_TIME),
    ).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  it('throws ALREADY_DELETED when the universe is already deleted', async () => {
    const universe = createUniverse({
      deletedAt: '2026-01-15T00:00:00.000Z',
    });

    const category = createCategory();

    const entry = createEntry({
      categoryId: category.id,
    });

    await saveUniverse(universe);
    await saveCategory(category);
    await saveReservation(category);
    await saveEntry(entry);
    await saveEntryReservation(entry);

    await expect(
      repository.deleteUniverseWithCategories(universe.id, DELETION_TIME),
    ).rejects.toMatchObject({
      code: 'ALREADY_DELETED',
    });

    // Nothing should have changed.
    expect(await findUniverse(universe.id)).toEqual(universe);
    expect(await findCategory(category.id)).toEqual(category);
    expect(await findEntry(entry.id)).toEqual(entry);

    expect(await findReservation(universe.id, category.name)).toEqual({
      universeId: universe.id,
      name: category.name,
      categoryId: category.id,
    });

    expect(await findEntryReservation(entry)).toEqual({
      universeId: entry.universeId,
      categoryType: entry.categoryType,
      categoryId: entry.categoryId,
      name: entry.name,
      entryId: entry.id,
    });
  });

  it('rolls back all changes when an active entry has no name reservation', async () => {
    const universe = createUniverse();

    const category = createCategory({
      id: 'category-1',
      name: 'Species',
    });

    const entry = createEntry({
      id: 'entry-1',
      categoryId: category.id,
      name: 'Elf',
    });

    await saveUniverse(universe);
    await saveCategory(category);
    await saveReservation(category);
    await saveEntry(entry);

    // Intentionally do not create the entry name reservation.

    await expect(
      repository.deleteUniverseWithCategories(universe.id, DELETION_TIME),
    ).rejects.toThrow();

    // The transaction must roll back the universe and category changes too.
    expect(await findUniverse(universe.id)).toEqual(universe);
    expect(await findCategory(category.id)).toEqual(category);
    expect(await findEntry(entry.id)).toEqual(entry);

    // The category reservation must also remain intact.
    expect(await findReservation(universe.id, category.name)).toEqual({
      universeId: universe.id,
      name: category.name,
      categoryId: category.id,
    });

    expect(await findEntryReservation(entry)).toBeUndefined();
  });
});
