import type { Universe } from 'src/features/universes/domain/models/universe';
import type { CustomReferenceCategory } from 'src/features/reference-categories/domain/models/custom-reference-category';

export interface UniverseDeletionRepository {
  deleteUniverseWithCategories(
    universe: Universe,
    categories: CustomReferenceCategory[],
  ): Promise<void>;
}
