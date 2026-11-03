import type { DatabaseMigration } from './migration.types';
import {
  UNIVERSES_STORE,
  REFERENCE_CATEGORIES_STORE,
  CATEGORY_NAME_RESERVATIONS_STORE,
} from '../database/database.types';

export const createUniversesStoreMigration: DatabaseMigration = {
  version: 2,

  up(database) {
    if (!database.objectStoreNames.contains(UNIVERSES_STORE)) {
      database.createObjectStore(UNIVERSES_STORE, {
        keyPath: 'id',
      });
    }

    if (!database.objectStoreNames.contains(REFERENCE_CATEGORIES_STORE)) {
      const categoriesStore = database.createObjectStore(REFERENCE_CATEGORIES_STORE, {
        keyPath: 'id',
      });

      categoriesStore.createIndex('by_universe_id', 'universeId');
    }

    if (!database.objectStoreNames.contains(CATEGORY_NAME_RESERVATIONS_STORE)) {
      const reservationsStore = database.createObjectStore(
        CATEGORY_NAME_RESERVATIONS_STORE,
        {
          keyPath: ['universeId', 'name'],
        },
      );

      reservationsStore.createIndex('by_category_id', 'categoryId', { unique: true });
    }
  },
};
