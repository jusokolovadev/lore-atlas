import { initialMigration } from './v1-initial';
import { createUniversesStoreMigration } from './2-create-universes-store';

export const migrations = [initialMigration, createUniversesStoreMigration];
