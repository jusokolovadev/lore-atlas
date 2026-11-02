import type { HTMLAttributes } from 'react';
import styles from './Heading.module.css';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  size?: HeadingSize;
  weight?: 'medium' | 'semibold' | 'bold';
  color?: 'primary' | 'secondary' | 'tertiary';
  align?: 'left' | 'center' | 'right';
}

export function Heading({
  level = 2,
  size = 'xl',
  weight = 'semibold',
  color = 'primary',
  align = 'left',
  className = '',
  ...props
}: HeadingProps) {
  const Component = `h${level}` as const;

  return (
    <Component
      className={[
        styles.heading,
        styles[size],
        styles[weight],
        styles[color],
        styles[align],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}
