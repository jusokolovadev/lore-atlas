describe('initializeApp', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the same Promise when called multiple times', async () => {
    const { initializeApp } = await import('./initializeApp');

    const firstCall = initializeApp();
    const secondCall = initializeApp();

    expect(firstCall).toBe(secondCall);

    const result = expect(firstCall).rejects.toThrow('Failed to initialize application');

    await jest.advanceTimersByTimeAsync(2500);
    await result;
  });

  it('resets the Promise after a failed initialization', async () => {
    const { initializeApp } = await import('./initializeApp');

    const firstAttempt = initializeApp();

    const firstResult = expect(firstAttempt).rejects.toThrow(
      'Failed to initialize application',
    );

    await jest.advanceTimersByTimeAsync(2500);
    await firstResult;

    const secondAttempt = initializeApp();

    expect(secondAttempt).not.toBe(firstAttempt);

    await jest.advanceTimersByTimeAsync(2500);

    await expect(secondAttempt).resolves.toBeUndefined();
  });

  it('caches the Promise after successful initialization', async () => {
    const { initializeApp } = await import('./initializeApp');

    // The first attempt fails in our temporary simulation.
    const firstAttempt = initializeApp();
    const firstResult = expect(firstAttempt).rejects.toThrow();

    await jest.advanceTimersByTimeAsync(2500);
    await firstResult;

    // The second attempt succeeds.
    const successfulAttempt = initializeApp();

    let isResolved = false;

    successfulAttempt.then(() => {
      isResolved = true;
    });

    await jest.advanceTimersByTimeAsync(2499);
    expect(isResolved).toBe(false);

    await jest.advanceTimersByTimeAsync(1);
    await successfulAttempt;

    expect(isResolved).toBe(true);

    // Further calls return the cached Promise.
    expect(initializeApp()).toBe(successfulAttempt);
  });
});
