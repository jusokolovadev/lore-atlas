import type { StandardReferenceEntry } from '../models/standard-reference-entry';

import { STANDARD_REFERENCE_ENTRIES } from './standard-reference-entries';

export function findStandardReferenceEntryById(
  categoryId: string,
  id: string,
): StandardReferenceEntry | null {
  return STANDARD_REFERENCE_ENTRIES[categoryId]?.find((entry) => entry.id === id) ?? null;
}

export function getStandardReferenceEntriesByCategoryId(
  categoryId: string,
): StandardReferenceEntry[] {
  return [...(STANDARD_REFERENCE_ENTRIES[categoryId] ?? [])];
}

export function getAllStandardReferenceEntries(): StandardReferenceEntry[] {
  return Object.values(STANDARD_REFERENCE_ENTRIES).flat();
}
