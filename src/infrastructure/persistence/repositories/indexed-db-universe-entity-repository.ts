import type { UniverseEntity } from 'src/features/entities/domain/models/universe-entity';
import type { UniverseEntityRepository } from 'src/features/entities/application/repositories/universe-entity-repository';
import { UniverseEntityConcurrencyError } from 'src/features/entities/application/errors/universe-entity-application-errors';

import { getDatabase } from '../database/database';
import { UNIVERSE_ENTITIES_STORE, UNIVERSES_STORE } from '../database/database.types';
import { idbRequestToPromise } from '../database/idb-request';
import { idbTransactionToPromise } from '../database/idb-transaction';

export class IndexedDbUniverseEntityRepository implements UniverseEntityRepository {
  async findById(id: string): Promise<UniverseEntity | null> {
    const database = await getDatabase();
    const transaction = database.transaction([UNIVERSE_ENTITIES_STORE], 'readonly');

    const entity = await idbRequestToPromise<UniverseEntity | undefined>(
      transaction.objectStore(UNIVERSE_ENTITIES_STORE).get(id),
    );

    await idbTransactionToPromise(transaction);

    return entity ?? null;
  }

  async findAllActiveByUniverseId(universeId: string): Promise<UniverseEntity[]> {
    const database = await getDatabase();
    const transaction = database.transaction([UNIVERSE_ENTITIES_STORE], 'readonly');

    const entities = await idbRequestToPromise<UniverseEntity[]>(
      transaction
        .objectStore(UNIVERSE_ENTITIES_STORE)
        .index('universeId')
        .getAll(universeId),
    );

    await idbTransactionToPromise(transaction);

    return entities.filter((entity) => entity.deletedAt === null);
  }

  async findAllActiveByType(
    universeId: string,
    type: UniverseEntity['type'],
  ): Promise<UniverseEntity[]> {
    const database = await getDatabase();
    const transaction = database.transaction([UNIVERSE_ENTITIES_STORE], 'readonly');

    const entities = await idbRequestToPromise<UniverseEntity[]>(
      transaction
        .objectStore(UNIVERSE_ENTITIES_STORE)
        .index('universeId_type')
        .getAll(IDBKeyRange.only([universeId, type])),
    );

    await idbTransactionToPromise(transaction);

    return entities.filter((entity) => entity.deletedAt === null);
  }

  async createIfUniverseActive(entity: UniverseEntity): Promise<boolean> {
    const database = await getDatabase();
    const transaction = database.transaction(
      [UNIVERSES_STORE, UNIVERSE_ENTITIES_STORE],
      'readwrite',
    );

    const transactionDone = idbTransactionToPromise(transaction);

    try {
      const universesStore = transaction.objectStore(UNIVERSES_STORE);
      const entitiesStore = transaction.objectStore(UNIVERSE_ENTITIES_STORE);

      const universe = await idbRequestToPromise<
        { deletedAt: string | null } | undefined
      >(universesStore.get(entity.universeId));

      if (!universe || universe.deletedAt !== null) {
        await transactionDone;
        return false;
      }

      await idbRequestToPromise(entitiesStore.add(entity));
      await transactionDone;

      return true;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // Transaction may already be inactive.
      }

      await transactionDone.catch(() => undefined);
      throw error;
    }
  }

  async update(entity: UniverseEntity, expectedRevision: number): Promise<void> {
    const database = await getDatabase();
    const transaction = database.transaction([UNIVERSE_ENTITIES_STORE], 'readwrite');

    const transactionDone = idbTransactionToPromise(transaction);

    try {
      const store = transaction.objectStore(UNIVERSE_ENTITIES_STORE);

      const existingEntity = await idbRequestToPromise<UniverseEntity | undefined>(
        store.get(entity.id),
      );

      if (
        !existingEntity ||
        existingEntity.deletedAt !== null ||
        existingEntity.revision !== expectedRevision
      ) {
        throw new UniverseEntityConcurrencyError(
          'Entity not found, deleted, or revision conflict.',
        );
      }

      await idbRequestToPromise(store.put(entity));
      await transactionDone;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // Transaction may already be inactive.
      }

      await transactionDone.catch(() => undefined);
      throw error;
    }
  }

  async restore(entity: UniverseEntity, expectedRevision: number): Promise<void> {
    const database = await getDatabase();
    const transaction = database.transaction(
      [UNIVERSES_STORE, UNIVERSE_ENTITIES_STORE],
      'readwrite',
    );

    const transactionDone = idbTransactionToPromise(transaction);

    try {
      const universesStore = transaction.objectStore(UNIVERSES_STORE);
      const entitiesStore = transaction.objectStore(UNIVERSE_ENTITIES_STORE);

      const existingEntity = await idbRequestToPromise<UniverseEntity | undefined>(
        entitiesStore.get(entity.id),
      );

      if (
        !existingEntity ||
        existingEntity.deletedAt === null ||
        existingEntity.revision !== expectedRevision
      ) {
        throw new UniverseEntityConcurrencyError(
          'Entity not found, not deleted, or revision conflict.',
        );
      }

      const universe = await idbRequestToPromise<
        { deletedAt: string | null } | undefined
      >(universesStore.get(entity.universeId));

      if (!universe || universe.deletedAt !== null) {
        throw new Error('Universe not found or deleted.');
      }

      await idbRequestToPromise(entitiesStore.put(entity));
      await transactionDone;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // Transaction may already be inactive.
      }

      await transactionDone.catch(() => undefined);
      throw error;
    }
  }
}
