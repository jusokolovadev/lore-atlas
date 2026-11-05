import { getDatabase, closeDatabase } from '../database/database';
import {
  CATEGORY_NAME_RESERVATIONS_STORE,
  REFERENCE_CATEGORIES_STORE,
  UNIVERSES_STORE,
  REFERENCE_ENTRIES_STORE,
  REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
} from '../database/database.types';

describe('Database migrations', () => {
  afterEach(async () => {
    await closeDatabase();
  });

  it('creates all required object stores', async () => {
    const database = await getDatabase();

    expect(database.objectStoreNames.contains(UNIVERSES_STORE)).toBe(true);
    expect(database.objectStoreNames.contains(REFERENCE_CATEGORIES_STORE)).toBe(true);
    expect(database.objectStoreNames.contains(CATEGORY_NAME_RESERVATIONS_STORE)).toBe(
      true,
    );
    expect(database.objectStoreNames.contains(REFERENCE_ENTRIES_STORE)).toBe(true);
    expect(
      database.objectStoreNames.contains(REFERENCE_ENTRY_NAME_RESERVATIONS_STORE),
    ).toBe(true);
  });

  it('creates an index for finding categories by universe ID', async () => {
    const database = await getDatabase();

    const transaction = database.transaction(REFERENCE_CATEGORIES_STORE, 'readonly');

    const store = transaction.objectStore(REFERENCE_CATEGORIES_STORE);

    expect(store.indexNames.contains('by_universe_id')).toBe(true);
    expect(store.index('by_universe_id').keyPath).toBe('universeId');
    expect(store.index('by_universe_id').unique).toBe(false);
  });

  it('enforces unique category name reservations per universe', async () => {
    const database = await getDatabase();

    const transaction = database.transaction(
      CATEGORY_NAME_RESERVATIONS_STORE,
      'readwrite',
    );

    const store = transaction.objectStore(CATEGORY_NAME_RESERVATIONS_STORE);

    store.add({
      universeId: 'universe-1',
      name: 'Species',
      categoryId: 'category-1',
    });

    store.add({
      universeId: 'universe-2',
      name: 'Species',
      categoryId: 'category-2',
    });

    await expect(
      new Promise<void>((resolve, reject) => {
        const request = store.add({
          universeId: 'universe-1',
          name: 'Species',
          categoryId: 'category-3',
        });

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
    ).rejects.toMatchObject({
      name: 'ConstraintError',
    });

    expect(
      transaction.db.objectStoreNames.contains(CATEGORY_NAME_RESERVATIONS_STORE),
    ).toBe(true);
  });
});
