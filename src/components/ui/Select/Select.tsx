import { useId, type ComponentPropsWithoutRef } from 'react';
import { Text } from '../Text/Text';
import styles from './Select.module.css';

export interface SelectProps extends ComponentPropsWithoutRef<'select'> {
  label?: string;
  hint?: string;
  error?: string;
  placeholder?: string;
}

export function Select({
  id,
  label,
  hint,
  error,
  placeholder,
  className = '',
  children,
  'aria-describedby': ariaDescribedBy,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  const hintId = `${selectId}-hint`;
  const errorId = `${selectId}-error`;

  const describedBy =
    [ariaDescribedBy, hint && !error ? hintId : null, error ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={selectId}>
          <Text as="span" size="sm" color="primary">
            {label}
          </Text>
        </label>
      )}

      <div className={styles.selectWrapper}>
        <select
          {...props}
          id={selectId}
          className={`${styles.select} ${error ? styles.invalid : ''} ${className}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        >
          {placeholder && (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          )}

          {children}
        </select>
      </div>

      {error ? (
        <Text id={errorId} size="xs" color="error">
          {error}
        </Text>
      ) : hint ? (
        <Text id={hintId} size="xs" color="secondary">
          {hint}
        </Text>
      ) : null}
    </div>
  );
}
