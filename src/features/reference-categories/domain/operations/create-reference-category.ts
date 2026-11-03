import type { CustomReferenceCategory } from '../models/custom-reference-category';
import { ReferenceCategoryError } from '../errors/reference-category-errors';

export interface CreateReferenceCategoryInput {
  universeId: string;
  name: string;
  description?: string | null;
}

interface CreateReferenceCategoryMetadata {
  id: string;
  now: string;
}

export function createReferenceCategory(
  input: CreateReferenceCategoryInput,
  metadata: CreateReferenceCategoryMetadata,
): CustomReferenceCategory {
  const name = input.name.trim();

  if (!name) {
    throw new ReferenceCategoryError(
      'INVALID_NAME',
      'Reference category name cannot be empty.',
    );
  }

  return {
    id: metadata.id,
    universeId: input.universeId,
    name,
    description: input.description ?? null,
    createdAt: metadata.now,
    updatedAt: metadata.now,
    deletedAt: null,
  };
}
