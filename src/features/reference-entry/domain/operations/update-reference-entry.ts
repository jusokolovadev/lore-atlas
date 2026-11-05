import type { ImageReference } from 'src/shared/types/image-reference';
import { areImagesEqual } from 'src/shared/utils/are-images-equal';

import type { ReferenceEntry } from '../models/reference-entry';
import { ReferenceEntryError } from '../errors/reference-entry-error';

export interface UpdateReferenceEntryInput {
  name?: string;
  description?: string | null;
  image?: ImageReference | null;
}

export function updateReferenceEntry(
  entry: ReferenceEntry,
  input: UpdateReferenceEntryInput,
): ReferenceEntry {
  if (entry.deletedAt !== null) {
    throw new ReferenceEntryError(
      'ALREADY_DELETED',
      'Cannot update a deleted reference entry.',
    );
  }

  const name = input.name === undefined ? entry.name : input.name.trim();
  const description =
    input.description === undefined ? entry.description : input.description;
  const image = input.image === undefined ? entry.image : input.image;

  if (!name) {
    throw new ReferenceEntryError(
      'INVALID_NAME',
      'Reference entry name cannot be empty.',
    );
  }

  const hasChanges =
    name !== entry.name ||
    description !== entry.description ||
    !areImagesEqual(image, entry.image);

  if (!hasChanges) {
    return entry;
  }

  return {
    ...entry,
    name,
    description,
    image,
  };
}
