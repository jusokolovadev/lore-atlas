import type { ComponentPropsWithoutRef } from 'react';
import styles from './Separator.module.css';

export type SeparatorOrientation = 'horizontal' | 'vertical';

export interface SeparatorProps extends Omit<
  ComponentPropsWithoutRef<'div'>,
  'role' | 'aria-orientation'
> {
  orientation?: SeparatorOrientation;
}

export function Separator({
  orientation = 'horizontal',
  className = '',
  ...props
}: SeparatorProps) {
  return (
    <div
      {...props}
      role="separator"
      aria-orientation={orientation}
      className={`${styles.separator} ${styles[orientation]} ${className}`}
    />
  );
}
