import type { UniverseImportRepository } from 'src/features/import-export/application/repositories/universe-import-repository';

import type { ImageFileRecord } from '../image-storage/image-file-record';

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

import { getDatabase } from '../database/database';
import { idbRequestToPromise } from '../database/idb-request';
import { idbTransactionToPromise } from '../database/idb-transaction';
import { validateImageBlob } from '../image-storage/validate-image-blob';

export class IndexedDbUniverseImportRepository implements UniverseImportRepository {
  async importUniverse(
    manifest: Parameters<UniverseImportRepository['importUniverse']>[0],
    imageContents: Map<string, Blob>,
  ): Promise<string> {
    // Validate image contents before opening the transaction.
    const imageRecords: ImageFileRecord[] = [];

    for (const image of manifest.images) {
      const blob = imageContents.get(image.id);

      if (!blob) {
        throw new Error(`Image content not found: ${image.id}.`);
      }

      if (blob.size !== image.size) {
        throw new Error(`Image size mismatch: ${image.id}.`);
      }

      if (blob.type !== image.mimeType) {
        throw new Error(`Image MIME type mismatch: ${image.id}.`);
      }

      await validateImageBlob(blob);

      imageRecords.push({
        id: image.id,
        mimeType: image.mimeType,
        size: image.size,
        createdAt: image.createdAt,
        blob,
      });
    }

    const database = await getDatabase();

    const transaction = database.transaction(
      [
        UNIVERSES_STORE,
        REFERENCE_CATEGORIES_STORE,
        CATEGORY_NAME_RESERVATIONS_STORE,
        REFERENCE_ENTRIES_STORE,
        REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
        UNIVERSE_ENTITIES_STORE,
        RELATIONSHIPS_STORE,
        IMAGE_FILES_STORE,
      ],
      'readwrite',
    );

    const transactionDone = idbTransactionToPromise(transaction);

    try {
      const universesStore = transaction.objectStore(UNIVERSES_STORE);
      const categoriesStore = transaction.objectStore(REFERENCE_CATEGORIES_STORE);
      const categoryReservationsStore = transaction.objectStore(
        CATEGORY_NAME_RESERVATIONS_STORE,
      );
      const entriesStore = transaction.objectStore(REFERENCE_ENTRIES_STORE);
      const entryReservationsStore = transaction.objectStore(
        REFERENCE_ENTRY_NAME_RESERVATIONS_STORE,
      );
      const entitiesStore = transaction.objectStore(UNIVERSE_ENTITIES_STORE);
      const relationshipsStore = transaction.objectStore(RELATIONSHIPS_STORE);
      const imagesStore = transaction.objectStore(IMAGE_FILES_STORE);

      const requests: Promise<unknown>[] = [];

      requests.push(idbRequestToPromise(universesStore.add(manifest.universe)));

      for (const category of manifest.referenceCategories) {
        requests.push(idbRequestToPromise(categoriesStore.add(category)));

        requests.push(
          idbRequestToPromise(
            categoryReservationsStore.add({
              universeId: category.universeId,
              name: category.name,
              categoryId: category.id,
            }),
          ),
        );
      }

      for (const entry of manifest.referenceEntries) {
        requests.push(idbRequestToPromise(entriesStore.add(entry)));

        requests.push(
          idbRequestToPromise(
            entryReservationsStore.add({
              universeId: entry.universeId,
              categoryType: entry.categoryType,
              categoryId: entry.categoryId,
              name: entry.name,
              entryId: entry.id,
            }),
          ),
        );
      }

      for (const entity of manifest.universeEntities) {
        requests.push(idbRequestToPromise(entitiesStore.add(entity)));
      }

      for (const relationship of manifest.relationships) {
        requests.push(idbRequestToPromise(relationshipsStore.add(relationship)));
      }

      for (const image of imageRecords) {
        requests.push(idbRequestToPromise(imagesStore.add(image)));
      }

      await Promise.all(requests);
      await transactionDone;

      return manifest.universe.id;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // The transaction may already have been aborted or completed.
      }

      await transactionDone.catch(() => undefined);

      throw error;
    }
  }
}
