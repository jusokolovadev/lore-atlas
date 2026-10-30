import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';
interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
  duration: number;
}
interface ToastContextValue {
  notify: (message: string, type?: ToastType, duration?: number) => void;
}
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const notify = useCallback(
    (message: string, type: ToastType = 'info', duration = 4000) => {
      const id = Date.now() + Math.random();
      setItems((current) => [...current, { id, message, type, duration }]);
    },
    [],
  );
  const dismiss = (id: number) =>
    setItems((current) => current.filter((item) => item.id !== id));
  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className={styles.viewport} aria-live="polite" aria-atomic="false">
        {items.map((item) => (
          <ToastMessage key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastMessage({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    if (item.duration <= 0) return;
    const timer = window.setTimeout(() => onDismiss(item.id), item.duration);
    return () => window.clearTimeout(timer);
  }, [item, onDismiss]);
  return (
    <div
      className={`${styles.toast} ${styles[item.type]}`}
      role={item.type === 'error' ? 'alert' : 'status'}
    >
      <span>{item.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
