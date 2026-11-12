import 'fake-indexeddb/auto';

import { getDatabase, closeDatabase } from '../database/database';
import {
  UNIVERSES_STORE,
  REFERENCE_CATEGORIES_STORE,
  CATEGORY_NAME_RESERVATIONS_STORE,
  REFERENCE_ENTRIES_STORE,
  REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
  UNIVERSE_ENTITIES_STORE,
  RELATIONSHIPS_STORE,
} from '../database/database.types';
import { idbRequestToPromise } from '../database/idb-request';
import { idbTransactionToPromise } from '../database/idb-transaction';

import { IndexedDbUniverseDeletionRepository } from './indexed-db-universe-deletion-repository';

import type { Universe } from 'src/features/universes/domain/models/universe';
import type { UniverseEntity } from 'src/features/entities/domain/models/universe-entity';
import type { Relationship } from 'src/features/relationships/domain/models/relationship';

const DATABASE_NAME = 'lore-atlas';
const DELETED_AT = '2026-11-06T12:00:00.000Z';

const ALL_STORES = [
  UNIVERSES_STORE,
  REFERENCE_CATEGORIES_STORE,
  CATEGORY_NAME_RESERVATIONS_STORE,
  REFERENCE_ENTRIES_STORE,
  REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
  UNIVERSE_ENTITIES_STORE,
  RELATIONSHIPS_STORE,
];

function createUniverse(overrides: Partial<Universe> = {}): Universe {
  return {
    id: 'universe-1',
    name: 'Middle-earth',
    description: null,
    coverImage: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    revision: 1,
    enabledStandardCategoryIds: [],
    ...overrides,
  };
}

function createEntity(
  id: string,
  universeId = 'universe-1',
  overrides: Partial<
    Omit<Extract<UniverseEntity, { type: 'character' }>, 'id' | 'universeId'>
  > = {},
): UniverseEntity {
  return {
    id,
    universeId,
    type: 'character',
    name: id,
    description: null,
    image: null,
    isSpoiler: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    revision: 1,
    properties: {
      species: null,
      gender: null,
      birthDate: null,
      deathDate: null,
      ageDescription: null,
      height: null,
      weight: null,
      eyeColor: null,
      hairColor: null,
      appearance: null,
      titles: [],
      rank: null,
      socialClass: null,
      professions: [],
      abilities: [],
      personality: null,
      backstory: null,
      goals: null,
    },
    ...overrides,
  };
}

function createRelationship(
  id: string,
  sourceEntityId: string,
  targetEntityId: string,
  universeId = 'universe-1',
  overrides: Partial<Relationship> = {},
): Relationship {
  return {
    id,
    universeId,
    sourceEntityId,
    targetEntityId,
    typeId: 'parent-of',
    description: null,
    isSpoiler: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    revision: 1,
    ...overrides,
  };
}

describe('IndexedDbUniverseDeletionRepository cascade', () => {
  let repository: IndexedDbUniverseDeletionRepository;

  const universe = createUniverse();

  const activeEntity = createEntity('entity-1');
  const anotherActiveEntity = createEntity('entity-2');

  const alreadyDeletedEntity = createEntity('entity-3', 'universe-1', {
    deletedAt: '2026-11-05T10:00:00.000Z',
    updatedAt: '2026-11-05T10:00:00.000Z',
    revision: 2,
  });

  const otherUniverseEntity = createEntity('entity-4', 'universe-2');

  const sourceRelationship = createRelationship('relationship-1', 'entity-1', 'entity-2');

  const targetRelationship = createRelationship('relationship-2', 'entity-2', 'entity-1');

  const alreadyDeletedRelationship = createRelationship(
    'relationship-3',
    'entity-1',
    'entity-3',
    'universe-1',
    {
      deletedAt: '2026-11-05T10:00:00.000Z',
      updatedAt: '2026-11-05T10:00:00.000Z',
      revision: 2,
    },
  );

  const unrelatedRelationship = createRelationship(
    'relationship-4',
    'entity-2',
    'entity-3',
  );

  const otherUniverseRelationship = createRelationship(
    'relationship-5',
    'entity-1',
    'entity-4',
    'universe-2',
  );

  beforeEach(async () => {
    repository = new IndexedDbUniverseDeletionRepository();

    await closeDatabase();

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DATABASE_NAME);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error('Database deletion blocked.'));
    });

    const database = await getDatabase();

    const transaction = database.transaction(ALL_STORES, 'readwrite');

    for (const storeName of ALL_STORES) {
      transaction.objectStore(storeName).clear();
    }

    transaction.objectStore(UNIVERSES_STORE).put(universe);

    const entitiesStore = transaction.objectStore(UNIVERSE_ENTITIES_STORE);

    entitiesStore.put(activeEntity);
    entitiesStore.put(anotherActiveEntity);
    entitiesStore.put(alreadyDeletedEntity);
    entitiesStore.put(otherUniverseEntity);

    const relationshipsStore = transaction.objectStore(RELATIONSHIPS_STORE);

    relationshipsStore.put(sourceRelationship);
    relationshipsStore.put(targetRelationship);
    relationshipsStore.put(alreadyDeletedRelationship);
    relationshipsStore.put(unrelatedRelationship);
    relationshipsStore.put(otherUniverseRelationship);

    await idbTransactionToPromise(transaction);
  });

  afterEach(async () => {
    await closeDatabase();
  });

  async function findRecord<T>(storeName: string, id: string): Promise<T | undefined> {
    const database = await getDatabase();
    const transaction = database.transaction(storeName, 'readonly');

    const result = await idbRequestToPromise<T | undefined>(
      transaction.objectStore(storeName).get(id),
    );

    await idbTransactionToPromise(transaction);

    return result;
  }

  it('soft-deletes active entities in the universe', async () => {
    await repository.deleteUniverseWithCategories(universe.id, DELETED_AT);

    await expect(
      findRecord<UniverseEntity>(UNIVERSE_ENTITIES_STORE, activeEntity.id),
    ).resolves.toMatchObject({
      deletedAt: DELETED_AT,
      updatedAt: DELETED_AT,
      revision: activeEntity.revision + 1,
    });

    await expect(
      findRecord<UniverseEntity>(UNIVERSE_ENTITIES_STORE, anotherActiveEntity.id),
    ).resolves.toMatchObject({
      deletedAt: DELETED_AT,
      updatedAt: DELETED_AT,
      revision: anotherActiveEntity.revision + 1,
    });
  });

  it('soft-deletes active relationships in the universe', async () => {
    await repository.deleteUniverseWithCategories(universe.id, DELETED_AT);

    await expect(
      findRecord<Relationship>(RELATIONSHIPS_STORE, sourceRelationship.id),
    ).resolves.toEqual({
      ...sourceRelationship,
      deletedAt: DELETED_AT,
      updatedAt: DELETED_AT,
      revision: sourceRelationship.revision + 1,
    });

    await expect(
      findRecord<Relationship>(RELATIONSHIPS_STORE, targetRelationship.id),
    ).resolves.toEqual({
      ...targetRelationship,
      deletedAt: DELETED_AT,
      updatedAt: DELETED_AT,
      revision: targetRelationship.revision + 1,
    });
  });

  it('does not modify already deleted entities', async () => {
    await repository.deleteUniverseWithCategories(universe.id, DELETED_AT);

    await expect(
      findRecord<UniverseEntity>(UNIVERSE_ENTITIES_STORE, alreadyDeletedEntity.id),
    ).resolves.toEqual(alreadyDeletedEntity);
  });

  it('does not modify already deleted relationships', async () => {
    await repository.deleteUniverseWithCategories(universe.id, DELETED_AT);

    await expect(
      findRecord<Relationship>(RELATIONSHIPS_STORE, alreadyDeletedRelationship.id),
    ).resolves.toEqual(alreadyDeletedRelationship);
  });

  it('does not modify relationships from another universe', async () => {
    await repository.deleteUniverseWithCategories(universe.id, DELETED_AT);

    await expect(
      findRecord<Relationship>(RELATIONSHIPS_STORE, otherUniverseRelationship.id),
    ).resolves.toEqual(otherUniverseRelationship);
  });

  it('does not modify entities from another universe', async () => {
    await repository.deleteUniverseWithCategories(universe.id, DELETED_AT);

    await expect(
      findRecord<UniverseEntity>(UNIVERSE_ENTITIES_STORE, otherUniverseEntity.id),
    ).resolves.toEqual(otherUniverseEntity);
  });

  it('deletes all relationships in the universe regardless of their participants', async () => {
    const repository = new IndexedDbUniverseDeletionRepository();

    const alreadyDeletedRelationshipBefore = await findRecord<Relationship>(
      RELATIONSHIPS_STORE,
      'relationship-3',
    );

    await repository.deleteUniverseWithCategories('universe-1', DELETED_AT);

    const sourceRelationship = await findRecord<Relationship>(
      RELATIONSHIPS_STORE,
      'relationship-1',
    );

    const targetRelationship = await findRecord<Relationship>(
      RELATIONSHIPS_STORE,
      'relationship-2',
    );

    const alreadyDeletedRelationshipAfter = await findRecord<Relationship>(
      RELATIONSHIPS_STORE,
      'relationship-3',
    );

    const unrelatedRelationship = await findRecord<Relationship>(
      RELATIONSHIPS_STORE,
      'relationship-4',
    );

    expect(sourceRelationship).toMatchObject({
      deletedAt: DELETED_AT,
      updatedAt: DELETED_AT,
      revision: 2,
    });

    expect(targetRelationship).toMatchObject({
      deletedAt: DELETED_AT,
      updatedAt: DELETED_AT,
      revision: 2,
    });

    expect(alreadyDeletedRelationshipAfter).toEqual(alreadyDeletedRelationshipBefore);

    expect(unrelatedRelationship).toMatchObject({
      deletedAt: DELETED_AT,
      updatedAt: DELETED_AT,
      revision: 2,
    });
  });

  it('soft-deletes the universe', async () => {
    await repository.deleteUniverseWithCategories(universe.id, DELETED_AT);

    await expect(
      findRecord<Universe>(UNIVERSES_STORE, universe.id),
    ).resolves.toMatchObject({
      deletedAt: DELETED_AT,
      updatedAt: DELETED_AT,
    });
  });

  it('throws when the universe does not exist', async () => {
    await expect(
      repository.deleteUniverseWithCategories('missing-universe', DELETED_AT),
    ).rejects.toThrow();

    await expect(
      findRecord<UniverseEntity>(UNIVERSE_ENTITIES_STORE, activeEntity.id),
    ).resolves.toEqual(activeEntity);

    await expect(
      findRecord<Relationship>(RELATIONSHIPS_STORE, sourceRelationship.id),
    ).resolves.toEqual(sourceRelationship);
  });
});
