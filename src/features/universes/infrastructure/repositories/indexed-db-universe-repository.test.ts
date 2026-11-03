import type { Universe } from '../../domain/models/universe';

const DATABASE_NAME = 'lore-atlas';

function createUniverse(overrides: Partial<Universe> = {}): Universe {
  return {
    id: 'universe-1',
    name: 'Middle-earth',
    description: null,
    coverImage: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

async function deleteDatabase(name: string): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      reject(new Error(`Database deletion blocked: ${name}`));
    };
  });
}

describe('IndexedDbUniverseRepository', () => {
  beforeEach(async () => {
    jest.resetModules();
    await deleteDatabase(DATABASE_NAME);
  });

  afterEach(async () => {
    const { getDatabase } =
      await import('src/infrastructure/persistence/database/database');

    const database = await getDatabase();
    database.close();
  });

  it('should return a universe by ID', async () => {
    const { IndexedDbUniverseRepository } =
      await import('./indexed-db-universe-repository');

    const repository = new IndexedDbUniverseRepository();
    const universe = createUniverse();

    await repository.save(universe);

    const result = await repository.findById(universe.id);

    expect(result).toEqual(universe);
  });

  it('should return null when universe does not exist', async () => {
    const { IndexedDbUniverseRepository } =
      await import('./indexed-db-universe-repository');

    const repository = new IndexedDbUniverseRepository();

    const result = await repository.findById('missing-id');

    expect(result).toBeNull();
  });

  it('should return only active universes', async () => {
    const { IndexedDbUniverseRepository } =
      await import('./indexed-db-universe-repository');

    const repository = new IndexedDbUniverseRepository();

    const activeUniverse = createUniverse({
      id: 'active-universe',
    });

    const deletedUniverse = createUniverse({
      id: 'deleted-universe',
      name: 'Narnia',
      deletedAt: '2026-02-01T00:00:00.000Z',
    });

    await repository.save(activeUniverse);
    await repository.save(deletedUniverse);

    const result = await repository.findAllActive();

    expect(result).toEqual([activeUniverse]);
  });

  it('should save a new universe', async () => {
    const { IndexedDbUniverseRepository } =
      await import('./indexed-db-universe-repository');

    const repository = new IndexedDbUniverseRepository();
    const universe = createUniverse();

    await repository.save(universe);

    expect(await repository.findById(universe.id)).toEqual(universe);
  });

  it('should update an existing universe', async () => {
    const { IndexedDbUniverseRepository } =
      await import('./indexed-db-universe-repository');

    const repository = new IndexedDbUniverseRepository();

    const universe = createUniverse();

    await repository.save(universe);

    const updatedUniverse: Universe = {
      ...universe,
      name: 'The Lord of the Rings',
      updatedAt: '2026-03-01T00:00:00.000Z',
    };

    await repository.save(updatedUniverse);

    expect(await repository.findById(universe.id)).toEqual(updatedUniverse);
  });
});
