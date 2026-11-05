import type { StandardReferenceCategory } from '../../domain/models/standard-reference-category';
import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';

export type ReferenceCategoryResult =
  | {
      type: 'standard';
      category: StandardReferenceCategory;
    }
  | {
      type: 'custom';
      category: CustomReferenceCategory;
    };
