import type { Universe } from 'src/features/universes/domain/models/universe';
import type { UniverseRepository } from 'src/features/universes/application/repositories/universe-repository';

import { getDatabase } from '../database/database';
import { idbRequestToPromise } from '../database/idb-request';
import { idbTransactionToPromise } from '../database/idb-transaction';
import { UNIVERSES_STORE } from '../database/database.types';

export class IndexedDbUniverseRepository implements UniverseRepository {
  async findById(id: string): Promise<Universe | null> {
    const database = await getDatabase();

    const transaction = database.transaction(UNIVERSES_STORE, 'readonly');

    const transactionPromise = idbTransactionToPromise(transaction);

    const request = transaction.objectStore(UNIVERSES_STORE).get(id) as IDBRequest<
      Universe | undefined
    >;

    const [universe] = await Promise.all([
      idbRequestToPromise(request),
      transactionPromise,
    ]);

    return universe ?? null;
  }

  async findAllActive(): Promise<Universe[]> {
    const database = await getDatabase();

    const transaction = database.transaction(UNIVERSES_STORE, 'readonly');

    const transactionPromise = idbTransactionToPromise(transaction);

    const request = transaction.objectStore(UNIVERSES_STORE).getAll() as IDBRequest<
      Universe[]
    >;

    const [universes] = await Promise.all([
      idbRequestToPromise(request),
      transactionPromise,
    ]);

    return universes.filter((universe) => universe.deletedAt === null);
  }

  async save(universe: Universe): Promise<void> {
    const database = await getDatabase();

    const transaction = database.transaction(UNIVERSES_STORE, 'readwrite');

    const transactionPromise = idbTransactionToPromise(transaction);

    const request = transaction.objectStore(UNIVERSES_STORE).put(universe);

    await Promise.all([idbRequestToPromise(request), transactionPromise]);
  }
}
