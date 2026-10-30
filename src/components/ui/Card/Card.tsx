import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  interactive?: boolean;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  interactive = false,
  padding = 'md',
  className = '',
  ...props
}: CardProps) {
  return (
    <section
      className={`${styles.card} ${styles[padding]} ${interactive ? styles.interactive : ''} ${className}`}
      {...props}
    >
      {children}
    </section>
  );
}
