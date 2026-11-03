import type { UniverseRepository } from '../../application/repositories/universe-repository';
import type { Universe } from '../../domain/models/universe';

import { getDatabase } from 'src/infrastructure/persistence/database/database';

const STORE_NAME = 'universes';

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB request failed.'));
    };
  });
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onabort = () => {
      reject(transaction.error ?? new Error('IndexedDB transaction was aborted.'));
    };
  });
}

export class IndexedDbUniverseRepository implements UniverseRepository {
  async findById(id: string): Promise<Universe | null> {
    const database = await getDatabase();

    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const requestPromise = requestToPromise<Universe | undefined>(store.get(id));
    const transactionPromise = transactionToPromise(transaction);

    const [universe] = await Promise.all([requestPromise, transactionPromise]);

    return universe ?? null;
  }

  async findAllActive(): Promise<Universe[]> {
    const database = await getDatabase();

    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);

    const requestPromise = requestToPromise<Universe[]>(store.getAll());
    const transactionPromise = transactionToPromise(transaction);

    const [universes] = await Promise.all([requestPromise, transactionPromise]);

    return universes.filter((universe) => universe.deletedAt === null);
  }

  async save(universe: Universe): Promise<void> {
    const database = await getDatabase();

    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const requestPromise = requestToPromise(store.put(universe));
    const transactionPromise = transactionToPromise(transaction);

    await Promise.all([requestPromise, transactionPromise]);
  }
}
