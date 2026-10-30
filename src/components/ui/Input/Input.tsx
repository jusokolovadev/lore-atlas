import { forwardRef, type InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, hint, error, className = '', ...props },
  ref,
) {
  const inputId =
    id ??
    (label ? `input-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined);
  const describedBy =
    [hint && !error ? `${inputId}-hint` : null, error ? `${inputId}-error` : null]
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={inputId}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`${styles.input} ${error ? styles.invalid : ''} ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        {...props}
      />
      {error ? (
        <span className={styles.error} id={`${inputId}-error`}>
          {error}
        </span>
      ) : hint ? (
        <span className={styles.hint} id={`${inputId}-hint`}>
          {hint}
        </span>
      ) : null}
    </div>
  );
});
