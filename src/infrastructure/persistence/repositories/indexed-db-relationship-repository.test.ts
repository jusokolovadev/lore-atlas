import 'fake-indexeddb/auto';

import type { Relationship } from 'src/features/relationships/domain/models/relationship';

import { closeDatabase, getDatabase } from '../database/database';
import {
  RELATIONSHIPS_STORE,
  UNIVERSE_ENTITIES_STORE,
  UNIVERSES_STORE,
} from '../database/database.types';
import { idbTransactionToPromise } from '../database/idb-transaction';

import { IndexedDbRelationshipRepository } from './indexed-db-relationship-repository';
import {
  RelationshipAlreadyExistsError,
  RelationshipConcurrencyError,
  RelationshipParticipantsUnavailableError,
} from 'src/features/relationships/application/errors/relationship-application-errors';

const DATABASE_NAME = 'lore-atlas';

describe('IndexedDbRelationshipRepository', () => {
  let repository: IndexedDbRelationshipRepository;

  const universe = {
    id: 'universe-1',
    deletedAt: null,
  };

  const createEntity = (
    id: string,
    universeId = 'universe-1',
    deletedAt: string | null = null,
  ) => ({
    id,
    universeId,
    type: 'character',
    name: id,
    description: null,
    image: null,
    isSpoiler: false,
    properties: {},
    createdAt: '2026-11-06T10:00:00.000Z',
    updatedAt: '2026-11-06T10:00:00.000Z',
    deletedAt,
    revision: 1,
  });

  const createRelationship = (overrides: Partial<Relationship> = {}): Relationship => ({
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
  });

  const seed = async (relationships: Relationship[] = []) => {
    const database = await getDatabase();

    const transaction = database.transaction(
      [UNIVERSES_STORE, UNIVERSE_ENTITIES_STORE, RELATIONSHIPS_STORE],
      'readwrite',
    );

    const transactionDone = idbTransactionToPromise(transaction);

    const universesStore = transaction.objectStore(UNIVERSES_STORE);
    const entitiesStore = transaction.objectStore(UNIVERSE_ENTITIES_STORE);
    const relationshipsStore = transaction.objectStore(RELATIONSHIPS_STORE);

    universesStore.put(universe);
    entitiesStore.put(createEntity('entity-1'));
    entitiesStore.put(createEntity('entity-2'));
    entitiesStore.put(createEntity('entity-3'));

    for (const relationship of relationships) {
      relationshipsStore.put(relationship);
    }

    await transactionDone;
  };

  beforeEach(async () => {
    await closeDatabase();

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DATABASE_NAME);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Database deletion is blocked.'));
    });

    repository = new IndexedDbRelationshipRepository();

    await seed();
  });

  afterEach(async () => {
    await closeDatabase();
  });

  describe('findById', () => {
    it('returns a relationship by ID', async () => {
      const relationship = createRelationship();

      await seed([relationship]);

      await expect(repository.findById(relationship.id)).resolves.toEqual(relationship);
    });

    it('returns null when the relationship does not exist', async () => {
      await expect(repository.findById('missing')).resolves.toBeNull();
    });

    it('returns deleted relationships', async () => {
      const relationship = createRelationship({
        deletedAt: '2026-11-06T11:00:00.000Z',
        revision: 2,
      });

      await seed([relationship]);

      await expect(repository.findById(relationship.id)).resolves.toEqual(relationship);
    });
  });

  describe('findAllActiveByUniverseId', () => {
    it('returns only active relationships for a universe', async () => {
      const active = createRelationship();

      const deleted = createRelationship({
        id: 'relationship-2',
        sourceEntityId: 'entity-2',
        targetEntityId: 'entity-3',
        deletedAt: '2026-11-06T11:00:00.000Z',
      });

      await seed([active, deleted]);

      await expect(repository.findAllActiveByUniverseId('universe-1')).resolves.toEqual([
        active,
      ]);
    });

    it('returns an empty array when there are no relationships', async () => {
      await expect(repository.findAllActiveByUniverseId('universe-1')).resolves.toEqual(
        [],
      );
    });
  });

  describe('findAllActiveByEntityId', () => {
    it('returns both incoming and outgoing relationships', async () => {
      const outgoing = createRelationship({
        id: 'relationship-1',
        sourceEntityId: 'entity-1',
        targetEntityId: 'entity-2',
      });

      const incoming = createRelationship({
        id: 'relationship-2',
        sourceEntityId: 'entity-3',
        targetEntityId: 'entity-1',
      });

      const unrelated = createRelationship({
        id: 'relationship-3',
        sourceEntityId: 'entity-2',
        targetEntityId: 'entity-3',
      });

      await seed([outgoing, incoming, unrelated]);

      const result = await repository.findAllActiveByEntityId('universe-1', 'entity-1');

      expect(result).toHaveLength(2);
      expect(result).toEqual(expect.arrayContaining([outgoing, incoming]));
    });

    it('does not return deleted relationships', async () => {
      const deleted = createRelationship({
        deletedAt: '2026-11-06T11:00:00.000Z',
      });

      await seed([deleted]);

      await expect(
        repository.findAllActiveByEntityId('universe-1', 'entity-1'),
      ).resolves.toEqual([]);
    });

    it('does not return relationships from another universe', async () => {
      const database = await getDatabase();

      const transaction = database.transaction([RELATIONSHIPS_STORE], 'readwrite');

      const relationship = createRelationship({
        universeId: 'universe-2',
      });

      transaction.objectStore(RELATIONSHIPS_STORE).put(relationship);

      await idbTransactionToPromise(transaction);

      await expect(
        repository.findAllActiveByEntityId('universe-1', 'entity-1'),
      ).resolves.toEqual([]);
    });
  });

  describe('createIfParticipantsAvailable', () => {
    it('creates a relationship when both participants are active', async () => {
      const relationship = createRelationship();

      await expect(repository.createIfParticipantsAvailable(relationship)).resolves.toBe(
        'created',
      );

      await expect(repository.findById(relationship.id)).resolves.toEqual(relationship);
    });

    it('returns participants-unavailable when a participant does not exist', async () => {
      const relationship = createRelationship({
        targetEntityId: 'missing',
      });

      await expect(repository.createIfParticipantsAvailable(relationship)).resolves.toBe(
        'participants-unavailable',
      );
    });

    it('returns participants-unavailable when a participant is deleted', async () => {
      const database = await getDatabase();

      const transaction = database.transaction([UNIVERSE_ENTITIES_STORE], 'readwrite');

      transaction
        .objectStore(UNIVERSE_ENTITIES_STORE)
        .put(createEntity('entity-2', 'universe-1', '2026-11-06T11:00:00.000Z'));

      await idbTransactionToPromise(transaction);

      await expect(
        repository.createIfParticipantsAvailable(createRelationship()),
      ).resolves.toBe('participants-unavailable');
    });

    it('returns participants-unavailable when participants belong to different universes', async () => {
      const database = await getDatabase();

      const transaction = database.transaction(
        [UNIVERSES_STORE, UNIVERSE_ENTITIES_STORE],
        'readwrite',
      );

      transaction.objectStore(UNIVERSES_STORE).put({
        id: 'universe-2',
        deletedAt: null,
      });

      transaction
        .objectStore(UNIVERSE_ENTITIES_STORE)
        .put(createEntity('entity-2', 'universe-2'));

      await idbTransactionToPromise(transaction);

      await expect(
        repository.createIfParticipantsAvailable(createRelationship()),
      ).resolves.toBe('participants-unavailable');
    });

    it('returns participants-unavailable when the universe is deleted', async () => {
      const database = await getDatabase();

      const transaction = database.transaction([UNIVERSES_STORE], 'readwrite');

      transaction.objectStore(UNIVERSES_STORE).put({
        id: 'universe-1',
        deletedAt: '2026-11-06T11:00:00.000Z',
      });

      await idbTransactionToPromise(transaction);

      await expect(
        repository.createIfParticipantsAvailable(createRelationship()),
      ).resolves.toBe('participants-unavailable');
    });

    it('returns already-exists for a duplicate relationship', async () => {
      const relationship = createRelationship();

      await seed([relationship]);

      await expect(
        repository.createIfParticipantsAvailable(
          createRelationship({ id: 'relationship-2' }),
        ),
      ).resolves.toBe('already-exists');
    });

    it('does not allow recreating a deleted relationship', async () => {
      const relationship = createRelationship({
        deletedAt: '2026-11-06T11:00:00.000Z',
        revision: 2,
      });

      await seed([relationship]);

      await expect(
        repository.createIfParticipantsAvailable(
          createRelationship({ id: 'relationship-2' }),
        ),
      ).resolves.toBe('already-exists');
    });

    it('allows a relationship with a different type', async () => {
      const existing = createRelationship();

      await seed([existing]);

      const next = createRelationship({
        id: 'relationship-2',
        typeId: 'sibling-of',
      });

      await expect(repository.createIfParticipantsAvailable(next)).resolves.toBe(
        'created',
      );
    });
  });

  describe('update', () => {
    it('updates an existing relationship', async () => {
      const relationship = createRelationship();

      await seed([relationship]);

      const updated = createRelationship({
        description: 'Updated description',
        revision: 2,
        updatedAt: '2026-11-06T11:00:00.000Z',
      });

      await expect(repository.update(updated, 1)).resolves.toBeUndefined();

      await expect(repository.findById(updated.id)).resolves.toEqual(updated);
    });

    it('throws when the relationship does not exist', async () => {
      await expect(repository.update(createRelationship(), 1)).rejects.toThrow(
        RelationshipConcurrencyError,
      );
    });

    it('throws when the revision does not match', async () => {
      const relationship = createRelationship();

      await seed([relationship]);

      await expect(
        repository.update(createRelationship({ revision: 2 }), 5),
      ).rejects.toThrow(RelationshipConcurrencyError);
    });

    it('throws when the relationship is deleted', async () => {
      const relationship = createRelationship({
        deletedAt: '2026-11-06T11:00:00.000Z',
      });

      await seed([relationship]);

      await expect(
        repository.update(createRelationship({ revision: 2 }), 2),
      ).rejects.toThrow(RelationshipConcurrencyError);
    });

    it('throws when new participants are unavailable', async () => {
      const relationship = createRelationship();

      await seed([relationship]);

      await expect(
        repository.update(
          createRelationship({
            targetEntityId: 'missing',
            revision: 2,
          }),
          1,
        ),
      ).rejects.toThrow(RelationshipParticipantsUnavailableError);
    });

    it('throws when an update creates a duplicate relationship', async () => {
      const first = createRelationship();

      const second = createRelationship({
        id: 'relationship-2',
        sourceEntityId: 'entity-2',
        targetEntityId: 'entity-3',
      });

      await seed([first, second]);

      await expect(
        repository.update(
          createRelationship({
            id: 'relationship-2',
            sourceEntityId: 'entity-1',
            targetEntityId: 'entity-2',
            revision: 2,
          }),
          1,
        ),
      ).rejects.toThrow(RelationshipAlreadyExistsError);
    });
  });

  describe('restore', () => {
    it('restores a deleted relationship', async () => {
      const deleted = createRelationship({
        deletedAt: '2026-11-06T11:00:00.000Z',
        revision: 2,
      });

      await seed([deleted]);

      const restored = createRelationship({
        revision: 3,
        updatedAt: '2026-11-06T12:00:00.000Z',
      });

      await expect(repository.restore(restored, 2)).resolves.toBeUndefined();

      await expect(repository.findById(restored.id)).resolves.toEqual(restored);
    });

    it('throws when the relationship does not exist', async () => {
      await expect(repository.restore(createRelationship(), 1)).rejects.toThrow(
        RelationshipConcurrencyError,
      );
    });

    it('throws when the relationship is already active', async () => {
      const relationship = createRelationship();

      await seed([relationship]);

      await expect(
        repository.restore(createRelationship({ revision: 2 }), 1),
      ).rejects.toThrow(RelationshipConcurrencyError);
    });

    it('throws when the revision does not match', async () => {
      const deleted = createRelationship({
        deletedAt: '2026-11-06T11:00:00.000Z',
        revision: 2,
      });

      await seed([deleted]);

      await expect(
        repository.restore(createRelationship({ revision: 3 }), 5),
      ).rejects.toThrow(RelationshipConcurrencyError);
    });

    it('throws when a participant is no longer active', async () => {
      const deleted = createRelationship({
        deletedAt: '2026-11-06T11:00:00.000Z',
        revision: 2,
      });

      await seed([deleted]);

      const database = await getDatabase();

      const transaction = database.transaction([UNIVERSE_ENTITIES_STORE], 'readwrite');

      transaction
        .objectStore(UNIVERSE_ENTITIES_STORE)
        .put(createEntity('entity-2', 'universe-1', '2026-11-06T11:30:00.000Z'));

      await idbTransactionToPromise(transaction);

      await expect(
        repository.restore(createRelationship({ revision: 3 }), 2),
      ).rejects.toThrow(RelationshipParticipantsUnavailableError);
    });
  });
});
