import { getDatabase } from '../database/database';
import { IMAGE_FILES_STORE } from '../database/database.types';
import { idbRequestToPromise } from '../database/idb-request';
import { idbTransactionToPromise } from '../database/idb-transaction';

import { IndexedDbImageStorageRepository } from './indexed-db-image-storage-repository';

import type { ImageFileRecord } from '../image-storage/image-file-record';
import type { StoredImage } from 'src/features/media/domain/models/stored-image';

describe('IndexedDbImageStorageRepository', () => {
  let repository: IndexedDbImageStorageRepository;

  const validateBlob = jest.fn().mockResolvedValue(undefined);

  const blob = new Blob(['image-content'], { type: 'image/png' });

  const image: StoredImage = {
    id: 'image-1',
    mimeType: 'image/png',
    size: blob.size,
    createdAt: '2026-11-06T09:00:00.000Z',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    validateBlob.mockResolvedValue(undefined);

    repository = new IndexedDbImageStorageRepository(validateBlob);

    const database = await getDatabase();
    const transaction = database.transaction(IMAGE_FILES_STORE, 'readwrite');

    transaction.objectStore(IMAGE_FILES_STORE).clear();

    await idbTransactionToPromise(transaction);
  });

  async function findRecord(id: string): Promise<ImageFileRecord | undefined> {
    const database = await getDatabase();
    const transaction = database.transaction(IMAGE_FILES_STORE, 'readonly');

    const result = await idbRequestToPromise<ImageFileRecord | undefined>(
      transaction.objectStore(IMAGE_FILES_STORE).get(id),
    );

    await idbTransactionToPromise(transaction);

    return result;
  }

  it('saves image metadata and blob', async () => {
    await repository.save(image, blob);

    await expect(findRecord(image.id)).resolves.toEqual({
      ...image,
      blob,
    });

    expect(validateBlob).toHaveBeenCalledWith(blob);
  });

  it('validates blob before saving', async () => {
    validateBlob.mockRejectedValueOnce(new Error('Invalid image'));

    await expect(repository.save(image, blob)).rejects.toThrow('Invalid image');

    await expect(findRecord(image.id)).resolves.toBeUndefined();
  });

  it('returns image metadata without blob', async () => {
    await repository.save(image, blob);

    await expect(repository.findById(image.id)).resolves.toEqual(image);
  });

  it('returns null when image metadata does not exist', async () => {
    await expect(repository.findById('missing-image')).resolves.toBeNull();
  });

  it('returns image blob', async () => {
    await repository.save(image, blob);

    const result = await repository.findContentById(image.id);

    expect(result).toBeInstanceOf(Blob);
    expect(result?.type).toBe(blob.type);
    expect(result?.size).toBe(blob.size);
  });

  it('returns null when image content does not exist', async () => {
    await expect(repository.findContentById('missing-image')).resolves.toBeNull();
  });

  it('deletes image metadata and blob', async () => {
    await repository.save(image, blob);

    await repository.delete(image.id);

    await expect(findRecord(image.id)).resolves.toBeUndefined();
  });

  it('does not fail when deleting a non-existent image', async () => {
    await expect(repository.delete('missing-image')).resolves.toBeUndefined();
  });

  it('overwrites an image with the same ID', async () => {
    await repository.save(image, blob);

    const updatedImage: StoredImage = {
      ...image,
      mimeType: 'image/png',
      size: 5,
    };

    const updatedBlob = new Blob(['other'], { type: 'image/png' });

    await repository.save(updatedImage, updatedBlob);

    await expect(findRecord(image.id)).resolves.toEqual({
      ...updatedImage,
      blob: updatedBlob,
    });
  });

  it('returns all stored image metadata without blobs', async () => {
    const secondImage: StoredImage = {
      id: 'image-2',
      mimeType: 'image/jpeg',
      size: 2048,
      createdAt: '2026-01-02T00:00:00.000Z',
    };

    const secondBlob = new Blob(['second-image'], {
      type: 'image/jpeg',
    });

    await repository.save(image, blob);
    await repository.save(secondImage, secondBlob);

    const result = await repository.findAll();

    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining([image, secondImage]));

    for (const item of result) {
      expect(item).not.toHaveProperty('blob');
    }
  });

  it('returns an empty array when no images are stored', async () => {
    const result = await repository.findAll();

    expect(result).toEqual([]);
  });
});
