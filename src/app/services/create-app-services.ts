import { createCreateUniverseUseCase } from 'src/features/universes/application/use-cases/create-universe';
import { createUpdateUniverseUseCase } from 'src/features/universes/application/use-cases/update-universe';
import { createDeleteUniverseUseCase } from 'src/features/universes/application/use-cases/delete-universe';
import { createRestoreUniverseUseCase } from 'src/features/universes/application/use-cases/restore-universe';
import { createGetUniverseByIdUseCase } from 'src/features/universes/application/use-cases/get-universe-by-id';
import { createGetActiveUniversesUseCase } from 'src/features/universes/application/use-cases/get-active-universes';

import type { UniverseRepository } from 'src/features/universes/application/repositories/universe-repository';

import { IndexedDbUniverseRepository } from 'src/features/universes/infrastructure/repositories/indexed-db-universe-repository';

import type { AppServices } from './app-services.types';

export interface CreateAppServicesDependencies {
  repository?: UniverseRepository;
  generateId?: () => string;
  getCurrentTime?: () => string;
}

export function createAppServices(
  dependencies: CreateAppServicesDependencies = {},
): AppServices {
  const repository = dependencies.repository ?? new IndexedDbUniverseRepository();

  const generateId = dependencies.generateId ?? (() => crypto.randomUUID());

  const getCurrentTime = dependencies.getCurrentTime ?? (() => new Date().toISOString());

  return {
    createUniverse: createCreateUniverseUseCase({
      repository,
      generateId,
      getCurrentTime,
    }),

    updateUniverse: createUpdateUniverseUseCase({
      repository,
      getCurrentTime,
    }),

    deleteUniverse: createDeleteUniverseUseCase({
      repository,
      getCurrentTime,
    }),

    restoreUniverse: createRestoreUniverseUseCase({
      repository,
      getCurrentTime,
    }),

    getUniverseById: createGetUniverseByIdUseCase({
      repository,
    }),

    getActiveUniverses: createGetActiveUniversesUseCase({
      repository,
    }),
  };
}
