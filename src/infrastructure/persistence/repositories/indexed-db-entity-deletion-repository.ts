import { UNIVERSE_ENTITIES_STORE } from '../database/database.types';

import { getDatabase } from '../database/database';
import { idbRequestToPromise } from '../database/idb-request';
import { idbTransactionToPromise } from '../database/idb-transaction';

import type { UniverseEntity } from 'src/features/entities/domain/models/universe-entity';

import type { EntityDeletionRepository } from 'src/features/entities/application/repositories/entity-deletion-repository';

import { UniverseEntityConcurrencyError } from 'src/features/entities/application/errors/universe-entity-application-errors';

export class IndexedDbEntityDeletionRepository implements EntityDeletionRepository {
  async deleteEntity(
    id: string,
    expectedRevision: number,
    deletedAt: string,
  ): Promise<void> {
    const database = await getDatabase();

    const transaction = database.transaction([UNIVERSE_ENTITIES_STORE], 'readwrite');

    const transactionDone = idbTransactionToPromise(transaction);

    try {
      const entitiesStore = transaction.objectStore(UNIVERSE_ENTITIES_STORE);

      // 1. Получаем сущность.

      const existingEntity = await idbRequestToPromise<UniverseEntity | undefined>(
        entitiesStore.get(id),
      );

      // 2. Проверяем существование, состояние и ревизию.

      if (
        !existingEntity ||
        existingEntity.deletedAt !== null ||
        existingEntity.revision !== expectedRevision
      ) {
        throw new UniverseEntityConcurrencyError(
          'Entity not found, deleted, or revision conflict.',
        );
      }

      // 3. Создаём удалённую версию сущности.

      const deletedEntity: UniverseEntity = {
        ...existingEntity,
        deletedAt,
        updatedAt: deletedAt,
        revision: existingEntity.revision + 1,
      };

      // 4. Сохраняем изменения.

      await idbRequestToPromise(entitiesStore.put(deletedEntity));

      await transactionDone;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // Transaction may already be aborted or completed.
      }

      await transactionDone.catch(() => undefined);

      if (error instanceof UniverseEntityConcurrencyError) {
        throw error;
      }

      throw error;
    }
  }
}
