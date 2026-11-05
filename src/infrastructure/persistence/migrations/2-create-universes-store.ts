import type { DatabaseMigration } from './migration.types';

import {
  UNIVERSES_STORE,
  REFERENCE_CATEGORIES_STORE,
  CATEGORY_NAME_RESERVATIONS_STORE,
  REFERENCE_ENTRIES_STORE,
  REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
  UNIVERSE_ENTITIES_STORE,
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

      reservationsStore.createIndex('by_category_id', 'categoryId', {
        unique: true,
      });
    }

    if (!database.objectStoreNames.contains(REFERENCE_ENTRIES_STORE)) {
      const referenceEntriesStore = database.createObjectStore(REFERENCE_ENTRIES_STORE, {
        keyPath: 'id',
      });

      referenceEntriesStore.createIndex('by_universe_id', 'universeId');

      referenceEntriesStore.createIndex('by_category', [
        'universeId',
        'categoryType',
        'categoryId',
      ]);
    }

    if (!database.objectStoreNames.contains(REFERENCE_ENTRY_NAME_RESERVATIONS_STORE)) {
      const reservationsStore = database.createObjectStore(
        REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
        {
          keyPath: ['universeId', 'categoryType', 'categoryId', 'name'],
        },
      );

      reservationsStore.createIndex('by_entry_id', 'entryId', {
        unique: true,
      });
    }

    if (!database.objectStoreNames.contains(UNIVERSE_ENTITIES_STORE)) {
      const entitiesStore = database.createObjectStore(UNIVERSE_ENTITIES_STORE, {
        keyPath: 'id',
      });

      entitiesStore.createIndex('universeId', 'universeId');

      entitiesStore.createIndex('universeId_type', ['universeId', 'type']);
    }
  },
};
