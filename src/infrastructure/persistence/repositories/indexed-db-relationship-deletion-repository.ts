import type { Relationship } from 'src/features/relationships/domain/models/relationship';
import type { RelationshipDeletionRepository } from 'src/features/relationships/application/repositories/relationship-deletion-repository';
import { RelationshipConcurrencyError } from 'src/features/relationships/application/errors/relationship-application-errors';
import { getDatabase } from '../database/database';
import { RELATIONSHIPS_STORE } from '../database/database.types';
import { idbRequestToPromise } from 'src/infrastructure/persistence/database/idb-request';
import { idbTransactionToPromise } from 'src/infrastructure/persistence/database/idb-transaction';

export function createIndexedDbRelationshipDeletionRepository(): RelationshipDeletionRepository {
  return {
    async deleteRelationship(id, expectedRevision, deletedAt) {
      const database = await getDatabase();
      const transaction = database.transaction(RELATIONSHIPS_STORE, 'readwrite');
      const transactionDone = idbTransactionToPromise(transaction);

      try {
        const store = transaction.objectStore(RELATIONSHIPS_STORE);

        const relationship = (await idbRequestToPromise(store.get(id))) as
          Relationship | undefined;

        if (
          !relationship ||
          relationship.deletedAt !== null ||
          relationship.revision !== expectedRevision
        ) {
          throw new RelationshipConcurrencyError();
        }

        const deletedRelationship: Relationship = {
          ...relationship,
          deletedAt,
          updatedAt: deletedAt,
          revision: relationship.revision + 1,
        };

        store.put(deletedRelationship);

        await transactionDone;
      } catch (error) {
        try {
          transaction.abort();
        } catch {
          // The transaction may already have completed or aborted.
        }

        await transactionDone.catch(() => undefined);
        throw error;
      }
    },
  };
}
