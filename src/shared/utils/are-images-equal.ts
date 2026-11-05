import type { ImageReference } from '../types';

export function areImagesEqual(
  first: ImageReference | null,
  second: ImageReference | null,
): boolean {
  if (first === second) {
    return true;
  }

  if (first === null || second === null) {
    return false;
  }

  if (first.type !== second.type) {
    return false;
  }

  if (first.type === 'url' && second.type === 'url') {
    return first.url === second.url;
  }

  if (first.type === 'file' && second.type === 'file') {
    return first.fileId === second.fileId;
  }

  return false;
}
