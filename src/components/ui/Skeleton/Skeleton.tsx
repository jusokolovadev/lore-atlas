import type { ComponentPropsWithoutRef, CSSProperties } from 'react';
import styles from './Skeleton.module.css';

export type SkeletonVariant = 'text' | 'circular' | 'rectangular';

export interface SkeletonProps extends ComponentPropsWithoutRef<'div'> {
  variant?: SkeletonVariant;
  width?: CSSProperties['width'];
  height?: CSSProperties['height'];
  animated?: boolean;
}

export function Skeleton({
  variant = 'text',
  width,
  height,
  animated = true,
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const skeletonStyle: CSSProperties = {
    ...style,
    ...(width !== undefined && { width }),
    ...(height !== undefined && { height }),
  };

  return (
    <div
      {...props}
      aria-hidden="true"
      className={[
        styles.skeleton,
        styles[variant],
        animated && styles.animated,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={skeletonStyle}
    />
  );
}
