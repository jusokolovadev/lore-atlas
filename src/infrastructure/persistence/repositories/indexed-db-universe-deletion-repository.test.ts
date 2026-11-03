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
} from '../database/database.types';

import type { Universe } from 'src/features/universes/domain/models/universe';
import type { CustomReferenceCategory } from 'src/features/reference-categories/domain/models/custom-reference-category';

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

  it('deletes a universe and all its active categories atomically', async () => {
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

    await saveUniverse(universe);

    await Promise.all([
      saveCategory(firstCategory),
      saveCategory(secondCategory),
      saveCategory(alreadyDeletedCategory),
      saveReservation(firstCategory),
      saveReservation(secondCategory),
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
    });

    expect(await findCategory(secondCategory.id)).toEqual({
      ...secondCategory,
      deletedAt: DELETION_TIME,
      updatedAt: DELETION_TIME,
    });

    // Previously deleted categories must remain unchanged.
    expect(await findCategory(alreadyDeletedCategory.id)).toEqual(alreadyDeletedCategory);
  });

  it('releases name reservations for all active categories', async () => {
    const universe = createUniverse();

    const firstCategory = createCategory({
      id: 'category-1',
      name: 'Species',
    });

    const secondCategory = createCategory({
      id: 'category-2',
      name: 'Languages',
    });

    await saveUniverse(universe);

    await Promise.all([
      saveCategory(firstCategory),
      saveCategory(secondCategory),
      saveReservation(firstCategory),
      saveReservation(secondCategory),
    ]);

    await repository.deleteUniverseWithCategories(universe.id, DELETION_TIME);

    expect(await findReservation(universe.id, 'Species')).toBeUndefined();
    expect(await findReservation(universe.id, 'Languages')).toBeUndefined();
  });

  it('does not affect categories belonging to another universe', async () => {
    const universe = createUniverse();

    const otherCategory = createCategory({
      id: 'category-2',
      universeId: 'universe-2',
      name: 'Species',
    });

    await saveUniverse(universe);
    await saveCategory(otherCategory);
    await saveReservation(otherCategory);

    await repository.deleteUniverseWithCategories(universe.id, DELETION_TIME);

    expect(await findCategory(otherCategory.id)).toEqual(otherCategory);

    expect(await findReservation('universe-2', 'Species')).toEqual({
      universeId: 'universe-2',
      name: 'Species',
      categoryId: otherCategory.id,
    });
  });

  it('deletes a universe without categories', async () => {
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

    await saveUniverse(universe);
    await saveCategory(category);
    await saveReservation(category);

    await expect(
      repository.deleteUniverseWithCategories(universe.id, DELETION_TIME),
    ).rejects.toMatchObject({
      code: 'ALREADY_DELETED',
    });

    // Nothing should have changed.
    expect(await findUniverse(universe.id)).toEqual(universe);
    expect(await findCategory(category.id)).toEqual(category);

    expect(await findReservation(universe.id, category.name)).toEqual({
      universeId: universe.id,
      name: category.name,
      categoryId: category.id,
    });
  });
});
