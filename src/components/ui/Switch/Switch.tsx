import { useId, type ComponentPropsWithoutRef } from 'react';
import { Text } from '../Text/Text';
import styles from './Switch.module.css';

export interface SwitchProps extends Omit<ComponentPropsWithoutRef<'input'>, 'type'> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Switch({
  id,
  label,
  hint,
  error,
  className = '',
  'aria-describedby': ariaDescribedBy,
  ...props
}: SwitchProps) {
  const generatedId = useId();
  const switchId = id ?? generatedId;

  const hintId = `${switchId}-hint`;
  const errorId = `${switchId}-error`;

  const describedBy =
    [ariaDescribedBy, hint && !error ? hintId : null, error ? errorId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={switchId}>
        <input
          {...props}
          id={switchId}
          type="checkbox"
          role="switch"
          className={`${styles.input} ${className}`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />

        <span className={styles.track} aria-hidden="true">
          <span className={styles.thumb} />
        </span>

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
