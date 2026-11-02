import type { ComponentPropsWithoutRef } from 'react';
import styles from './Spinner.module.css';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps extends ComponentPropsWithoutRef<'span'> {
  size?: SpinnerSize;
  label?: string;
}

export function Spinner({
  size = 'md',
  label = 'Loading',
  className = '',
  ...props
}: SpinnerProps) {
  return (
    <span
      {...props}
      role="status"
      aria-label={label}
      className={`${styles.spinner} ${styles[size]} ${className}`}
    >
      <span className={styles.circle} aria-hidden="true" />
    </span>
  );
}
