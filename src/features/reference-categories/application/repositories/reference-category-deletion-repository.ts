import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';

export interface ReferenceCategoryDeletionRepository {
  deleteReferenceCategory(
    category: CustomReferenceCategory,
    expectedRevision: number,
  ): Promise<void>;
}
