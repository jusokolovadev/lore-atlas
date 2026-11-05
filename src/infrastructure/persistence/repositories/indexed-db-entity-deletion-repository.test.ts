import { getDatabase } from '../database/database';
import { UNIVERSE_ENTITIES_STORE } from '../database/database.types';
import { idbRequestToPromise } from '../database/idb-request';

import { IndexedDbEntityDeletionRepository } from './indexed-db-entity-deletion-repository';

import type { UniverseEntity } from 'src/features/entities/domain/models/universe-entity';

import { UniverseEntityConcurrencyError } from 'src/features/entities/application/errors/universe-entity-application-errors';

describe('IndexedDbEntityDeletionRepository', () => {
  let repository: IndexedDbEntityDeletionRepository;

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

  beforeEach(async () => {
    repository = new IndexedDbEntityDeletionRepository();

    const database = await getDatabase();
    const transaction = database.transaction([UNIVERSE_ENTITIES_STORE], 'readwrite');

    transaction.objectStore(UNIVERSE_ENTITIES_STORE).clear();

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });

    const insertTransaction = database.transaction(
      [UNIVERSE_ENTITIES_STORE],
      'readwrite',
    );

    insertTransaction.objectStore(UNIVERSE_ENTITIES_STORE).put(entity);

    await new Promise<void>((resolve, reject) => {
      insertTransaction.oncomplete = () => resolve();
      insertTransaction.onerror = () => reject(insertTransaction.error);
      insertTransaction.onabort = () => reject(insertTransaction.error);
    });
  });

  async function findEntity(): Promise<UniverseEntity | undefined> {
    const database = await getDatabase();
    const transaction = database.transaction([UNIVERSE_ENTITIES_STORE], 'readonly');

    return idbRequestToPromise(
      transaction.objectStore(UNIVERSE_ENTITIES_STORE).get(entity.id),
    );
  }

  it('soft-deletes an entity and increments its revision', async () => {
    await repository.deleteEntity(entity.id, 1, '2026-11-05T12:00:00.000Z');

    const deletedEntity = await findEntity();

    expect(deletedEntity).toEqual({
      ...entity,
      deletedAt: '2026-11-05T12:00:00.000Z',
      updatedAt: '2026-11-05T12:00:00.000Z',
      revision: 2,
    });
  });

  it('throws when the entity does not exist', async () => {
    await expect(
      repository.deleteEntity('missing-entity', 1, '2026-11-05T12:00:00.000Z'),
    ).rejects.toBeInstanceOf(UniverseEntityConcurrencyError);
  });

  it('throws when the entity is already deleted', async () => {
    const database = await getDatabase();
    const transaction = database.transaction([UNIVERSE_ENTITIES_STORE], 'readwrite');

    transaction.objectStore(UNIVERSE_ENTITIES_STORE).put({
      ...entity,
      deletedAt: '2026-11-04T12:00:00.000Z',
    });

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });

    await expect(
      repository.deleteEntity(entity.id, 1, '2026-11-05T12:00:00.000Z'),
    ).rejects.toBeInstanceOf(UniverseEntityConcurrencyError);
  });

  it('throws when the revision does not match', async () => {
    await expect(
      repository.deleteEntity(entity.id, 2, '2026-11-05T12:00:00.000Z'),
    ).rejects.toBeInstanceOf(UniverseEntityConcurrencyError);

    expect(await findEntity()).toEqual(entity);
  });

  it('does not modify the entity when deletion fails', async () => {
    await expect(
      repository.deleteEntity(entity.id, 2, '2026-11-05T12:00:00.000Z'),
    ).rejects.toThrow();

    expect(await findEntity()).toEqual(entity);
  });
});
