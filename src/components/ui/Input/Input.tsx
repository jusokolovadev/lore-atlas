import { forwardRef, type InputHTMLAttributes } from 'react';
import { Text } from '../Text/Text';
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
        <label htmlFor={inputId}>
          <Text as="span" size="sm" weight="medium">
            {label}
          </Text>
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
        <Text id={`${inputId}-error`} size="xs" color="error">
          {error}
        </Text>
      ) : hint ? (
        <Text id={`${inputId}-hint`} size="xs" color="secondary">
          {hint}
        </Text>
      ) : null}
    </div>
  );
});
