import type { HTMLAttributes, ElementType } from 'react';
import styles from './Text.module.css';

export type TextSize = 'xs' | 'sm' | 'md' | 'lg';
export type TextWeight = 'normal' | 'medium' | 'semibold' | 'bold';
export type TextColor =
  'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  size?: TextSize;
  weight?: TextWeight;
  color?: TextColor;
  align?: 'left' | 'center' | 'right';
  truncate?: boolean;
}

export function Text({
  as: Component = 'p',
  size = 'md',
  weight = 'normal',
  color = 'primary',
  align = 'left',
  truncate = false,
  className = '',
  ...props
}: TextProps) {
  return (
    <Component
      className={[
        styles.text,
        styles[size],
        styles[weight],
        styles[color],
        styles[align],
        truncate ? styles.truncate : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}
