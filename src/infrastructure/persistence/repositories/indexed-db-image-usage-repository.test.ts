import type { ImageReference } from 'src/shared/types/image-reference';

import {
  UNIVERSES_STORE,
  REFERENCE_ENTRIES_STORE,
  UNIVERSE_ENTITIES_STORE,
} from '../database/database.types';

import { getDatabase, closeDatabase } from '../database/database';
import { idbRequestToPromise } from '../database/idb-request';
import { idbTransactionToPromise } from '../database/idb-transaction';

import { IndexedDbImageUsageRepository } from './indexed-db-image-usage-repository';

describe('IndexedDbImageUsageRepository', () => {
  let repository: IndexedDbImageUsageRepository;

  beforeEach(async () => {
    repository = new IndexedDbImageUsageRepository();

    const database = await getDatabase();
    const transaction = database.transaction(
      [UNIVERSES_STORE, REFERENCE_ENTRIES_STORE, UNIVERSE_ENTITIES_STORE],
      'readwrite',
    );

    const transactionDone = idbTransactionToPromise(transaction);

    transaction.objectStore(UNIVERSES_STORE).clear();
    transaction.objectStore(REFERENCE_ENTRIES_STORE).clear();
    transaction.objectStore(UNIVERSE_ENTITIES_STORE).clear();

    await transactionDone;
  });

  afterAll(async () => {
    await closeDatabase();
  });

  async function putRecord(
    storeName: string,
    record: {
      id: string;
      image?: ImageReference | null;
      coverImage?: ImageReference | null;
    },
  ): Promise<void> {
    const database = await getDatabase();
    const transaction = database.transaction(storeName, 'readwrite');
    const transactionDone = idbTransactionToPromise(transaction);

    await idbRequestToPromise(transaction.objectStore(storeName).put(record));
    await transactionDone;
  }

  it('returns image IDs referenced by universes, entries and entities', async () => {
    await putRecord(UNIVERSES_STORE, {
      id: 'universe-1',
      coverImage: { type: 'file', fileId: 'image-1' },
    });

    await putRecord(REFERENCE_ENTRIES_STORE, {
      id: 'entry-1',
      image: { type: 'file', fileId: 'image-2' },
    });

    await putRecord(UNIVERSE_ENTITIES_STORE, {
      id: 'entity-1',
      image: { type: 'file', fileId: 'image-3' },
    });

    const result = await repository.findAllReferencedImageIds();

    expect(result).toEqual(expect.arrayContaining(['image-1', 'image-2', 'image-3']));
    expect(result).toHaveLength(3);
  });

  it('includes references from soft-deleted records', async () => {
    await putRecord(UNIVERSE_ENTITIES_STORE, {
      id: 'entity-1',
      image: { type: 'file', fileId: 'image-1' },
    });

    // The repository intentionally does not filter by deletedAt.
    const database = await getDatabase();
    const transaction = database.transaction(UNIVERSE_ENTITIES_STORE, 'readwrite');
    const transactionDone = idbTransactionToPromise(transaction);

    await idbRequestToPromise(
      transaction.objectStore(UNIVERSE_ENTITIES_STORE).put({
        id: 'entity-1',
        image: { type: 'file', fileId: 'image-1' },
        deletedAt: '2026-01-01T00:00:00.000Z',
      }),
    );

    await transactionDone;

    await expect(repository.findAllReferencedImageIds()).resolves.toContain('image-1');
  });

  it('ignores external URLs and null image references', async () => {
    await putRecord(UNIVERSES_STORE, {
      id: 'universe-1',
      coverImage: { type: 'url', url: 'https://example.com/image.png' },
    });

    await putRecord(REFERENCE_ENTRIES_STORE, {
      id: 'entry-1',
      image: null,
    });

    const result = await repository.findAllReferencedImageIds();

    expect(result).toEqual([]);
  });

  it('returns unique image IDs when an image is referenced more than once', async () => {
    await putRecord(UNIVERSES_STORE, {
      id: 'universe-1',
      coverImage: { type: 'file', fileId: 'image-1' },
    });

    await putRecord(UNIVERSE_ENTITIES_STORE, {
      id: 'entity-1',
      image: { type: 'file', fileId: 'image-1' },
    });

    const result = await repository.findAllReferencedImageIds();

    expect(result).toEqual(['image-1']);
  });

  it('returns an empty array when there are no image references', async () => {
    const result = await repository.findAllReferencedImageIds();

    expect(result).toEqual([]);
  });
});
