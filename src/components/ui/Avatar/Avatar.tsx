import { useEffect, useState } from 'react';
import { Text } from '../Text/Text';
import styles from './Avatar.module.css';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';
export type AvatarShape = 'circle' | 'square';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  className?: string;
}

function getInitials(name?: string): string {
  if (!name?.trim()) {
    return '?';
  }

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

export function Avatar({
  src,
  alt = '',
  name,
  size = 'md',
  shape = 'circle',
  className = '',
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [src]);

  const showImage = Boolean(src) && !imageError;

  return (
    <div
      className={[styles.avatar, styles[size], styles[shape], className]
        .filter(Boolean)
        .join(' ')}
      role={showImage ? undefined : 'img'}
      aria-label={showImage ? undefined : alt || name || 'Avatar'}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt || name || ''}
          className={styles.image}
          onError={() => setImageError(true)}
        />
      ) : (
        <Text
          as="span"
          size={size === 'sm' ? 'xs' : 'sm'}
          weight="semibold"
          color="secondary"
        >
          {getInitials(name)}
        </Text>
      )}
    </div>
  );
}
