import type { ReferenceEntry } from '../models/reference-entry';
import { ReferenceEntryError } from '../errors/reference-entry-error';

export function deleteReferenceEntry(
  entry: ReferenceEntry,
  deletedAt: string,
): ReferenceEntry {
  if (entry.deletedAt !== null) {
    throw new ReferenceEntryError(
      'ALREADY_DELETED',
      'Reference entry has already been deleted.',
    );
  }

  return {
    ...entry,
    deletedAt,
  };
}
