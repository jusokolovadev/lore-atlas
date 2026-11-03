import type { createCreateUniverseUseCase } from 'src/features/universes/application/use-cases/create-universe';
import type { createUpdateUniverseUseCase } from 'src/features/universes/application/use-cases/update-universe';
import type { createDeleteUniverseUseCase } from 'src/features/universes/application/use-cases/delete-universe';
import type { createRestoreUniverseUseCase } from 'src/features/universes/application/use-cases/restore-universe';
import type { createGetUniverseByIdUseCase } from 'src/features/universes/application/use-cases/get-universe-by-id';
import type { createGetActiveUniversesUseCase } from 'src/features/universes/application/use-cases/get-active-universes';
import type { createRestoreReferenceCategoryUseCase } from 'src/features/reference-categories/application/use-cases/restore-reference-category';
import type { createCreateReferenceCategoryUseCase } from 'src/features/reference-categories/application/use-cases/create-reference-category';
import type { createGetReferenceCategoryByIdUseCase } from 'src/features/reference-categories/application/use-cases/get-reference-category-by-id';
import type { createGetReferenceCategoriesByUniverseIdUseCase } from 'src/features/reference-categories/application/use-cases/get-reference-categories-by-universe-id';
import type { createUpdateReferenceCategoryUseCase } from 'src/features/reference-categories/application/use-cases/update-reference-category';
import type { createDeleteReferenceCategoryUseCase } from 'src/features/reference-categories/application/use-cases/delete-reference-category';

export interface AppServices {
  // Universe
  createUniverse: ReturnType<typeof createCreateUniverseUseCase>;
  updateUniverse: ReturnType<typeof createUpdateUniverseUseCase>;
  deleteUniverse: ReturnType<typeof createDeleteUniverseUseCase>;
  restoreUniverse: ReturnType<typeof createRestoreUniverseUseCase>;
  getUniverseById: ReturnType<typeof createGetUniverseByIdUseCase>;
  getActiveUniverses: ReturnType<typeof createGetActiveUniversesUseCase>;

  // Reference Category
  createReferenceCategory: ReturnType<typeof createCreateReferenceCategoryUseCase>;
  updateReferenceCategory: ReturnType<typeof createUpdateReferenceCategoryUseCase>;
  deleteReferenceCategory: ReturnType<typeof createDeleteReferenceCategoryUseCase>;
  restoreReferenceCategory: ReturnType<typeof createRestoreReferenceCategoryUseCase>;
  getReferenceCategoryById: ReturnType<typeof createGetReferenceCategoryByIdUseCase>;
  getReferenceCategoriesByUniverseId: ReturnType<
    typeof createGetReferenceCategoriesByUniverseIdUseCase
  >;
}
