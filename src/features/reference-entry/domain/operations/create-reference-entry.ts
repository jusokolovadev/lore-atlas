import type { ImageReference } from 'src/shared/types/image-reference';

import type {
  ReferenceEntry,
  ReferenceEntryCategoryType,
} from '../models/reference-entry';
import { ReferenceEntryError } from '../errors/reference-entry-error';

export interface CreateReferenceEntryInput {
  universeId: string;
  categoryType: ReferenceEntryCategoryType;
  categoryId: string;
  name: string;
  description?: string | null;
  image?: ImageReference | null;
}

interface CreateReferenceEntryMetadata {
  id: string;
  now: string;
}

export function createReferenceEntry(
  input: CreateReferenceEntryInput,
  metadata: CreateReferenceEntryMetadata,
): ReferenceEntry {
  const name = input.name.trim();

  if (!name) {
    throw new ReferenceEntryError(
      'INVALID_NAME',
      'Reference entry name cannot be empty.',
    );
  }

  return {
    id: metadata.id,
    universeId: input.universeId,
    categoryType: input.categoryType,
    categoryId: input.categoryId,
    name,
    description: input.description ?? null,
    image: input.image ?? null,
    createdAt: metadata.now,
    updatedAt: metadata.now,
    deletedAt: null,
    revision: 1,
    isSpoiler: false,
  };
}
