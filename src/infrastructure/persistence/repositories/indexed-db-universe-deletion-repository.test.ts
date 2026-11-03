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

function createUniverse(overrides: Partial<Universe> = {}): Universe {
  return {
    id: 'universe-1',
    name: 'Middle-earth',
    description: null,
    coverImage: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: '2026-02-01T00:00:00.000Z',
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
    updatedAt: '2026-02-01T00:00:00.000Z',
    deletedAt: '2026-02-01T00:00:00.000Z',
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

  it('deletes a universe and its categories atomically', async () => {
    const universe = createUniverse({
      deletedAt: null,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const firstCategory = createCategory({
      id: 'category-1',
      name: 'Species',
      deletedAt: null,
    });

    const secondCategory = createCategory({
      id: 'category-2',
      name: 'Languages',
      deletedAt: null,
    });

    await saveUniverse({
      ...universe,
      deletedAt: null,
    });

    await Promise.all([
      saveCategory({ ...firstCategory, deletedAt: null }),
      saveCategory({ ...secondCategory, deletedAt: null }),
      saveReservation(firstCategory),
      saveReservation(secondCategory),
    ]);

    const deletedUniverse: Universe = {
      ...universe,
      deletedAt: '2026-02-01T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z',
    };

    const deletedCategories = [firstCategory, secondCategory].map((category) => ({
      ...category,
      deletedAt: '2026-02-01T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z',
    }));

    await repository.deleteUniverseWithCategories(deletedUniverse, deletedCategories);

    expect(await findUniverse(universe.id)).toEqual(deletedUniverse);
    expect(await findCategory(firstCategory.id)).toEqual(deletedCategories[0]);
    expect(await findCategory(secondCategory.id)).toEqual(deletedCategories[1]);
  });

  it('releases category name reservations', async () => {
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

    await repository.deleteUniverseWithCategories(universe, [
      firstCategory,
      secondCategory,
    ]);

    expect(await findReservation(universe.id, 'Species')).toBeUndefined();

    expect(await findReservation(universe.id, 'Languages')).toBeUndefined();
  });

  it('does not affect categories belonging to another universe', async () => {
    const universe = createUniverse();

    const otherCategory = createCategory({
      id: 'category-2',
      universeId: 'universe-2',
      name: 'Species',
      deletedAt: null,
    });

    await saveUniverse(universe);
    await saveCategory(otherCategory);
    await saveReservation(otherCategory);

    await repository.deleteUniverseWithCategories(universe, []);

    expect(await findCategory(otherCategory.id)).toEqual(otherCategory);

    expect(await findReservation('universe-2', 'Species')).toEqual({
      universeId: 'universe-2',
      name: 'Species',
      categoryId: otherCategory.id,
    });
  });

  it('rolls back all changes when an operation fails', async () => {
    const universe = createUniverse({
      deletedAt: null,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const category = createCategory({
      id: 'category-1',
      name: 'Species',
      deletedAt: null,
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    await saveUniverse(universe);
    await saveCategory(category);
    await saveReservation(category);

    const deletedUniverse: Universe = {
      ...universe,
      deletedAt: '2026-02-01T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z',
    };

    // Намеренно передаём некорректный ключ,
    // чтобы IndexedDB выбросила DataError при put().
    const invalidCategory = {
      ...category,
      id: undefined,
    } as unknown as CustomReferenceCategory;

    await expect(
      repository.deleteUniverseWithCategories(deletedUniverse, [invalidCategory]),
    ).rejects.toBeDefined();

    expect(await findUniverse(universe.id)).toEqual(universe);
    expect(await findCategory(category.id)).toEqual(category);

    expect(await findReservation(universe.id, category.name)).toEqual({
      universeId: universe.id,
      name: category.name,
      categoryId: category.id,
    });
  });

  it('should delete a universe without categories', async () => {
    const universe = createUniverse({
      deletedAt: null,
    });

    await saveUniverse(universe);

    const deletedUniverse: Universe = {
      ...universe,
      deletedAt: '2026-02-01T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z',
    };

    await repository.deleteUniverseWithCategories(deletedUniverse, []);

    expect(await findUniverse(universe.id)).toEqual(deletedUniverse);
  });
});
