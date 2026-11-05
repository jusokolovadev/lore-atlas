import type { ReferenceEntry } from '../models/reference-entry';
import { ReferenceEntryError } from '../errors/reference-entry-error';

export function restoreReferenceEntry(entry: ReferenceEntry): ReferenceEntry {
  if (entry.deletedAt === null) {
    throw new ReferenceEntryError('NOT_DELETED', 'Reference entry has not been deleted.');
  }

  return {
    ...entry,
    deletedAt: null,
  };
}
