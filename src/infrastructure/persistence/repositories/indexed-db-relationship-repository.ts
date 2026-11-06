import type { Relationship } from 'src/features/relationships/domain/models/relationship';
import type { RelationshipRepository } from 'src/features/relationships/application/repositories/relationship-repository';
import {
  RelationshipAlreadyExistsError,
  RelationshipConcurrencyError,
  RelationshipParticipantsUnavailableError,
} from 'src/features/relationships/application/errors/relationship-application-errors';

import { getDatabase } from '../database/database';
import {
  RELATIONSHIPS_STORE,
  UNIVERSE_ENTITIES_STORE,
  UNIVERSES_STORE,
} from '../database/database.types';
import { idbRequestToPromise } from '../database/idb-request';
import { idbTransactionToPromise } from '../database/idb-transaction';

interface ActiveRecord {
  universeId: string;
  deletedAt: string | null;
}

function isConstraintError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'ConstraintError';
}

function isActiveRecord(record: ActiveRecord | undefined): boolean {
  return Boolean(record && record.deletedAt === null);
}

export class IndexedDbRelationshipRepository implements RelationshipRepository {
  async findById(id: string): Promise<Relationship | null> {
    const database = await getDatabase();
    const transaction = database.transaction([RELATIONSHIPS_STORE], 'readonly');

    const relationship = await idbRequestToPromise<Relationship | undefined>(
      transaction.objectStore(RELATIONSHIPS_STORE).get(id),
    );

    await idbTransactionToPromise(transaction);

    return relationship ?? null;
  }

  async findAllActiveByUniverseId(universeId: string): Promise<Relationship[]> {
    const database = await getDatabase();
    const transaction = database.transaction([RELATIONSHIPS_STORE], 'readonly');

    const relationships = await idbRequestToPromise<Relationship[]>(
      transaction.objectStore(RELATIONSHIPS_STORE).index('universeId').getAll(universeId),
    );

    await idbTransactionToPromise(transaction);

    return relationships.filter((relationship) => relationship.deletedAt === null);
  }

  async findAllActiveByEntityId(
    universeId: string,
    entityId: string,
  ): Promise<Relationship[]> {
    const database = await getDatabase();
    const transaction = database.transaction([RELATIONSHIPS_STORE], 'readonly');

    const store = transaction.objectStore(RELATIONSHIPS_STORE);

    const sourceRequest = store
      .index('universeId_sourceEntityId')
      .getAll(IDBKeyRange.only([universeId, entityId]));

    const targetRequest = store
      .index('universeId_targetEntityId')
      .getAll(IDBKeyRange.only([universeId, entityId]));

    const [sourceRelationships, targetRelationships] = await Promise.all([
      idbRequestToPromise<Relationship[]>(sourceRequest),
      idbRequestToPromise<Relationship[]>(targetRequest),
    ]);

    await idbTransactionToPromise(transaction);

    return [...sourceRelationships, ...targetRelationships].filter(
      (relationship) => relationship.deletedAt === null,
    );
  }

  async createIfParticipantsAvailable(
    relationship: Relationship,
  ): Promise<'created' | 'participants-unavailable' | 'already-exists'> {
    const database = await getDatabase();

    const transaction = database.transaction(
      [UNIVERSES_STORE, UNIVERSE_ENTITIES_STORE, RELATIONSHIPS_STORE],
      'readwrite',
    );

    const transactionDone = idbTransactionToPromise(transaction);

    try {
      const universe = await idbRequestToPromise<ActiveRecord | undefined>(
        transaction.objectStore(UNIVERSES_STORE).get(relationship.universeId),
      );

      if (!isActiveRecord(universe)) {
        await transactionDone;
        return 'participants-unavailable';
      }

      const entitiesStore = transaction.objectStore(UNIVERSE_ENTITIES_STORE);

      const [sourceEntity, targetEntity] = await Promise.all([
        idbRequestToPromise<ActiveRecord | undefined>(
          entitiesStore.get(relationship.sourceEntityId),
        ),
        idbRequestToPromise<ActiveRecord | undefined>(
          entitiesStore.get(relationship.targetEntityId),
        ),
      ]);

      if (
        !isActiveRecord(sourceEntity) ||
        !isActiveRecord(targetEntity) ||
        sourceEntity?.universeId !== relationship.universeId ||
        targetEntity?.universeId !== relationship.universeId
      ) {
        await transactionDone;
        return 'participants-unavailable';
      }

      await idbRequestToPromise(
        transaction.objectStore(RELATIONSHIPS_STORE).add(relationship),
      );

      await transactionDone;

      return 'created';
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // Transaction may already be inactive.
      }

      await transactionDone.catch(() => undefined);

      if (isConstraintError(error)) {
        return 'already-exists';
      }

      throw error;
    }
  }

  async update(relationship: Relationship, expectedRevision: number): Promise<void> {
    const database = await getDatabase();

    const transaction = database.transaction(
      [UNIVERSES_STORE, UNIVERSE_ENTITIES_STORE, RELATIONSHIPS_STORE],
      'readwrite',
    );

    const transactionDone = idbTransactionToPromise(transaction);

    try {
      const relationshipsStore = transaction.objectStore(RELATIONSHIPS_STORE);

      const existingRelationship = await idbRequestToPromise<Relationship | undefined>(
        relationshipsStore.get(relationship.id),
      );

      if (
        !existingRelationship ||
        existingRelationship.deletedAt !== null ||
        existingRelationship.revision !== expectedRevision
      ) {
        throw new RelationshipConcurrencyError();
      }

      const participantsAvailable = await this.areParticipantsAvailable(
        transaction,
        relationship,
      );

      if (!participantsAvailable) {
        throw new RelationshipParticipantsUnavailableError();
      }

      await idbRequestToPromise(relationshipsStore.put(relationship));

      await transactionDone;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // Transaction may already be inactive.
      }

      await transactionDone.catch(() => undefined);

      if (isConstraintError(error)) {
        throw new RelationshipAlreadyExistsError();
      }

      throw error;
    }
  }

  async restore(relationship: Relationship, expectedRevision: number): Promise<void> {
    const database = await getDatabase();

    const transaction = database.transaction(
      [UNIVERSES_STORE, UNIVERSE_ENTITIES_STORE, RELATIONSHIPS_STORE],
      'readwrite',
    );

    const transactionDone = idbTransactionToPromise(transaction);

    try {
      const relationshipsStore = transaction.objectStore(RELATIONSHIPS_STORE);

      const existingRelationship = await idbRequestToPromise<Relationship | undefined>(
        relationshipsStore.get(relationship.id),
      );

      if (
        !existingRelationship ||
        existingRelationship.deletedAt === null ||
        existingRelationship.revision !== expectedRevision
      ) {
        throw new RelationshipConcurrencyError(
          'Relationship not found, not deleted, or revision conflict.',
        );
      }

      const participantsAvailable = await this.areParticipantsAvailable(
        transaction,
        relationship,
      );

      if (!participantsAvailable) {
        throw new RelationshipParticipantsUnavailableError();
      }

      await idbRequestToPromise(relationshipsStore.put(relationship));

      await transactionDone;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // Transaction may already be inactive.
      }

      await transactionDone.catch(() => undefined);

      if (isConstraintError(error)) {
        throw new RelationshipAlreadyExistsError();
      }

      throw error;
    }
  }

  private async areParticipantsAvailable(
    transaction: IDBTransaction,
    relationship: Relationship,
  ): Promise<boolean> {
    const universe = await idbRequestToPromise<ActiveRecord | undefined>(
      transaction.objectStore(UNIVERSES_STORE).get(relationship.universeId),
    );

    if (!isActiveRecord(universe)) {
      return false;
    }

    const entitiesStore = transaction.objectStore(UNIVERSE_ENTITIES_STORE);

    const [sourceEntity, targetEntity] = await Promise.all([
      idbRequestToPromise<ActiveRecord | undefined>(
        entitiesStore.get(relationship.sourceEntityId),
      ),
      idbRequestToPromise<ActiveRecord | undefined>(
        entitiesStore.get(relationship.targetEntityId),
      ),
    ]);

    return (
      isActiveRecord(sourceEntity) &&
      isActiveRecord(targetEntity) &&
      sourceEntity?.universeId === relationship.universeId &&
      targetEntity?.universeId === relationship.universeId
    );
  }
}
