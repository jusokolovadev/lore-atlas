import { useId, type ComponentPropsWithoutRef } from 'react';
import { Text } from '../Text/Text';
import styles from './Checkbox.module.css';

export interface CheckboxProps extends Omit<ComponentPropsWithoutRef<'input'>, 'type'> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Checkbox({
  id,
  label,
  hint,
  error,
  className = '',
  'aria-describedby': ariaDescribedBy,
  ...props
}: CheckboxProps) {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  const hintId = `${checkboxId}-hint`;
  const errorId = `${checkboxId}-error`;

  const describedBy =
    [ariaDescribedBy, hint && !error ? hintId : null, error ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={checkboxId}>
        <input
          {...props}
          id={checkboxId}
          type="checkbox"
          className={`${styles.checkbox} ${className}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />

        {label && (
          <Text as="span" size="sm" color="primary">
            {label}
          </Text>
        )}
      </label>

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
