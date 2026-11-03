import { runMigrations } from '../migrations/run-migrations';

const DATABASE_NAME = 'lore-atlas';
const DATABASE_VERSION = 2;

let databasePromise: Promise<IDBDatabase> | null = null;

export function getDatabase(): Promise<IDBDatabase> {
  if (!databasePromise) {
    databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      let migrationError: unknown;

      request.onupgradeneeded = (event) => {
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion;

        if (newVersion === null) {
          return;
        }

        try {
          runMigrations(request.result, oldVersion, newVersion);
        } catch {
          request.transaction?.abort();
        }
      };

      request.onsuccess = () => {
        const database = request.result;

        database.onversionchange = () => {
          database.close();
          databasePromise = null;
        };

        resolve(database);
      };

      request.onerror = () => {
        reject(migrationError ?? request.error ?? new Error('Failed to open database'));
      };

      request.onblocked = () => {
        reject(new Error('Database upgrade is blocked by another connection.'));
      };
    }).catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
  }

  return databasePromise;
}
