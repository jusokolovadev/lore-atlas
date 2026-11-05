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

import { createDeleteReferenceEntryUseCase } from 'src/features/reference-entry/application/use-cases/delete-reference-entry';
import { createCreateReferenceEntryUseCase } from 'src/features/reference-entry/application/use-cases/create-reference-entry';
import { createUpdateReferenceEntryUseCase } from 'src/features/reference-entry/application/use-cases/update-reference-entry';
import { createRestoreReferenceEntryUseCase } from 'src/features/reference-entry/application/use-cases/restore-reference-entry';

import type { UniverseRepository } from 'src/features/universes/application/repositories/universe-repository';
import type { ReferenceCategoryRepository } from 'src/features/reference-categories/application/repositories/reference-category-repository';
import type { UniverseDeletionRepository } from 'src/features/universes/application/repositories/universe-deletion-repository';
import type { ReferenceEntryRepository } from 'src/features/reference-entry/application/repositories/reference-entry-repository';
import type { ReferenceEntryDeletionRepository } from 'src/features/reference-entry/application/repositories/reference-entry-deletion-repository';

import { IndexedDbUniverseRepository } from 'src/infrastructure/persistence/repositories/indexed-db-universe-repository';
import { IndexedDbReferenceCategoryRepository } from 'src/infrastructure/persistence/repositories/indexed-db-reference-category-repository';
import { IndexedDbUniverseDeletionRepository } from 'src/infrastructure/persistence/repositories/indexed-db-universe-deletion-repository';
import { IndexedDbReferenceEntryRepository } from 'src/infrastructure/persistence/repositories/indexed-db-reference-entry-repository';
import { IndexedDbReferenceEntryDeletionRepository } from 'src/infrastructure/persistence/repositories/indexed-db-reference-entry-deletion-repository';

import type { AppServices } from './app-services.types';
import type { ReferenceCategoryDeletionRepository } from 'src/features/reference-categories/application/repositories/reference-category-deletion-repository';
import { IndexedDbReferenceCategoryDeletionRepository } from 'src/infrastructure/persistence/repositories/indexed-db-reference-category-deletion-repository';

import { createCreateUniverseEntityUseCase } from 'src/features/entities/application/use-cases/create-universe-entity';
import { createUpdateUniverseEntityUseCase } from 'src/features/entities/application/use-cases/update-universe-entity';
import { createDeleteUniverseEntityUseCase } from 'src/features/entities/application/use-cases/delete-universe-entity';

import type { UniverseEntityRepository } from 'src/features/entities/application/repositories/universe-entity-repository';
import type { EntityDeletionRepository } from 'src/features/entities/application/repositories/entity-deletion-repository';

import { IndexedDbEntityDeletionRepository } from 'src/infrastructure/persistence/repositories/indexed-db-entity-deletion-repository';
import { createRestoreUniverseEntityUseCase } from 'src/features/entities/application/use-cases/restore-universe-entity';
import { IndexedDbUniverseEntityRepository } from 'src/infrastructure/persistence/repositories/indexed-db-universe-entity-repository';

export interface CreateAppServicesDependencies {
  universeRepository?: UniverseRepository;
  referenceCategoryRepository?: ReferenceCategoryRepository;
  universeDeletionRepository?: UniverseDeletionRepository;
  referenceEntryRepository?: ReferenceEntryRepository;
  referenceEntryDeletionRepository?: ReferenceEntryDeletionRepository;
  referenceCategoryDeletionRepository?: ReferenceCategoryDeletionRepository;
  universeEntityRepository?: UniverseEntityRepository;
  entityDeletionRepository?: EntityDeletionRepository;
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

  const referenceCategoryDeletionRepository =
    dependencies.referenceCategoryDeletionRepository ??
    new IndexedDbReferenceCategoryDeletionRepository();

  const universeDeletionRepository =
    dependencies.universeDeletionRepository ?? new IndexedDbUniverseDeletionRepository();

  const referenceEntryRepository =
    dependencies.referenceEntryRepository ?? new IndexedDbReferenceEntryRepository();

  const referenceEntryDeletionRepository =
    dependencies.referenceEntryDeletionRepository ??
    new IndexedDbReferenceEntryDeletionRepository();

  const universeEntityRepository =
    dependencies.universeEntityRepository ?? new IndexedDbUniverseEntityRepository();

  const entityDeletionRepository =
    dependencies.entityDeletionRepository ?? new IndexedDbEntityDeletionRepository();

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
      deletionRepository: referenceCategoryDeletionRepository,
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

    // Reference Entries
    createReferenceEntry: createCreateReferenceEntryUseCase({
      referenceEntryRepository,
      generateId,
      getCurrentTime,
    }),
    updateReferenceEntry: createUpdateReferenceEntryUseCase({
      referenceEntryRepository,
      getCurrentTime,
    }),
    restoreReferenceEntry: createRestoreReferenceEntryUseCase({
      referenceEntryRepository,
      getCurrentTime,
    }),
    deleteReferenceEntry: createDeleteReferenceEntryUseCase({
      referenceEntryRepository: referenceEntryRepository,
      referenceEntryDeletionRepository: referenceEntryDeletionRepository,
      getCurrentTime,
    }),

    // Universe Entities
    createUniverseEntity: createCreateUniverseEntityUseCase({
      universeEntityRepository,
      generateId,
      getCurrentTime,
    }),

    updateUniverseEntity: createUpdateUniverseEntityUseCase({
      universeEntityRepository,
      getCurrentTime,
    }),

    restoreUniverseEntity: createRestoreUniverseEntityUseCase({
      universeEntityRepository,
      getCurrentTime,
    }),

    deleteUniverseEntity: createDeleteUniverseEntityUseCase({
      entityDeletionRepository,
      getCurrentTime,
    }),
  };
}
