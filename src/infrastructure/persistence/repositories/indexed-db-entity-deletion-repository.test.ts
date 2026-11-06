import { getDatabase } from '../database/database';
import { RELATIONSHIPS_STORE, UNIVERSE_ENTITIES_STORE } from '../database/database.types';
import { idbRequestToPromise } from '../database/idb-request';
import { idbTransactionToPromise } from '../database/idb-transaction';

import { IndexedDbEntityDeletionRepository } from './indexed-db-entity-deletion-repository';

import type { UniverseEntity } from 'src/features/entities/domain/models/universe-entity';
import type { Relationship } from 'src/features/relationships/domain/models/relationship';

import { UniverseEntityConcurrencyError } from 'src/features/entities/application/errors/universe-entity-application-errors';

describe('IndexedDbEntityDeletionRepository', () => {
  let repository: IndexedDbEntityDeletionRepository;

  const deletedAt = '2026-11-05T12:00:00.000Z';

  const entity: UniverseEntity = {
    id: 'entity-1',
    universeId: 'universe-1',
    type: 'character',
    name: 'Aragorn',
    description: 'A ranger',
    image: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    revision: 1,
    isSpoiler: false,
    properties: {
      species: null,
      gender: 'Male',
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
  };

  const createRelationship = (overrides: Partial<Relationship> = {}): Relationship => ({
    id: 'relationship-1',
    universeId: 'universe-1',
    sourceEntityId: 'entity-1',
    targetEntityId: 'entity-2',
    typeId: 'parent-of',
    description: null,
    isSpoiler: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    revision: 1,
    ...overrides,
  });

  const sourceRelationship = createRelationship();

  const targetRelationship = createRelationship({
    id: 'relationship-2',
    sourceEntityId: 'entity-3',
    targetEntityId: 'entity-1',
  });

  const alreadyDeletedRelationship = createRelationship({
    id: 'relationship-3',
    sourceEntityId: 'entity-1',
    targetEntityId: 'entity-4',
    deletedAt: '2026-11-04T12:00:00.000Z',
    updatedAt: '2026-11-04T12:00:00.000Z',
    revision: 2,
  });

  const unrelatedRelationship = createRelationship({
    id: 'relationship-4',
    sourceEntityId: 'entity-2',
    targetEntityId: 'entity-3',
  });

  const otherUniverseRelationship = createRelationship({
    id: 'relationship-5',
    universeId: 'universe-2',
    sourceEntityId: 'entity-1',
    targetEntityId: 'entity-2',
  });

  beforeEach(async () => {
    repository = new IndexedDbEntityDeletionRepository();

    const database = await getDatabase();

    const transaction = database.transaction(
      [UNIVERSE_ENTITIES_STORE, RELATIONSHIPS_STORE],
      'readwrite',
    );

    transaction.objectStore(UNIVERSE_ENTITIES_STORE).clear();
    transaction.objectStore(RELATIONSHIPS_STORE).clear();

    transaction.objectStore(UNIVERSE_ENTITIES_STORE).put(entity);

    const relationshipsStore = transaction.objectStore(RELATIONSHIPS_STORE);

    relationshipsStore.put(sourceRelationship);
    relationshipsStore.put(targetRelationship);
    relationshipsStore.put(alreadyDeletedRelationship);
    relationshipsStore.put(unrelatedRelationship);
    relationshipsStore.put(otherUniverseRelationship);

    await idbTransactionToPromise(transaction);
  });

  async function findEntity(): Promise<UniverseEntity | undefined> {
    const database = await getDatabase();
    const transaction = database.transaction(UNIVERSE_ENTITIES_STORE, 'readonly');

    const result = await idbRequestToPromise<UniverseEntity | undefined>(
      transaction.objectStore(UNIVERSE_ENTITIES_STORE).get(entity.id),
    );

    await idbTransactionToPromise(transaction);

    return result;
  }

  async function findRelationship(id: string): Promise<Relationship | undefined> {
    const database = await getDatabase();
    const transaction = database.transaction(RELATIONSHIPS_STORE, 'readonly');

    const result = await idbRequestToPromise<Relationship | undefined>(
      transaction.objectStore(RELATIONSHIPS_STORE).get(id),
    );

    await idbTransactionToPromise(transaction);

    return result;
  }

  it('soft-deletes an entity and increments its revision', async () => {
    await repository.deleteEntity(entity.id, 1, deletedAt);

    const deletedEntity = await findEntity();

    expect(deletedEntity).toEqual({
      ...entity,
      deletedAt,
      updatedAt: deletedAt,
      revision: 2,
    });
  });

  it('soft-deletes active relationships connected to the entity', async () => {
    await repository.deleteEntity(entity.id, 1, deletedAt);

    await expect(findRelationship(sourceRelationship.id)).resolves.toEqual({
      ...sourceRelationship,
      deletedAt,
      updatedAt: deletedAt,
      revision: 2,
    });

    await expect(findRelationship(targetRelationship.id)).resolves.toEqual({
      ...targetRelationship,
      deletedAt,
      updatedAt: deletedAt,
      revision: 2,
    });
  });

  it('does not modify already deleted relationships', async () => {
    await repository.deleteEntity(entity.id, 1, deletedAt);

    await expect(findRelationship(alreadyDeletedRelationship.id)).resolves.toEqual(
      alreadyDeletedRelationship,
    );
  });

  it('does not modify unrelated relationships', async () => {
    await repository.deleteEntity(entity.id, 1, deletedAt);

    await expect(findRelationship(unrelatedRelationship.id)).resolves.toEqual(
      unrelatedRelationship,
    );
  });

  it('does not modify relationships from another universe', async () => {
    await repository.deleteEntity(entity.id, 1, deletedAt);

    await expect(findRelationship(otherUniverseRelationship.id)).resolves.toEqual(
      otherUniverseRelationship,
    );
  });

  it('throws when the entity does not exist', async () => {
    await expect(
      repository.deleteEntity('missing-entity', 1, deletedAt),
    ).rejects.toBeInstanceOf(UniverseEntityConcurrencyError);
  });

  it('throws when the entity is already deleted', async () => {
    const database = await getDatabase();
    const transaction = database.transaction(UNIVERSE_ENTITIES_STORE, 'readwrite');

    transaction.objectStore(UNIVERSE_ENTITIES_STORE).put({
      ...entity,
      deletedAt: '2026-11-04T12:00:00.000Z',
    });

    await idbTransactionToPromise(transaction);

    await expect(repository.deleteEntity(entity.id, 1, deletedAt)).rejects.toBeInstanceOf(
      UniverseEntityConcurrencyError,
    );
  });

  it('throws when the revision does not match', async () => {
    await expect(repository.deleteEntity(entity.id, 2, deletedAt)).rejects.toBeInstanceOf(
      UniverseEntityConcurrencyError,
    );

    expect(await findEntity()).toEqual(entity);
  });

  it('does not modify relationships when entity deletion fails', async () => {
    await expect(repository.deleteEntity(entity.id, 2, deletedAt)).rejects.toThrow();

    expect(await findEntity()).toEqual(entity);

    expect(await findRelationship(sourceRelationship.id)).toEqual(sourceRelationship);

    expect(await findRelationship(targetRelationship.id)).toEqual(targetRelationship);
  });
});
