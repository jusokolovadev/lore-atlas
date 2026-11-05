import type { ReactNode } from 'react';
import { ThemeProvider } from 'src/features/theme/ThemeProvider';
import { ToastProvider } from 'src/components/ui';
import { AppServicesProvider } from './AppServicesProvider';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AppServicesProvider>
      <ThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </AppServicesProvider>
  );
}
