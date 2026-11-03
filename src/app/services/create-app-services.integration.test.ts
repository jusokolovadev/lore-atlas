import {
  getDatabase,
  closeDatabase,
} from 'src/infrastructure/persistence/database/database';

import { idbRequestToPromise } from 'src/infrastructure/persistence/database/idb-request';
import { idbTransactionToPromise } from 'src/infrastructure/persistence/database/idb-transaction';

import {
  UNIVERSES_STORE,
  REFERENCE_CATEGORIES_STORE,
  CATEGORY_NAME_RESERVATIONS_STORE,
} from 'src/infrastructure/persistence/database/database.types';

import type { Universe } from 'src/features/universes/domain/models/universe';
import type { CustomReferenceCategory } from 'src/features/reference-categories/domain/models/custom-reference-category';

import { createAppServices } from './create-app-services';

const timestamp = '2026-01-01T00:00:00.000Z';
const deletionTimestamp = '2026-01-02T00:00:00.000Z';

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);

    request.onsuccess = () => resolve();

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to delete database.'));
    };

    request.onblocked = () => {
      reject(new Error('Database deletion is blocked.'));
    };
  });
}

describe('createAppServices integration', () => {
  beforeEach(async () => {
    await closeDatabase();
    await deleteDatabase('lore-atlas');
  });

  afterEach(async () => {
    await closeDatabase();
  });

  function createUniverse(id: string, name: string): Universe {
    return {
      id,
      name,
      description: null,
      coverImage: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    };
  }

  function createCategory(
    id: string,
    universeId: string,
    name: string,
  ): CustomReferenceCategory {
    return {
      id,
      universeId,
      name,
      description: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      deletedAt: null,
    };
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

  it('should soft delete a universe and its active categories atomically', async () => {
    const ids = ['universe-1', 'universe-2', 'category-1', 'category-2', 'category-3'];

    let idIndex = 0;

    let currentTime = timestamp;

    const services = createAppServices({
      generateId: () => ids[idIndex++],
      getCurrentTime: () => currentTime,
    });

    const firstUniverse = createUniverse('universe-1', 'Middle-earth');
    const secondUniverse = createUniverse('universe-2', 'Narnia');

    const firstCategory = createCategory('category-1', firstUniverse.id, 'Species');

    const secondCategory = createCategory('category-2', firstUniverse.id, 'Languages');

    const anotherUniverseCategory = createCategory(
      'category-3',
      secondUniverse.id,
      'Species',
    );

    await services.createUniverse({ name: firstUniverse.name });
    await services.createUniverse({ name: secondUniverse.name });

    await services.createReferenceCategory({
      universeId: firstUniverse.id,
      name: firstCategory.name,
    });

    await services.createReferenceCategory({
      universeId: firstUniverse.id,
      name: secondCategory.name,
    });

    await services.createReferenceCategory({
      universeId: secondUniverse.id,
      name: anotherUniverseCategory.name,
    });

    currentTime = deletionTimestamp;

    await services.deleteUniverse(firstUniverse.id);

    const deletedUniverse = await findUniverse(firstUniverse.id);
    const untouchedUniverse = await findUniverse(secondUniverse.id);

    expect(deletedUniverse).toEqual({
      ...firstUniverse,
      deletedAt: deletionTimestamp,
      updatedAt: deletionTimestamp,
    });

    expect(untouchedUniverse).toEqual(secondUniverse);

    const deletedFirstCategory = await findCategory(firstCategory.id);
    const deletedSecondCategory = await findCategory(secondCategory.id);
    const untouchedCategory = await findCategory(anotherUniverseCategory.id);

    expect(deletedFirstCategory).toEqual({
      ...firstCategory,
      deletedAt: deletionTimestamp,
      updatedAt: deletionTimestamp,
    });

    expect(deletedSecondCategory).toEqual({
      ...secondCategory,
      deletedAt: deletionTimestamp,
      updatedAt: deletionTimestamp,
    });

    expect(untouchedCategory).toEqual(anotherUniverseCategory);

    expect(await findReservation(firstUniverse.id, firstCategory.name)).toBeUndefined();

    expect(await findReservation(firstUniverse.id, secondCategory.name)).toBeUndefined();

    expect(
      await findReservation(secondUniverse.id, anotherUniverseCategory.name),
    ).toEqual({
      universeId: secondUniverse.id,
      name: anotherUniverseCategory.name,
      categoryId: anotherUniverseCategory.id,
    });
  });

  it('should restore a universe without restoring its categories', async () => {
    const ids = ['universe-1', 'category-1', 'category-2'];
    let idIndex = 0;

    let currentTime = timestamp;
    const restorationTimestamp = '2026-01-03T00:00:00.000Z';

    const services = createAppServices({
      generateId: () => ids[idIndex++],
      getCurrentTime: () => currentTime,
    });

    const universe = await services.createUniverse({
      name: 'Middle-earth',
    });

    const firstCategory = await services.createReferenceCategory({
      universeId: universe.id,
      name: 'Species',
    });

    const secondCategory = await services.createReferenceCategory({
      universeId: universe.id,
      name: 'Languages',
    });

    currentTime = deletionTimestamp;

    await services.deleteUniverse(universe.id);

    currentTime = restorationTimestamp;

    await services.restoreUniverse(universe.id);

    const restoredUniverse = await findUniverse(universe.id);
    const restoredFirstCategory = await findCategory(firstCategory.id);
    const restoredSecondCategory = await findCategory(secondCategory.id);

    expect(restoredUniverse).toEqual({
      ...universe,
      updatedAt: restorationTimestamp,
      deletedAt: null,
    });

    expect(restoredFirstCategory).toEqual({
      ...firstCategory,
      updatedAt: deletionTimestamp,
      deletedAt: deletionTimestamp,
    });

    expect(restoredSecondCategory).toEqual({
      ...secondCategory,
      updatedAt: deletionTimestamp,
      deletedAt: deletionTimestamp,
    });
  });
});
