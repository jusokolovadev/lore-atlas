import { RELATIONSHIPS_STORE, UNIVERSE_ENTITIES_STORE } from '../database/database.types';

import { getDatabase } from '../database/database';
import { idbRequestToPromise } from '../database/idb-request';
import { idbTransactionToPromise } from '../database/idb-transaction';

import type { UniverseEntity } from 'src/features/entities/domain/models/universe-entity';
import type { Relationship } from 'src/features/relationships/domain/models/relationship';

import type { EntityDeletionRepository } from 'src/features/entities/application/repositories/entity-deletion-repository';

import { UniverseEntityConcurrencyError } from 'src/features/entities/application/errors/universe-entity-application-errors';

export class IndexedDbEntityDeletionRepository implements EntityDeletionRepository {
  async deleteEntity(
    id: string,
    expectedRevision: number,
    deletedAt: string,
  ): Promise<void> {
    const database = await getDatabase();

    const transaction = database.transaction(
      [UNIVERSE_ENTITIES_STORE, RELATIONSHIPS_STORE],
      'readwrite',
    );

    const transactionDone = idbTransactionToPromise(transaction);

    try {
      const entitiesStore = transaction.objectStore(UNIVERSE_ENTITIES_STORE);
      const relationshipsStore = transaction.objectStore(RELATIONSHIPS_STORE);

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

      // 4. Находим все связи сущности в рамках её вселенной.

      const sourceIndex = relationshipsStore.index('universeId_sourceEntityId');

      const targetIndex = relationshipsStore.index('universeId_targetEntityId');

      const [sourceRelationships, targetRelationships] = await Promise.all([
        idbRequestToPromise<Relationship[]>(
          sourceIndex.getAll(
            IDBKeyRange.only([existingEntity.universeId, existingEntity.id]),
          ),
        ),
        idbRequestToPromise<Relationship[]>(
          targetIndex.getAll(
            IDBKeyRange.only([existingEntity.universeId, existingEntity.id]),
          ),
        ),
      ]);

      // 5. Мягко удаляем все активные связи.

      const connectedRelationships = [...sourceRelationships, ...targetRelationships];

      for (const relationship of connectedRelationships) {
        if (relationship.deletedAt !== null) {
          continue;
        }

        const deletedRelationship: Relationship = {
          ...relationship,
          deletedAt,
          updatedAt: deletedAt,
          revision: relationship.revision + 1,
        };

        await idbRequestToPromise(relationshipsStore.put(deletedRelationship));
      }

      // 6. Сохраняем сущность.

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
