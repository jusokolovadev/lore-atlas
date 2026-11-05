import type { StandardReferenceCategoryProfile } from '../models/standard-reference-category-profile';

import { STANDARD_REFERENCE_CATEGORY_PROFILES } from './standard-reference-category-profiles';

export function findStandardReferenceCategoryProfileById(
  id: string,
): StandardReferenceCategoryProfile | null {
  return (
    STANDARD_REFERENCE_CATEGORY_PROFILES.find((profile) => profile.id === id) ?? null
  );
}

export function getAllStandardReferenceCategoryProfiles(): StandardReferenceCategoryProfile[] {
  return [...STANDARD_REFERENCE_CATEGORY_PROFILES];
}
