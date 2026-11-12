import { IMAGE_FILES_STORE } from '../database/database.types';
import { getDatabase } from '../database/database';
import { idbRequestToPromise } from '../database/idb-request';
import { idbTransactionToPromise } from '../database/idb-transaction';

import type { ImageFileRecord } from '../image-storage/image-file-record';

import { validateImageBlob } from '../image-storage/validate-image-blob';
import type { ImageStorageRepository } from 'src/features/media/application/repositories/image-storage-repository';
import type { StoredImage } from 'src/features/media/domain/models/stored-image';

type ImageBlobValidator = (blob: Blob) => Promise<void>;

export class IndexedDbImageStorageRepository implements ImageStorageRepository {
  constructor(private readonly validateBlob: ImageBlobValidator = validateImageBlob) {}
  async save(image: StoredImage, blob: Blob): Promise<void> {
    await this.validateBlob(blob);
    const database = await getDatabase();

    const transaction = database.transaction(IMAGE_FILES_STORE, 'readwrite');
    const transactionDone = idbTransactionToPromise(transaction);

    try {
      const record: ImageFileRecord = {
        ...image,
        blob,
      };

      await idbRequestToPromise(transaction.objectStore(IMAGE_FILES_STORE).put(record));

      await transactionDone;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // Transaction may already be aborted or completed.
      }

      await transactionDone.catch(() => undefined);

      throw error;
    }
  }

  async findById(id: string): Promise<StoredImage | null> {
    const database = await getDatabase();

    const transaction = database.transaction(IMAGE_FILES_STORE, 'readonly');
    const transactionDone = idbTransactionToPromise(transaction);

    try {
      const record = await idbRequestToPromise<ImageFileRecord | undefined>(
        transaction.objectStore(IMAGE_FILES_STORE).get(id),
      );

      await transactionDone;

      if (!record) {
        return null;
      }

      const { blob: _blob, ...image } = record;

      return image;
    } catch (error) {
      await transactionDone.catch(() => undefined);
      throw error;
    }
  }

  async findContentById(id: string): Promise<Blob | null> {
    const database = await getDatabase();

    const transaction = database.transaction(IMAGE_FILES_STORE, 'readonly');
    const transactionDone = idbTransactionToPromise(transaction);

    try {
      const record = await idbRequestToPromise<ImageFileRecord | undefined>(
        transaction.objectStore(IMAGE_FILES_STORE).get(id),
      );

      await transactionDone;

      return record?.blob ?? null;
    } catch (error) {
      await transactionDone.catch(() => undefined);
      throw error;
    }
  }

  async findAll(): Promise<StoredImage[]> {
    const database = await getDatabase();
    const transaction = database.transaction(IMAGE_FILES_STORE, 'readonly');
    const transactionDone = idbTransactionToPromise(transaction);

    try {
      const records = await idbRequestToPromise<ImageFileRecord[]>(
        transaction.objectStore(IMAGE_FILES_STORE).getAll(),
      );

      await transactionDone;

      return records.map(({ blob: _blob, ...image }) => image);
    } catch (error) {
      await transactionDone.catch(() => undefined);
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const database = await getDatabase();

    const transaction = database.transaction(IMAGE_FILES_STORE, 'readwrite');
    const transactionDone = idbTransactionToPromise(transaction);

    try {
      await idbRequestToPromise(transaction.objectStore(IMAGE_FILES_STORE).delete(id));

      await transactionDone;
    } catch (error) {
      try {
        transaction.abort();
      } catch {
        // Transaction may already be aborted or completed.
      }

      await transactionDone.catch(() => undefined);

      throw error;
    }
  }
}
