import type { Universe } from 'src/features/universes/domain/models/universe';
import type { UniverseRepository } from 'src/features/universes/application/repositories/universe-repository';

import {
  UniverseAlreadyExistsError,
  UniverseConcurrencyError,
} from 'src/features/universes/application/errors/universe-repository-errors';

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

  async create(universe: Universe): Promise<void> {
    const database = await getDatabase();

    const transaction = database.transaction(UNIVERSES_STORE, 'readwrite');
    const transactionPromise = idbTransactionToPromise(transaction);

    const request = transaction.objectStore(UNIVERSES_STORE).add(universe);

    try {
      await Promise.all([idbRequestToPromise(request), transactionPromise]);
    } catch (error) {
      await transactionPromise.catch(() => undefined);

      if (error instanceof DOMException && error.name === 'ConstraintError') {
        throw new UniverseAlreadyExistsError();
      }

      throw error;
    }
  }

  async update(universe: Universe, expectedRevision: number): Promise<void> {
    await this.saveWithRevisionCheck(universe, expectedRevision);
  }

  async restore(universe: Universe, expectedRevision: number): Promise<void> {
    await this.saveWithRevisionCheck(universe, expectedRevision);
  }

  private async saveWithRevisionCheck(
    universe: Universe,
    expectedRevision: number,
  ): Promise<void> {
    const database = await getDatabase();

    const transaction = database.transaction(UNIVERSES_STORE, 'readwrite');
    const transactionPromise = idbTransactionToPromise(transaction);

    const store = transaction.objectStore(UNIVERSES_STORE);

    try {
      const request = store.get(universe.id) as IDBRequest<Universe | undefined>;

      const currentUniverse = await idbRequestToPromise(request);

      if (!currentUniverse || currentUniverse.revision !== expectedRevision) {
        transaction.abort();
        await transactionPromise.catch(() => undefined);

        throw new UniverseConcurrencyError();
      }

      const updateRequest = store.put(universe);

      await Promise.all([idbRequestToPromise(updateRequest), transactionPromise]);
    } catch (error) {
      await transactionPromise.catch(() => undefined);
      throw error;
    }
  }
}
