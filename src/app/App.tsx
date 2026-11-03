import { AppRouter } from './router/AppRouter';
import { AppInitialization } from './initialization/AppInitialization';

export function App() {
  return (
    <AppInitialization>
      <AppRouter />
    </AppInitialization>
  );
}
