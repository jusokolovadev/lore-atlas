import { migrations } from './migrations';

export function runMigrations(
  database: IDBDatabase,
  oldVersion: number,
  newVersion: number,
): void {
  const migrationsToRun = migrations
    .filter(
      (migration) => migration.version > oldVersion && migration.version <= newVersion,
    )
    .sort((first, second) => first.version - second.version);

  for (let version = oldVersion + 1; version <= newVersion; version += 1) {
    const migration = migrationsToRun.find((item) => item.version === version);

    if (!migration) {
      throw new Error(`Missing database migration for version ${version}.`);
    }

    migration.up(database);
  }
}
