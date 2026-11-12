import { IndexedDbUniverseImportRepository } from './indexed-db-universe-import-repository';

import type { ImageFileRecord } from '../image-storage/image-file-record';
import type { UniverseExportManifest } from 'src/features/import-export/domain/models/universe-export';

import {
  UNIVERSES_STORE,
  REFERENCE_CATEGORIES_STORE,
  CATEGORY_NAME_RESERVATIONS_STORE,
  REFERENCE_ENTRIES_STORE,
  REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
  UNIVERSE_ENTITIES_STORE,
  RELATIONSHIPS_STORE,
  IMAGE_FILES_STORE,
} from '../database/database.types';

import { getDatabase, closeDatabase } from '../database/database';
import { createUniverseExportManifest } from 'src/features/import-export/domain/operations/__tests__/fixtures/create-universe-export-manifest';

describe('IndexedDbUniverseImportRepository', () => {
  let repository: IndexedDbUniverseImportRepository;

  async function deleteTestDatabase(): Promise<void> {
    await closeDatabase();

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase('lore-atlas');

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        reject(new Error('Database deletion is blocked.'));
      };
    });
  }

  async function getAllRecords<T>(storeName: string): Promise<T[]> {
    const database = await getDatabase();
    const transaction = database.transaction(storeName, 'readonly');
    const request = transaction.objectStore(storeName).getAll();

    return new Promise<T[]>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  function createImageContents(manifest: UniverseExportManifest): Map<string, Blob> {
    return new Map(
      manifest.images.map((image) => {
        const bytes = new Uint8Array(image.size);

        if (image.mimeType === 'image/png') {
          bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
        }

        return [image.id, new Blob([bytes], { type: image.mimeType })];
      }),
    );
  }

  beforeEach(async () => {
    await deleteTestDatabase();

    Object.defineProperty(globalThis, 'createImageBitmap', {
      configurable: true,
      value: jest.fn().mockResolvedValue({
        close: jest.fn(),
      }),
    });

    repository = new IndexedDbUniverseImportRepository();
  });

  afterEach(async () => {
    await closeDatabase();
    Reflect.deleteProperty(globalThis, 'createImageBitmap');
  });

  describe('importUniverse', () => {
    it('imports all universe data and image files', async () => {
      const manifest = createUniverseExportManifest();
      const imageContents = createImageContents(manifest);

      const result = await repository.importUniverse(manifest, imageContents);

      expect(result).toBe('universe-1');

      const universes = await getAllRecords(UNIVERSES_STORE);
      const categories = await getAllRecords(REFERENCE_CATEGORIES_STORE);
      const categoryReservations = await getAllRecords(CATEGORY_NAME_RESERVATIONS_STORE);
      const entries = await getAllRecords(REFERENCE_ENTRIES_STORE);
      const entryReservations = await getAllRecords(
        REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
      );
      const entities = await getAllRecords(UNIVERSE_ENTITIES_STORE);
      const relationships = await getAllRecords(RELATIONSHIPS_STORE);
      const images = await getAllRecords<ImageFileRecord>(IMAGE_FILES_STORE);

      expect(universes).toEqual([manifest.universe]);
      expect(categories).toEqual(manifest.referenceCategories);
      expect(entries).toEqual(manifest.referenceEntries);
      expect(entities).toEqual(manifest.universeEntities);
      expect(relationships).toEqual(manifest.relationships);

      expect(categoryReservations).toHaveLength(1);
      expect(entryReservations).toHaveLength(2);
      expect(images).toHaveLength(1);

      expect(images[0]).toMatchObject({
        id: 'image-1',
        mimeType: 'image/png',
        size: 100,
        createdAt: '2026-01-01T00:00:00.000Z',
      });

      expect(images[0].blob).toBeInstanceOf(Blob);
      expect(images[0].blob.size).toBe(100);
      expect(images[0].blob.type).toBe('image/png');
    });

    it('creates category name reservations', async () => {
      const manifest = createUniverseExportManifest();

      await repository.importUniverse(manifest, createImageContents(manifest));

      const reservations = await getAllRecords<{
        universeId: string;
        name: string;
        categoryId: string;
      }>(CATEGORY_NAME_RESERVATIONS_STORE);

      expect(reservations).toContainEqual({
        universeId: 'universe-1',
        name: 'Custom category',
        categoryId: 'category-1',
      });
    });

    it('creates entry name reservations for standard and custom entries', async () => {
      const manifest = createUniverseExportManifest();

      await repository.importUniverse(manifest, createImageContents(manifest));

      const reservations = await getAllRecords<{
        universeId: string;
        categoryType: string;
        categoryId: string;
        name: string;
        entryId: string;
      }>(REFERENCE_ENTRY_NAME_RESERVATIONS_STORE);

      expect(reservations).toEqual(
        expect.arrayContaining([
          {
            universeId: 'universe-1',
            categoryType: 'custom',
            categoryId: 'category-1',
            name: 'Custom entry',
            entryId: 'entry-1',
          },
          {
            universeId: 'universe-1',
            categoryType: 'standard',
            categoryId: 'standard-category-1',
            name: 'Standard entry',
            entryId: 'entry-2',
          },
        ]),
      );
    });

    it('throws when image content is missing', async () => {
      const manifest = createUniverseExportManifest();

      await expect(repository.importUniverse(manifest, new Map())).rejects.toThrow(
        'Image content not found: image-1.',
      );

      expect(await getAllRecords(UNIVERSES_STORE)).toHaveLength(0);
    });

    it('throws when image size does not match metadata', async () => {
      const manifest = createUniverseExportManifest();

      const imageContents = new Map<string, Blob>([
        ['image-1', new Blob([new Uint8Array(99)], { type: 'image/png' })],
      ]);

      await expect(repository.importUniverse(manifest, imageContents)).rejects.toThrow(
        'Image size mismatch: image-1.',
      );

      expect(await getAllRecords(UNIVERSES_STORE)).toHaveLength(0);
    });

    it('rejects an image when its MIME type does not match the manifest', async () => {
      const manifest = createUniverseExportManifest();

      const imageContents = new Map([
        ['image-1', new Blob([new Uint8Array(100)], { type: 'image/jpeg' })],
      ]);

      await expect(repository.importUniverse(manifest, imageContents)).rejects.toThrow(
        'Image MIME type mismatch: image-1.',
      );
    });

    it('rejects an image with an unsupported format', async () => {
      const manifest = createUniverseExportManifest();
      manifest.images[0].mimeType = 'image/svg+xml';

      const imageContents = new Map([
        ['image-1', new Blob([new Uint8Array(100)], { type: 'image/svg+xml' })],
      ]);

      await expect(repository.importUniverse(manifest, imageContents)).rejects.toThrow(
        'Unsupported image format.',
      );
    });

    it('rejects image content that does not match its MIME type', async () => {
      const manifest = createUniverseExportManifest();

      const invalidPng = new Uint8Array(100);
      invalidPng.set([0x00, 0x01, 0x02, 0x03]);

      const imageContents = new Map([
        ['image-1', new Blob([invalidPng], { type: 'image/png' })],
      ]);

      await expect(repository.importUniverse(manifest, imageContents)).rejects.toThrow(
        'Image content does not match its MIME type.',
      );

      expect(await getAllRecords(UNIVERSES_STORE)).toHaveLength(0);
    });

    it('rolls back the entire import when a record conflicts', async () => {
      const manifest = createUniverseExportManifest();

      const database = await getDatabase();
      const transaction = database.transaction(UNIVERSES_STORE, 'readwrite');

      transaction.objectStore(UNIVERSES_STORE).add(manifest.universe);

      await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(transaction.error);
      });

      await expect(
        repository.importUniverse(manifest, createImageContents(manifest)),
      ).rejects.toBeDefined();

      expect(await getAllRecords(UNIVERSES_STORE)).toEqual([manifest.universe]);
      expect(await getAllRecords(REFERENCE_CATEGORIES_STORE)).toHaveLength(0);
      expect(await getAllRecords(CATEGORY_NAME_RESERVATIONS_STORE)).toHaveLength(0);
      expect(await getAllRecords(REFERENCE_ENTRIES_STORE)).toHaveLength(0);
      expect(await getAllRecords(REFERENCE_ENTRY_NAME_RESERVATIONS_STORE)).toHaveLength(
        0,
      );
      expect(await getAllRecords(UNIVERSE_ENTITIES_STORE)).toHaveLength(0);
      expect(await getAllRecords(RELATIONSHIPS_STORE)).toHaveLength(0);
      expect(await getAllRecords(IMAGE_FILES_STORE)).toHaveLength(0);
    });
  });

  it('imports soft-deleted categories and their name reservations', async () => {
    const manifest = createUniverseExportManifest();

    manifest.referenceCategories[0].deletedAt = '2026-03-01T00:00:00.000Z';

    await repository.importUniverse(manifest, createImageContents(manifest));

    const categories = await getAllRecords<{
      id: string;
      deletedAt: string | null;
    }>(REFERENCE_CATEGORIES_STORE);

    const reservations = await getAllRecords<{
      categoryId: string;
      name: string;
    }>(CATEGORY_NAME_RESERVATIONS_STORE);

    expect(categories[0].deletedAt).toBe('2026-03-01T00:00:00.000Z');

    expect(reservations).toContainEqual({
      universeId: 'universe-1',
      categoryId: 'category-1',
      name: 'Custom category',
    });
  });

  it('imports soft-deleted entries and their name reservations', async () => {
    const manifest = createUniverseExportManifest();

    manifest.referenceEntries[0].deletedAt = '2026-03-01T00:00:00.000Z';

    await repository.importUniverse(manifest, createImageContents(manifest));

    const entries = await getAllRecords<{
      id: string;
      deletedAt: string | null;
    }>(REFERENCE_ENTRIES_STORE);

    const reservations = await getAllRecords<{
      entryId: string;
      name: string;
    }>(REFERENCE_ENTRY_NAME_RESERVATIONS_STORE);

    expect(entries.find((entry) => entry.id === 'entry-1')?.deletedAt).toBe(
      '2026-03-01T00:00:00.000Z',
    );

    expect(reservations).toContainEqual({
      universeId: 'universe-1',
      categoryType: 'custom',
      categoryId: 'category-1',
      entryId: 'entry-1',
      name: 'Custom entry',
    });
  });
});
