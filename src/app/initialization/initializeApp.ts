import { getDatabase } from 'src/infrastructure/persistence/database/database';

let initializationPromise: Promise<void> | null = null;

export function initializeApp(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = getDatabase()
      .then(() => undefined)
      .catch((error: unknown) => {
        initializationPromise = null;
        throw error;
      });
  }

  return initializationPromise;
}
