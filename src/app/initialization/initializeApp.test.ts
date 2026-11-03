jest.mock('src/infrastructure/persistence/database/database', () => ({
  getDatabase: jest.fn(),
}));

describe('initializeApp', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('should initialize the database', async () => {
    const { getDatabase } =
      await import('src/infrastructure/persistence/database/database');

    const { initializeApp } = await import('./initializeApp');

    jest.mocked(getDatabase).mockResolvedValue({} as IDBDatabase);

    await expect(initializeApp()).resolves.toBeUndefined();

    expect(getDatabase).toHaveBeenCalledTimes(1);
  });

  it('should reuse the initialization promise', async () => {
    const { getDatabase } =
      await import('src/infrastructure/persistence/database/database');

    const { initializeApp } = await import('./initializeApp');

    jest.mocked(getDatabase).mockResolvedValue({} as IDBDatabase);

    const firstPromise = initializeApp();
    const secondPromise = initializeApp();

    expect(firstPromise).toBe(secondPromise);
    expect(getDatabase).toHaveBeenCalledTimes(1);

    await firstPromise;
  });

  it('should allow retry after initialization failure', async () => {
    const { getDatabase } =
      await import('src/infrastructure/persistence/database/database');

    const { initializeApp } = await import('./initializeApp');

    jest
      .mocked(getDatabase)
      .mockRejectedValueOnce(new Error('Database error'))
      .mockResolvedValueOnce({} as IDBDatabase);

    await expect(initializeApp()).rejects.toThrow('Database error');

    await expect(initializeApp()).resolves.toBeUndefined();

    expect(getDatabase).toHaveBeenCalledTimes(2);
  });
});
