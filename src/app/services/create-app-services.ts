import { createCreateUniverseUseCase } from 'src/features/universes/application/use-cases/create-universe';
import { createUpdateUniverseUseCase } from 'src/features/universes/application/use-cases/update-universe';
import { createDeleteUniverseUseCase } from 'src/features/universes/application/use-cases/delete-universe';
import { createRestoreUniverseUseCase } from 'src/features/universes/application/use-cases/restore-universe';
import { createGetUniverseByIdUseCase } from 'src/features/universes/application/use-cases/get-universe-by-id';
import { createGetActiveUniversesUseCase } from 'src/features/universes/application/use-cases/get-active-universes';

import { createCreateReferenceCategoryUseCase } from 'src/features/reference-categories/application/use-cases/create-reference-category';
import { createUpdateReferenceCategoryUseCase } from 'src/features/reference-categories/application/use-cases/update-reference-category';
import { createDeleteReferenceCategoryUseCase } from 'src/features/reference-categories/application/use-cases/delete-reference-category';
import { createRestoreReferenceCategoryUseCase } from 'src/features/reference-categories/application/use-cases/restore-reference-category';
import { createGetReferenceCategoryByIdUseCase } from 'src/features/reference-categories/application/use-cases/get-reference-category-by-id';
import { createGetReferenceCategoriesByUniverseIdUseCase } from 'src/features/reference-categories/application/use-cases/get-reference-categories-by-universe-id';

import type { UniverseRepository } from 'src/features/universes/application/repositories/universe-repository';
import type { ReferenceCategoryRepository } from 'src/features/reference-categories/application/repositories/reference-category-repository';
import type { UniverseDeletionRepository } from 'src/features/universes/application/repositories/universe-deletion-repository';

import { IndexedDbUniverseRepository } from 'src/infrastructure/persistence/repositories/indexed-db-universe-repository';
import { IndexedDbReferenceCategoryRepository } from 'src/infrastructure/persistence/repositories/indexed-db-reference-category-repository';
import { IndexedDbUniverseDeletionRepository } from 'src/infrastructure/persistence/repositories/indexed-db-universe-deletion-repository';

import type { AppServices } from './app-services.types';

export interface CreateAppServicesDependencies {
  universeRepository?: UniverseRepository;
  referenceCategoryRepository?: ReferenceCategoryRepository;
  universeDeletionRepository?: UniverseDeletionRepository;
  generateId?: () => string;
  getCurrentTime?: () => string;
}

export function createAppServices(
  dependencies: CreateAppServicesDependencies = {},
): AppServices {
  const universeRepository =
    dependencies.universeRepository ?? new IndexedDbUniverseRepository();

  const referenceCategoryRepository =
    dependencies.referenceCategoryRepository ??
    new IndexedDbReferenceCategoryRepository();

  const universeDeletionRepository =
    dependencies.universeDeletionRepository ?? new IndexedDbUniverseDeletionRepository();

  const generateId = dependencies.generateId ?? (() => crypto.randomUUID());

  const getCurrentTime = dependencies.getCurrentTime ?? (() => new Date().toISOString());

  return {
    // Universes
    createUniverse: createCreateUniverseUseCase({
      repository: universeRepository,
      generateId,
      getCurrentTime,
    }),

    updateUniverse: createUpdateUniverseUseCase({
      repository: universeRepository,
      getCurrentTime,
    }),

    deleteUniverse: createDeleteUniverseUseCase({
      repository: universeRepository,
      referenceCategoryRepository,
      deletionRepository: universeDeletionRepository,
      getCurrentTime,
    }),

    restoreUniverse: createRestoreUniverseUseCase({
      repository: universeRepository,
      getCurrentTime,
    }),

    getUniverseById: createGetUniverseByIdUseCase({
      repository: universeRepository,
    }),

    getActiveUniverses: createGetActiveUniversesUseCase({
      repository: universeRepository,
    }),

    // Reference Categories
    createReferenceCategory: createCreateReferenceCategoryUseCase({
      referenceCategoryRepository,
      generateId,
      getCurrentTime,
    }),

    updateReferenceCategory: createUpdateReferenceCategoryUseCase({
      referenceCategoryRepository,
      getCurrentTime,
    }),

    deleteReferenceCategory: createDeleteReferenceCategoryUseCase({
      referenceCategoryRepository,
      getCurrentTime,
    }),

    restoreReferenceCategory: createRestoreReferenceCategoryUseCase({
      referenceCategoryRepository,
      getCurrentTime,
    }),

    getReferenceCategoryById: createGetReferenceCategoryByIdUseCase({
      referenceCategoryRepository,
    }),

    getReferenceCategoriesByUniverseId: createGetReferenceCategoriesByUniverseIdUseCase({
      referenceCategoryRepository,
    }),
  };
}
