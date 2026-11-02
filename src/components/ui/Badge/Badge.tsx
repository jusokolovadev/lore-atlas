import type { HTMLAttributes, ReactNode } from 'react';
import { Text } from '../Text/Text';
import styles from './Badge.module.css';

export type BadgeVariant =
  'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}: BadgeProps) {
  return (
    <span
      {...props}
      className={[styles.badge, styles[variant], styles[size], className]
        .filter(Boolean)
        .join(' ')}
    >
      {dot && <span className={styles.dot} aria-hidden="true" />}

      <Text as="span" size="xs" weight="medium">
        {children}
      </Text>
    </span>
  );
}
