import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import styles from './IconButton.module.css';

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'children'
> {
  icon: ReactNode;
  label: string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

export function IconButton({
  icon,
  label,
  variant = 'ghost',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: IconButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={[styles.button, styles[variant], styles[size], className]
        .filter(Boolean)
        .join(' ')}
      aria-label={label}
      title={props.title ?? label}
    >
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
    </button>
  );
}
