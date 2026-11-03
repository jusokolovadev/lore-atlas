import type { DatabaseMigration } from './migration.types';
import { UNIVERSES_STORE } from '../database/database.types';

export const createUniversesStoreMigration: DatabaseMigration = {
  version: 2,

  up(database) {
    if (!database.objectStoreNames.contains(UNIVERSES_STORE)) {
      database.createObjectStore(UNIVERSES_STORE, {
        keyPath: 'id',
      });
    }
  },
};
