import type { StandardReferenceCategory } from '../models/standard-reference-category';

import { STANDARD_REFERENCE_CATEGORIES } from './standard-reference-categories';

export function findStandardReferenceCategoryById(
  id: string,
): StandardReferenceCategory | null {
  return STANDARD_REFERENCE_CATEGORIES.find((category) => category.id === id) ?? null;
}

export function getCoreReferenceCategories(): StandardReferenceCategory[] {
  return STANDARD_REFERENCE_CATEGORIES.filter((category) => category.isCore);
}

export function getAllStandardReferenceCategories(): StandardReferenceCategory[] {
  return [...STANDARD_REFERENCE_CATEGORIES];
}
