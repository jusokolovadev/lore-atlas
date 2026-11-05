import type { DatabaseMigration } from './migration.types';

export const initialMigration: DatabaseMigration = {
  version: 1,

  up() {
    // The initial database version has no schema.
  },
};
