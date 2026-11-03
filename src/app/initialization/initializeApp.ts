let shouldFailInitialization = true;
let initializationPromise: Promise<void> | null = null;

export function initializeApp(): Promise<void> {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 2500);
      });

      if (shouldFailInitialization) {
        shouldFailInitialization = false;

        throw new Error('Failed to initialize application');
      }
    })().catch((error: unknown) => {
      initializationPromise = null;
      throw error;
    });
  }

  return initializationPromise;
}
