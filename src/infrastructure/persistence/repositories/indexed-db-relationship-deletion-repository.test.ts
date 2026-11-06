import 'fake-indexeddb/auto';

import type { Relationship } from 'src/features/relationships/domain/models/relationship';
import { RelationshipConcurrencyError } from 'src/features/relationships/application/errors/relationship-application-errors';
import { closeDatabase, getDatabase } from '../database/database';
import { RELATIONSHIPS_STORE } from '../database/database.types';
import { createIndexedDbRelationshipDeletionRepository } from './indexed-db-relationship-deletion-repository';
import { idbTransactionToPromise } from 'src/infrastructure/persistence/database/idb-transaction';

const DATABASE_NAME = 'lore-atlas';

const DELETED_AT = '2026-11-06T12:00:00.000Z';

function createRelationship(overrides: Partial<Relationship> = {}): Relationship {
  return {
    id: 'relationship-1',
    universeId: 'universe-1',
    sourceEntityId: 'entity-1',
    targetEntityId: 'entity-2',
    typeId: 'parent-of',
    description: null,
    isSpoiler: false,
    createdAt: '2026-11-06T10:00:00.000Z',
    updatedAt: '2026-11-06T10:00:00.000Z',
    deletedAt: null,
    revision: 1,
    ...overrides,
  };
}

async function seed(relationships: Relationship[]): Promise<void> {
  const database = await getDatabase();
  const transaction = database.transaction(RELATIONSHIPS_STORE, 'readwrite');

  const store = transaction.objectStore(RELATIONSHIPS_STORE);

  for (const relationship of relationships) {
    store.put(relationship);
  }

  await idbTransactionToPromise(transaction);
}

async function findById(id: string): Promise<Relationship | undefined> {
  const database = await getDatabase();
  const transaction = database.transaction(RELATIONSHIPS_STORE, 'readonly');

  const request = transaction.objectStore(RELATIONSHIPS_STORE).get(id);

  const relationship = await new Promise<Relationship | undefined>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  await idbTransactionToPromise(transaction);

  return relationship;
}

describe('createIndexedDbRelationshipDeletionRepository', () => {
  const repository = createIndexedDbRelationshipDeletionRepository();

  beforeEach(async () => {
    await closeDatabase();

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DATABASE_NAME);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Database deletion blocked.'));
    });

    await seed([createRelationship()]);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  it('soft-deletes a relationship', async () => {
    await repository.deleteRelationship('relationship-1', 1, DELETED_AT);

    await expect(findById('relationship-1')).resolves.toMatchObject({
      id: 'relationship-1',
      deletedAt: DELETED_AT,
      updatedAt: DELETED_AT,
      revision: 2,
    });
  });

  it('preserves the other relationship fields', async () => {
    const original = createRelationship();

    await repository.deleteRelationship(original.id, original.revision, DELETED_AT);

    const deleted = await findById(original.id);

    expect(deleted).toEqual({
      ...original,
      deletedAt: DELETED_AT,
      updatedAt: DELETED_AT,
      revision: original.revision + 1,
    });
  });

  it('throws when the relationship does not exist', async () => {
    await expect(repository.deleteRelationship('missing', 1, DELETED_AT)).rejects.toThrow(
      RelationshipConcurrencyError,
    );
  });

  it('throws when the relationship is already deleted', async () => {
    await seed([
      createRelationship({
        deletedAt: '2026-11-06T11:00:00.000Z',
      }),
    ]);

    await expect(
      repository.deleteRelationship('relationship-1', 1, DELETED_AT),
    ).rejects.toThrow(RelationshipConcurrencyError);
  });

  it('throws when the revision does not match', async () => {
    await expect(
      repository.deleteRelationship('relationship-1', 2, DELETED_AT),
    ).rejects.toThrow(RelationshipConcurrencyError);
  });

  it('does not modify the relationship when deletion fails', async () => {
    const original = createRelationship();

    await expect(
      repository.deleteRelationship(original.id, original.revision + 1, DELETED_AT),
    ).rejects.toThrow(RelationshipConcurrencyError);

    await expect(findById(original.id)).resolves.toEqual(original);
  });
});
