import type { UniverseExportRepository } from 'src/features/import-export/application/repositories/universe-export-repository';
import type { UniverseExportManifest } from 'src/features/import-export/domain/models/universe-export';
import type { ImageReference } from 'src/shared/types/image-reference';

import type { Universe } from 'src/features/universes/domain/models/universe';
import type { ReferenceEntry } from 'src/features/reference-entry/domain/models/reference-entry';
import type { UniverseEntity } from 'src/features/entities/domain/models/universe-entity';
import type { Relationship } from 'src/features/relationships/domain/models/relationship';

import {
  UNIVERSES_STORE,
  REFERENCE_CATEGORIES_STORE,
  REFERENCE_ENTRIES_STORE,
  UNIVERSE_ENTITIES_STORE,
  RELATIONSHIPS_STORE,
  IMAGE_FILES_STORE,
} from '../database/database.types';

import { getDatabase } from '../database/database';
import { idbRequestToPromise } from '../database/idb-request';
import { idbTransactionToPromise } from '../database/idb-transaction';

import type { ImageFileRecord } from '../image-storage/image-file-record';
import type { StoredImage } from 'src/features/media/domain/models/stored-image';
import type { CustomReferenceCategory } from 'src/features/reference-categories/domain/models/custom-reference-category';

function getFileId(image: ImageReference | null | undefined): string | null {
  return image?.type === 'file' ? image.fileId : null;
}

function getImageExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return 'png';
    case 'image/jpeg':
      return 'jpg';
    case 'image/gif':
      return 'gif';
    case 'image/webp':
      return 'webp';
    default:
      throw new Error(`Unsupported image MIME type: ${mimeType}.`);
  }
}

function toExportedImageMetadata(
  image: StoredImage,
): UniverseExportManifest['images'][number] {
  const extension = getImageExtension(image.mimeType);

  return {
    id: image.id,
    mimeType: image.mimeType,
    size: image.size,
    createdAt: image.createdAt,
    path: `images/${image.id}.${extension}`,
  };
}

export class IndexedDbUniverseExportRepository implements UniverseExportRepository {
  async findUniverseExportData(universeId: string): Promise<UniverseExportManifest> {
    const database = await getDatabase();

    const transaction = database.transaction(
      [
        UNIVERSES_STORE,
        REFERENCE_CATEGORIES_STORE,
        REFERENCE_ENTRIES_STORE,
        UNIVERSE_ENTITIES_STORE,
        RELATIONSHIPS_STORE,
        IMAGE_FILES_STORE,
      ],
      'readonly',
    );

    const transactionDone = idbTransactionToPromise(transaction);

    try {
      const universesStore = transaction.objectStore(UNIVERSES_STORE);
      const categoriesStore = transaction.objectStore(REFERENCE_CATEGORIES_STORE);
      const entriesStore = transaction.objectStore(REFERENCE_ENTRIES_STORE);
      const entitiesStore = transaction.objectStore(UNIVERSE_ENTITIES_STORE);
      const relationshipsStore = transaction.objectStore(RELATIONSHIPS_STORE);
      const imagesStore = transaction.objectStore(IMAGE_FILES_STORE);

      const universeRequest = idbRequestToPromise<Universe | undefined>(
        universesStore.get(universeId),
      );

      const categoriesRequest = idbRequestToPromise<CustomReferenceCategory[]>(
        categoriesStore.index('by_universe_id').getAll(universeId),
      );

      const entriesRequest = idbRequestToPromise<ReferenceEntry[]>(
        entriesStore.index('by_universe_id').getAll(universeId),
      );

      const entitiesRequest = idbRequestToPromise<UniverseEntity[]>(
        entitiesStore.index('universeId').getAll(universeId),
      );

      const relationshipsRequest = idbRequestToPromise<Relationship[]>(
        relationshipsStore.index('universeId').getAll(universeId),
      );

      const [
        universe,
        referenceCategories,
        referenceEntries,
        universeEntities,
        relationships,
      ] = await Promise.all([
        universeRequest,
        categoriesRequest,
        entriesRequest,
        entitiesRequest,
        relationshipsRequest,
      ]);

      if (!universe) {
        throw new Error(`Universe not found: ${universeId}.`);
      }

      const referencedImageIds = new Set<string>();

      const universeCoverImageId = getFileId(universe.coverImage);

      if (universeCoverImageId) {
        referencedImageIds.add(universeCoverImageId);
      }

      for (const entry of referenceEntries) {
        const imageId = getFileId(entry.image);

        if (imageId) {
          referencedImageIds.add(imageId);
        }
      }

      for (const entity of universeEntities) {
        const imageId = getFileId(entity.image);

        if (imageId) {
          referencedImageIds.add(imageId);
        }
      }

      const imageRequests = [...referencedImageIds].map((imageId) =>
        idbRequestToPromise<ImageFileRecord | undefined>(imagesStore.get(imageId)),
      );

      const imageRecords = await Promise.all(imageRequests);

      const images = imageRecords.map((record, index) => {
        if (!record) {
          const imageId = [...referencedImageIds][index];

          throw new Error(`Referenced image not found: ${imageId}.`);
        }

        return toExportedImageMetadata(record);
      });

      await transactionDone;

      return {
        format: 'lore-atlas-universe',
        version: 1,
        exportedAt: new Date().toISOString(),
        universe,
        referenceCategories,
        referenceEntries,
        universeEntities,
        relationships,
        images,
      };
    } catch (error) {
      await transactionDone.catch(() => undefined);
      throw error;
    }
  }

  async findImageContent(imageId: string): Promise<Blob | null> {
    const database = await getDatabase();

    const transaction = database.transaction(IMAGE_FILES_STORE, 'readonly');
    const transactionDone = idbTransactionToPromise(transaction);

    try {
      const record = await idbRequestToPromise<ImageFileRecord | undefined>(
        transaction.objectStore(IMAGE_FILES_STORE).get(imageId),
      );

      await transactionDone;

      return record?.blob ?? null;
    } catch (error) {
      await transactionDone.catch(() => undefined);
      throw error;
    }
  }
}
