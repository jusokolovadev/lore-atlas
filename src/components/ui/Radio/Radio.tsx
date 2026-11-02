import { useId, type ComponentPropsWithoutRef } from 'react';
import { Text } from '../Text/Text';
import styles from './Radio.module.css';

export interface RadioProps extends Omit<ComponentPropsWithoutRef<'input'>, 'type'> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Radio({
  id,
  label,
  hint,
  error,
  className = '',
  'aria-describedby': ariaDescribedBy,
  ...props
}: RadioProps) {
  const generatedId = useId();
  const radioId = id ?? generatedId;

  const hintId = `${radioId}-hint`;
  const errorId = `${radioId}-error`;

  const describedBy =
    [ariaDescribedBy, hint && !error ? hintId : null, error ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={radioId}>
        <input
          {...props}
          id={radioId}
          type="radio"
          className={`${styles.radio} ${className}`}
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
