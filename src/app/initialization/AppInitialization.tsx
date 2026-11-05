import { useEffect, useState, type ReactNode } from 'react';

import type { InitializationState } from './initialization.types';
import { initializeApp } from './initializeApp';
import { LoadingScreen } from './components/LoadingScreen';
import { InitializationError } from './components/InitializationError';

const MIN_LOADING_DURATION_MS = 2000;

interface AppInitializationProps {
  children: ReactNode;
}

export function AppInitialization({ children }: AppInitializationProps) {
  const [state, setState] = useState<InitializationState>({
    status: 'loading',
  });

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isActive = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    setState({ status: 'loading' });

    const minimumLoadingTime = new Promise<void>((resolve) => {
      timeoutId = setTimeout(resolve, MIN_LOADING_DURATION_MS);
    });

    Promise.all([initializeApp(), minimumLoadingTime])
      .then(() => {
        if (isActive) {
          setState({ status: 'ready' });
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          console.error('Application initialization failed:', error);

          setState({
            status: 'error',
            message: 'Unable to prepare the application. Please try again.',
          });
        }
      });

    return () => {
      isActive = false;
      clearTimeout(timeoutId);
    };
  }, [attempt]);

  if (state.status === 'loading') {
    return <LoadingScreen />;
  }

  if (state.status === 'error') {
    return (
      <InitializationError
        message={state.message}
        onRetry={() => setAttempt((current) => current + 1)}
      />
    );
  }

  return <>{children}</>;
}
