import type { ImageReference } from 'src/shared/types/image-reference';
import { getCoreReferenceCategories } from 'src/features/reference-categories/domain/catalog/standard-reference-category-catalog';

import { UniverseError } from '../errors/universe-error';
import type { Universe } from '../models/universe';

export interface CreateUniverseInput {
  name: string;
  description?: string | null;
  coverImage?: ImageReference | null;
}

export interface CreateUniverseMetadata {
  id: string;
  now: string;
}

export function createUniverse(
  input: CreateUniverseInput,
  metadata: CreateUniverseMetadata,
): Universe {
  const name = input.name.trim();

  if (!name) {
    throw new UniverseError('INVALID_NAME', 'Universe name cannot be empty.');
  }

  return {
    id: metadata.id,
    name,
    description: input.description ?? null,
    coverImage: input.coverImage ?? null,
    createdAt: metadata.now,
    updatedAt: metadata.now,
    deletedAt: null,
    revision: 1,
    enabledStandardCategoryIds: getCoreReferenceCategories().map(
      (category) => category.id,
    ),
  };
}
