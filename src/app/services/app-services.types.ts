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
import type { createDeleteReferenceEntryUseCase } from 'src/features/reference-entry/application/use-cases/delete-reference-entry';
import type { createCreateReferenceEntryUseCase } from 'src/features/reference-entry/application/use-cases/create-reference-entry';
import type { createUpdateReferenceEntryUseCase } from 'src/features/reference-entry/application/use-cases/update-reference-entry';
import type { createRestoreReferenceEntryUseCase } from 'src/features/reference-entry/application/use-cases/restore-reference-entry';
import type { createCreateRelationshipUseCase } from 'src/features/relationships/application/use-cases/create-relationship';
import type { createUpdateRelationshipUseCase } from 'src/features/relationships/application/use-cases/update-relationship';
import type { createDeleteRelationshipUseCase } from 'src/features/relationships/application/use-cases/delete-relationship';
import type { createRestoreRelationshipUseCase } from 'src/features/relationships/application/use-cases/restore-relationship';
import type { createGetRelationshipByIdUseCase } from 'src/features/relationships/application/use-cases/get-relationship-by-id';
import type { createGetRelationshipsByUniverseIdUseCase } from 'src/features/relationships/application/use-cases/get-relationships-by-universe-id';
import type { createGetRelationshipsByEntityIdUseCase } from 'src/features/relationships/application/use-cases/get-relationships-by-entity-id';
import type { createCreateUniverseEntityUseCase } from 'src/features/entities/application/use-cases/create-universe-entity';
import type { createUpdateUniverseEntityUseCase } from 'src/features/entities/application/use-cases/update-universe-entity';
import type { createDeleteUniverseEntityUseCase } from 'src/features/entities/application/use-cases/delete-universe-entity';
import type { createRestoreUniverseEntityUseCase } from 'src/features/entities/application/use-cases/restore-universe-entity';
import type { createSaveImageUseCase } from 'src/features/media/application/use-cases/save-image';
import type { createGetImageByIdUseCase } from 'src/features/media/application/use-cases/get-image-by-id';
import type { createGetImageContentUseCase } from 'src/features/media/application/use-cases/get-image-content';
import type { createDeleteImageUseCase } from 'src/features/media/application/use-cases/delete-image';
import type { createCleanupUnusedImagesUseCase } from 'src/features/media/application/use-cases/cleanup-unused-images';
import { createExportUniverseUseCase } from 'src/features/import-export/application/use-cases/export-universe';
import { createImportUniverseUseCase } from 'src/features/import-export/application/use-cases/import-universe';
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

  // Reference Entry
  createReferenceEntry: ReturnType<typeof createCreateReferenceEntryUseCase>;
  updateReferenceEntry: ReturnType<typeof createUpdateReferenceEntryUseCase>;
  deleteReferenceEntry: ReturnType<typeof createDeleteReferenceEntryUseCase>;
  restoreReferenceEntry: ReturnType<typeof createRestoreReferenceEntryUseCase>;

  // Universe Entities
  createUniverseEntity: ReturnType<typeof createCreateUniverseEntityUseCase>;
  updateUniverseEntity: ReturnType<typeof createUpdateUniverseEntityUseCase>;
  restoreUniverseEntity: ReturnType<typeof createRestoreUniverseEntityUseCase>;
  deleteUniverseEntity: ReturnType<typeof createDeleteUniverseEntityUseCase>;

  // Relationships
  createRelationship: ReturnType<typeof createCreateRelationshipUseCase>;
  updateRelationship: ReturnType<typeof createUpdateRelationshipUseCase>;
  deleteRelationship: ReturnType<typeof createDeleteRelationshipUseCase>;
  restoreRelationship: ReturnType<typeof createRestoreRelationshipUseCase>;
  getRelationshipById: ReturnType<typeof createGetRelationshipByIdUseCase>;
  getRelationshipsByUniverseId: ReturnType<
    typeof createGetRelationshipsByUniverseIdUseCase
  >;
  getRelationshipsByEntityId: ReturnType<typeof createGetRelationshipsByEntityIdUseCase>;

  // Image Storage
  saveImage: ReturnType<typeof createSaveImageUseCase>;
  getImageById: ReturnType<typeof createGetImageByIdUseCase>;
  getImageContent: ReturnType<typeof createGetImageContentUseCase>;
  deleteImage: ReturnType<typeof createDeleteImageUseCase>;
  cleanupUnusedImages: ReturnType<typeof createCleanupUnusedImagesUseCase>;
  importUniverse: ReturnType<typeof createImportUniverseUseCase>;
  exportUniverse: ReturnType<typeof createExportUniverseUseCase>;
}
