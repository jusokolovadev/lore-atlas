import { createContext, useContext, useState, type ReactNode } from 'react';

import { createAppServices } from '../services/create-app-services';
import type { AppServices } from '../services/app-services.types';

const AppServicesContext = createContext<AppServices | null>(null);

interface AppServicesProviderProps {
  children: ReactNode;
}

export function AppServicesProvider({ children }: AppServicesProviderProps) {
  const [services] = useState(() => createAppServices());

  return (
    <AppServicesContext.Provider value={services}>{children}</AppServicesContext.Provider>
  );
}

export function useAppServices(): AppServices {
  const services = useContext(AppServicesContext);

  if (!services) {
    throw new Error('useAppServices must be used within AppServicesProvider.');
  }

  return services;
}
