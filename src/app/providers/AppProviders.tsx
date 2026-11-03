import type { ReactNode } from 'react';
import { ThemeProvider } from 'src/features/theme/ThemeProvider';
import { ToastProvider } from 'src/components/ui';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
