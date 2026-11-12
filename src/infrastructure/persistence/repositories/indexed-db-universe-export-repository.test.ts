import 'fake-indexeddb/auto';

import { IndexedDbUniverseExportRepository } from './indexed-db-universe-export-repository';

import { getDatabase, closeDatabase } from '../database/database';

import {
  UNIVERSES_STORE,
  REFERENCE_CATEGORIES_STORE,
  REFERENCE_ENTRIES_STORE,
  UNIVERSE_ENTITIES_STORE,
  RELATIONSHIPS_STORE,
  IMAGE_FILES_STORE,
} from '../database/database.types';

import type { Universe } from 'src/features/universes/domain/models/universe';
import type { ReferenceEntry } from 'src/features/reference-entry/domain/models/reference-entry';
import type { UniverseEntity } from 'src/features/entities/domain/models/universe-entity';

function createUniverse(id: string, coverImage: Universe['coverImage'] = null): Universe {
  return {
    id,
    name: `Universe ${id}`,
    description: null,
    coverImage,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    revision: 1,
    enabledStandardCategoryIds: [],
  };
}

function createReferenceEntry(
  id: string,
  universeId: string,
  image: ReferenceEntry['image'] = null,
): ReferenceEntry {
  return {
    id,
    universeId,
    categoryType: 'standard',
    categoryId: 'characters',
    name: `Entry ${id}`,
    description: null,
    image,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    revision: 1,
    isSpoiler: false,
  };
}

function createEntity(
  id: string,
  universeId: string,
  image: UniverseEntity['image'] = null,
): UniverseEntity {
  return {
    id,
    universeId,
    type: 'character',
    name: `Entity ${id}`,
    description: null,
    image,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    revision: 1,
    isSpoiler: false,
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
  };
}

async function seedRecords(
  stores: Partial<
    Record<
      | typeof UNIVERSES_STORE
      | typeof REFERENCE_CATEGORIES_STORE
      | typeof REFERENCE_ENTRIES_STORE
      | typeof UNIVERSE_ENTITIES_STORE
      | typeof RELATIONSHIPS_STORE
      | typeof IMAGE_FILES_STORE,
      unknown[]
    >
  >,
): Promise<void> {
  const database = await getDatabase();

  const storeNames = Object.keys(stores) as Array<
    | typeof UNIVERSES_STORE
    | typeof REFERENCE_CATEGORIES_STORE
    | typeof REFERENCE_ENTRIES_STORE
    | typeof UNIVERSE_ENTITIES_STORE
    | typeof RELATIONSHIPS_STORE
    | typeof IMAGE_FILES_STORE
  >;

  const transaction = database.transaction(storeNames, 'readwrite');

  for (const storeName of storeNames) {
    const store = transaction.objectStore(storeName);

    for (const record of stores[storeName] ?? []) {
      store.put(record);
    }
  }

  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function deleteDatabase(): Promise<void> {
  await closeDatabase();

  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('lore-atlas');

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Database deletion is blocked.'));
  });
}

describe('IndexedDbUniverseExportRepository', () => {
  let repository: IndexedDbUniverseExportRepository;

  beforeEach(async () => {
    await deleteDatabase();
    repository = new IndexedDbUniverseExportRepository();
  });

  afterEach(async () => {
    await closeDatabase();
  });

  describe('findUniverseExportData', () => {
    it('exports data belonging only to the requested universe', async () => {
      await seedRecords({
        [UNIVERSES_STORE]: [createUniverse('universe-1'), createUniverse('universe-2')],
        [REFERENCE_CATEGORIES_STORE]: [
          {
            id: 'category-1',
            universeId: 'universe-1',
            name: 'Category 1',
            description: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            revision: 1,
            deletedAt: null,
          },
          {
            id: 'category-2',
            universeId: 'universe-2',
            name: 'Category 2',
            description: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            revision: 1,
            deletedAt: null,
          },
        ],
        [REFERENCE_ENTRIES_STORE]: [
          createReferenceEntry('entry-1', 'universe-1'),
          createReferenceEntry('entry-2', 'universe-2'),
        ],
        [UNIVERSE_ENTITIES_STORE]: [
          createEntity('entity-1', 'universe-1'),
          createEntity('entity-2', 'universe-2'),
        ],
        [RELATIONSHIPS_STORE]: [
          {
            id: 'relationship-1',
            universeId: 'universe-1',
            sourceEntityId: 'entity-1',
            targetEntityId: 'entity-1',
            typeId: 'friend',
            description: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            deletedAt: null,
            revision: 1,
            isSpoiler: false,
          },
          {
            id: 'relationship-2',
            universeId: 'universe-2',
            sourceEntityId: 'entity-2',
            targetEntityId: 'entity-2',
            typeId: 'friend',
            description: null,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            deletedAt: null,
            revision: 1,
            isSpoiler: false,
          },
        ],
      });

      const result = await repository.findUniverseExportData('universe-1');

      expect(result.universe.id).toBe('universe-1');
      expect(result.referenceCategories.map(({ id }) => id)).toEqual(['category-1']);
      expect(result.referenceEntries.map(({ id }) => id)).toEqual(['entry-1']);
      expect(result.universeEntities.map(({ id }) => id)).toEqual(['entity-1']);
      expect(result.relationships.map(({ id }) => id)).toEqual(['relationship-1']);
      expect(result.images).toEqual([]);
    });

    it('collects unique referenced images from the universe, entries and entities', async () => {
      const sharedImage = {
        id: 'image-1',
        mimeType: 'image/png',
        size: 100,
        createdAt: '2026-01-01T00:00:00.000Z',
        blob: new Blob(['image-content'], { type: 'image/png' }),
      };

      const secondImage = {
        id: 'image-2',
        mimeType: 'image/jpeg',
        size: 200,
        createdAt: '2026-01-01T00:00:00.000Z',
        blob: new Blob(['image-content'], { type: 'image/jpeg' }),
      };

      await seedRecords({
        [UNIVERSES_STORE]: [
          createUniverse('universe-1', {
            type: 'file',
            fileId: 'image-1',
          }),
        ],
        [REFERENCE_ENTRIES_STORE]: [
          createReferenceEntry('entry-1', 'universe-1', {
            type: 'file',
            fileId: 'image-1',
          }),
          createReferenceEntry('entry-2', 'universe-1', {
            type: 'file',
            fileId: 'image-2',
          }),
        ],
        [UNIVERSE_ENTITIES_STORE]: [
          createEntity('entity-1', 'universe-1', {
            type: 'file',
            fileId: 'image-2',
          }),
        ],
        [IMAGE_FILES_STORE]: [sharedImage, secondImage],
      });

      const result = await repository.findUniverseExportData('universe-1');

      expect(result.images).toEqual([
        {
          id: 'image-1',
          mimeType: 'image/png',
          size: 100,
          createdAt: '2026-01-01T00:00:00.000Z',
          path: 'images/image-1.png',
        },
        {
          id: 'image-2',
          mimeType: 'image/jpeg',
          size: 200,
          createdAt: '2026-01-01T00:00:00.000Z',
          path: 'images/image-2.jpg',
        },
      ]);
    });

    it('does not include URL images', async () => {
      await seedRecords({
        [UNIVERSES_STORE]: [
          createUniverse('universe-1', {
            type: 'url',
            url: 'https://example.com/image.png',
          }),
        ],
      });

      const result = await repository.findUniverseExportData('universe-1');

      expect(result.images).toEqual([]);
    });

    it('throws when the requested universe does not exist', async () => {
      await expect(repository.findUniverseExportData('missing-universe')).rejects.toThrow(
        'Universe not found: missing-universe.',
      );
    });

    it('throws when a referenced image does not exist', async () => {
      await seedRecords({
        [UNIVERSES_STORE]: [
          createUniverse('universe-1', {
            type: 'file',
            fileId: 'missing-image',
          }),
        ],
      });

      await expect(repository.findUniverseExportData('universe-1')).rejects.toThrow(
        'Referenced image not found: missing-image.',
      );
    });

    it('throws when a referenced image has an unsupported MIME type', async () => {
      await seedRecords({
        [UNIVERSES_STORE]: [
          createUniverse('universe-1', {
            type: 'file',
            fileId: 'image-1',
          }),
        ],
        [IMAGE_FILES_STORE]: [
          {
            id: 'image-1',
            mimeType: 'image/svg+xml',
            size: 100,
            createdAt: '2026-01-01T00:00:00.000Z',
            blob: new Blob(['<svg/>'], { type: 'image/svg+xml' }),
          },
        ],
      });

      await expect(repository.findUniverseExportData('universe-1')).rejects.toThrow(
        'Unsupported image MIME type: image/svg+xml.',
      );
    });
  });

  describe('findImageContent', () => {
    it('returns the image Blob when the image exists', async () => {
      const blob = new Blob(['image-content'], { type: 'image/png' });

      await seedRecords({
        [IMAGE_FILES_STORE]: [
          {
            id: 'image-1',
            mimeType: 'image/png',
            size: blob.size,
            createdAt: '2026-01-01T00:00:00.000Z',
            blob,
          },
        ],
      });

      const result = await repository.findImageContent('image-1');

      expect(result).toBeInstanceOf(Blob);
      expect(result?.type).toBe('image/png');
      expect(result?.size).toBe(blob.size);
    });

    it('returns null when the image does not exist', async () => {
      const result = await repository.findImageContent('missing-image');

      expect(result).toBeNull();
    });
  });
});
