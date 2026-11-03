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

describe('getDatabase', () => {
  beforeEach(async () => {
    jest.resetModules();
    await deleteDatabase('lore-atlas');
    await deleteDatabase('invalid-version-test');
  });

  it('should open the database with the current version', async () => {
    const { getDatabase } = await import('./database');

    const database = await getDatabase();

    expect(database.name).toBe('lore-atlas');
    expect(database.version).toBe(2);
    expect(database.objectStoreNames.contains('universes')).toBe(true);
  });

  it('should reuse the same database connection', async () => {
    const { getDatabase } = await import('./database');
    const firstCall = getDatabase();
    const secondCall = getDatabase();

    expect(firstCall).toBe(secondCall);

    const firstDatabase = await firstCall;
    const secondDatabase = await secondCall;

    expect(firstDatabase).toBe(secondDatabase);

    firstDatabase.close();
  });

  it('should reject when database version is invalid', async () => {
    await expect(
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('invalid-version-test', 0);

        request.onsuccess = () => resolve();

        request.onerror = () => reject(request.error);
      }),
    ).rejects.toBeDefined();
  });

  it('should retry opening the database after a failure', async () => {
    const { getDatabase } = await import('./database');
    const originalOpen = indexedDB.open.bind(indexedDB);

    jest.spyOn(indexedDB, 'open').mockImplementationOnce(() => {
      const request = originalOpen('invalid-version-test', 0);
      return request;
    });

    await expect(getDatabase()).rejects.toBeDefined();

    const database = await getDatabase();

    expect(database).toBeInstanceOf(IDBDatabase);

    database.close();
  });

  it('should close the connection when database version changes', async () => {
    const { getDatabase } = await import('./database');

    const database = await getDatabase();

    const closeSpy = jest.spyOn(database, 'close');

    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('lore-atlas', 3);

      request.onupgradeneeded = () => {
        // Nothing to migrate yet.
      };

      request.onsuccess = () => {
        request.result.close();
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it('should migrate an existing version 1 database', async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('lore-atlas', 1);

      request.onsuccess = () => {
        request.result.close();
        resolve();
      };

      request.onerror = () => reject(request.error);
    });

    const { getDatabase } = await import('./database');

    const database = await getDatabase();

    expect(database.version).toBe(2);
    expect(database.objectStoreNames.contains('universes')).toBe(true);
  });
});
