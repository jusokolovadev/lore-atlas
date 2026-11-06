import type { ImageReference } from 'src/shared/types/image-reference';

import {
  UNIVERSES_STORE,
  REFERENCE_ENTRIES_STORE,
  UNIVERSE_ENTITIES_STORE,
} from '../database/database.types';

import { getDatabase } from '../database/database';
import { idbRequestToPromise } from '../database/idb-request';
import { idbTransactionToPromise } from '../database/idb-transaction';
import type { ImageUsageRepository } from 'src/features/media/application/repositories/image-usage-repository';

interface ImageReferenceRecord {
  image: ImageReference | null;
}

interface UniverseImageReferenceRecord {
  coverImage: ImageReference | null;
}

function getFileId(image: ImageReference | null | undefined): string | null {
  return image?.type === 'file' ? image.fileId : null;
}

export class IndexedDbImageUsageRepository implements ImageUsageRepository {
  async findAllReferencedImageIds(): Promise<string[]> {
    const database = await getDatabase();

    const transaction = database.transaction(
      [UNIVERSES_STORE, REFERENCE_ENTRIES_STORE, UNIVERSE_ENTITIES_STORE],
      'readonly',
    );

    const transactionDone = idbTransactionToPromise(transaction);

    try {
      const universesRequest = idbRequestToPromise<UniverseImageReferenceRecord[]>(
        transaction.objectStore(UNIVERSES_STORE).getAll(),
      );

      const entriesRequest = idbRequestToPromise<ImageReferenceRecord[]>(
        transaction.objectStore(REFERENCE_ENTRIES_STORE).getAll(),
      );

      const entitiesRequest = idbRequestToPromise<ImageReferenceRecord[]>(
        transaction.objectStore(UNIVERSE_ENTITIES_STORE).getAll(),
      );

      const [universes, entries, entities] = await Promise.all([
        universesRequest,
        entriesRequest,
        entitiesRequest,
      ]);

      await transactionDone;

      const referencedImageIds = new Set<string>();

      for (const universe of universes) {
        const fileId = getFileId(universe.coverImage);

        if (fileId) {
          referencedImageIds.add(fileId);
        }
      }

      for (const record of [...entries, ...entities]) {
        const fileId = getFileId(record.image);

        if (fileId) {
          referencedImageIds.add(fileId);
        }
      }

      return [...referencedImageIds];
    } catch (error) {
      await transactionDone.catch(() => undefined);
      throw error;
    }
  }
}
