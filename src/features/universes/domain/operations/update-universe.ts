import type { ImageReference } from 'src/shared/types/image-reference';

import { UniverseError } from '../errors/universe-error';
import type { Universe } from '../models/universe';

export interface UpdateUniverseInput {
  name?: string;
  description?: string | null;
  coverImage?: ImageReference | null;
}

function areImagesEqual(
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

export function updateUniverse(universe: Universe, input: UpdateUniverseInput): Universe {
  if (universe.deletedAt !== null) {
    throw new UniverseError('ALREADY_DELETED', 'Cannot update a deleted universe.');
  }

  const updates: {
    name?: string;
    description?: string | null;
    coverImage?: ImageReference | null;
  } = {};

  if (input.name !== undefined) {
    const name = input.name.trim();

    if (!name) {
      throw new UniverseError('INVALID_NAME', 'Universe name cannot be empty.');
    }

    if (name !== universe.name) {
      updates.name = name;
    }
  }

  if (input.description !== undefined && input.description !== universe.description) {
    updates.description = input.description;
  }

  if (
    input.coverImage !== undefined &&
    !areImagesEqual(input.coverImage, universe.coverImage)
  ) {
    updates.coverImage = input.coverImage;
  }

  if (Object.keys(updates).length === 0) {
    return universe;
  }

  return {
    ...universe,
    ...updates,
  };
}
