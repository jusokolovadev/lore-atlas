import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';
import { Heading } from 'src/components/ui/Heading/Heading';
import { Text } from 'src/components/ui/Text/Text';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  description?: string;
}

export function Modal({ open, onClose, title, description, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const items = document.querySelectorAll<HTMLElement>(
          '[data-modal] button, [data-modal] input, [data-modal] textarea, [data-modal] select, [data-modal] a[href]',
        );
        if (!items.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;
  return createPortal(
    <div
      className={styles.backdrop}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        data-modal
      >
        <header className={styles.header}>
          <div className={styles.heading}>
            <Heading id="modal-title">{title}</Heading>
            {description && <Text id="modal-description">{description}</Text>}
          </div>
          <button
            className={styles.close}
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </header>
        <div className={styles.body}>{children}</div>
      </section>
    </div>,
    document.body,
  );
}
