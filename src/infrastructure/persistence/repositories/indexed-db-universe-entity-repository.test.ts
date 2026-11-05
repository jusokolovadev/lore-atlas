import 'fake-indexeddb/auto';

import type { UniverseEntity } from 'src/features/entities/domain/models/universe-entity';
import type { Universe } from 'src/features/universes/domain/models/universe';

import { getDatabase } from '../database/database';
import { UniverseEntityConcurrencyError } from 'src/features/entities/application/errors/universe-entity-application-errors';
import { IndexedDbUniverseEntityRepository } from './indexed-db-universe-entity-repository';

jest.mock('../database/database', () => ({
  getDatabase: jest.fn(),
}));

describe('IndexedDbUniverseEntityRepository', () => {
  let database: IDBDatabase;
  let repository: IndexedDbUniverseEntityRepository;

  const universe: Universe = {
    id: 'universe-1',
    name: 'Middle-earth',
    description: null,
    coverImage: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    revision: 1,
    enabledStandardCategoryIds: [],
  };

  const entity: UniverseEntity = {
    id: 'entity-1',
    universeId: 'universe-1',
    type: 'character',
    name: 'Aragorn',
    description: null,
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

  async function createDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(
        `universe-entity-tests-${Date.now()}-${Math.random()}`,
        1,
      );

      request.onupgradeneeded = () => {
        const db = request.result;

        db.createObjectStore('universes', {
          keyPath: 'id',
        });

        const entitiesStore = db.createObjectStore('universeEntities', {
          keyPath: 'id',
        });

        entitiesStore.createIndex('universeId', 'universeId');
        entitiesStore.createIndex('universeId_type', ['universeId', 'type']);
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function seedUniverse(value: Universe = universe): Promise<void> {
    const transaction = database.transaction('universes', 'readwrite');

    transaction.objectStore('universes').put(value);

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  async function seedEntity(value: UniverseEntity = entity): Promise<void> {
    const transaction = database.transaction('universeEntities', 'readwrite');

    transaction.objectStore('universeEntities').put(value);

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  async function readEntity(id: string): Promise<UniverseEntity | null> {
    const transaction = database.transaction('universeEntities', 'readonly');

    const result = await new Promise<UniverseEntity | undefined>((resolve, reject) => {
      const request = transaction.objectStore('universeEntities').get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return result ?? null;
  }

  beforeEach(async () => {
    database = await createDatabase();

    jest.mocked(getDatabase).mockResolvedValue(database);

    repository = new IndexedDbUniverseEntityRepository();
  });

  afterEach(() => {
    database.close();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('returns an entity by ID', async () => {
      await seedEntity();

      await expect(repository.findById('entity-1')).resolves.toEqual(entity);
    });

    it('returns null when the entity does not exist', async () => {
      await expect(repository.findById('unknown')).resolves.toBeNull();
    });

    it('returns deleted entities as well', async () => {
      const deletedEntity = {
        ...entity,
        deletedAt: '2026-01-15T00:00:00.000Z',
      };

      await seedEntity(deletedEntity);

      await expect(repository.findById('entity-1')).resolves.toEqual(deletedEntity);
    });
  });

  describe('findAllActiveByUniverseId', () => {
    it('returns only active entities belonging to the universe', async () => {
      await seedEntity();

      await seedEntity({
        ...entity,
        id: 'entity-2',
        name: 'Legolas',
        deletedAt: '2026-01-15T00:00:00.000Z',
      });

      await seedEntity({
        ...entity,
        id: 'entity-3',
        universeId: 'universe-2',
      });

      await expect(repository.findAllActiveByUniverseId('universe-1')).resolves.toEqual([
        entity,
      ]);
    });
  });

  describe('findAllActiveByType', () => {
    it('returns only active entities of the requested type', async () => {
      await seedEntity();

      await seedEntity({
        ...entity,
        id: 'entity-2',
        type: 'organization',
        name: 'Fellowship',
        properties: {
          organizationType: null,
          factionType: null,
          structure: null,
          goals: null,
          activities: null,
          ideology: null,
          foundedDate: null,
          dissolvedDate: null,
          memberCount: null,
          memberCountDescription: null,
          history: null,
          resources: [],
          notes: null,
        },
      });

      await seedEntity({
        ...entity,
        id: 'entity-3',
        deletedAt: '2026-01-15T00:00:00.000Z',
      });

      await expect(
        repository.findAllActiveByType('universe-1', 'character'),
      ).resolves.toEqual([entity]);
    });

    it('does not return entities from another universe', async () => {
      await seedEntity();

      await seedEntity({
        ...entity,
        id: 'entity-2',
        universeId: 'universe-2',
      });

      await expect(
        repository.findAllActiveByType('universe-1', 'character'),
      ).resolves.toEqual([entity]);
    });
  });

  describe('createIfUniverseActive', () => {
    it('creates an entity when the universe is active', async () => {
      await seedUniverse();

      await expect(repository.createIfUniverseActive(entity)).resolves.toBe(true);

      await expect(readEntity('entity-1')).resolves.toEqual(entity);
    });

    it('does not create an entity when the universe does not exist', async () => {
      await expect(repository.createIfUniverseActive(entity)).resolves.toBe(false);

      await expect(readEntity('entity-1')).resolves.toBeNull();
    });

    it('does not create an entity when the universe is deleted', async () => {
      await seedUniverse({
        ...universe,
        deletedAt: '2026-01-15T00:00:00.000Z',
      });

      await expect(repository.createIfUniverseActive(entity)).resolves.toBe(false);

      await expect(readEntity('entity-1')).resolves.toBeNull();
    });
  });

  describe('update', () => {
    it('updates an entity with the expected revision', async () => {
      await seedEntity();

      const updatedEntity: UniverseEntity = {
        ...entity,
        name: 'Aragorn II',
        revision: 2,
        updatedAt: '2026-02-01T00:00:00.000Z',
      };

      await repository.update(updatedEntity, 1);

      await expect(readEntity('entity-1')).resolves.toEqual(updatedEntity);
    });

    it('throws when the entity does not exist', async () => {
      await expect(
        repository.update(
          {
            ...entity,
            revision: 2,
          },
          1,
        ),
      ).rejects.toBeInstanceOf(UniverseEntityConcurrencyError);
    });

    it('throws when the entity is deleted', async () => {
      await seedEntity({
        ...entity,
        deletedAt: '2026-01-15T00:00:00.000Z',
      });

      await expect(
        repository.update(
          {
            ...entity,
            revision: 3,
          },
          2,
        ),
      ).rejects.toBeInstanceOf(UniverseEntityConcurrencyError);
    });

    it('throws on revision conflict', async () => {
      await seedEntity();

      await expect(
        repository.update(
          {
            ...entity,
            revision: 2,
          },
          2,
        ),
      ).rejects.toBeInstanceOf(UniverseEntityConcurrencyError);

      await expect(readEntity('entity-1')).resolves.toEqual(entity);
    });
  });

  describe('restore', () => {
    const deletedEntity: UniverseEntity = {
      ...entity,
      deletedAt: '2026-01-15T00:00:00.000Z',
      revision: 2,
    };

    it('restores an entity when the universe is active', async () => {
      await seedUniverse();
      await seedEntity(deletedEntity);

      const restoredEntity: UniverseEntity = {
        ...deletedEntity,
        deletedAt: null,
        revision: 3,
        updatedAt: '2026-02-01T00:00:00.000Z',
      };

      await repository.restore(restoredEntity, 2);

      await expect(readEntity('entity-1')).resolves.toEqual(restoredEntity);
    });

    it('throws when the entity does not exist', async () => {
      await seedUniverse();

      await expect(
        repository.restore(
          {
            ...deletedEntity,
            deletedAt: null,
            revision: 3,
          },
          2,
        ),
      ).rejects.toBeInstanceOf(UniverseEntityConcurrencyError);
    });

    it('throws when the entity is not deleted', async () => {
      await seedUniverse();
      await seedEntity();

      await expect(
        repository.restore(
          {
            ...entity,
            revision: 2,
          },
          1,
        ),
      ).rejects.toBeInstanceOf(UniverseEntityConcurrencyError);
    });

    it('throws on revision conflict', async () => {
      await seedUniverse();
      await seedEntity(deletedEntity);

      await expect(
        repository.restore(
          {
            ...deletedEntity,
            deletedAt: null,
            revision: 3,
          },
          1,
        ),
      ).rejects.toBeInstanceOf(UniverseEntityConcurrencyError);

      await expect(readEntity('entity-1')).resolves.toEqual(deletedEntity);
    });

    it('throws when the universe does not exist', async () => {
      await seedEntity(deletedEntity);

      await expect(
        repository.restore(
          {
            ...deletedEntity,
            deletedAt: null,
            revision: 3,
          },
          2,
        ),
      ).rejects.toThrow('Universe not found or deleted.');

      await expect(readEntity('entity-1')).resolves.toEqual(deletedEntity);
    });

    it('throws when the universe is deleted', async () => {
      await seedUniverse({
        ...universe,
        deletedAt: '2026-01-15T00:00:00.000Z',
      });

      await seedEntity(deletedEntity);

      await expect(
        repository.restore(
          {
            ...deletedEntity,
            deletedAt: null,
            revision: 3,
          },
          2,
        ),
      ).rejects.toThrow('Universe not found or deleted.');

      await expect(readEntity('entity-1')).resolves.toEqual(deletedEntity);
    });
  });
});
