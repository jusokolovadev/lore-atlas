import { AppRouter } from 'src/app/router/AppRouter.tsx';
import { ToastProvider } from 'src/components/ui/Toast/Toast';

export function App() {
  return (
    <ToastProvider>
      <AppRouter />
    </ToastProvider>
  );
}
