import type { createCreateUniverseUseCase } from 'src/features/universes/application/use-cases/create-universe';
import type { createUpdateUniverseUseCase } from 'src/features/universes/application/use-cases/update-universe';
import type { createDeleteUniverseUseCase } from 'src/features/universes/application/use-cases/delete-universe';
import type { createRestoreUniverseUseCase } from 'src/features/universes/application/use-cases/restore-universe';
import type { createGetUniverseByIdUseCase } from 'src/features/universes/application/use-cases/get-universe-by-id';
import type { createGetActiveUniversesUseCase } from 'src/features/universes/application/use-cases/get-active-universes';

export interface AppServices {
  createUniverse: ReturnType<typeof createCreateUniverseUseCase>;
  updateUniverse: ReturnType<typeof createUpdateUniverseUseCase>;
  deleteUniverse: ReturnType<typeof createDeleteUniverseUseCase>;
  restoreUniverse: ReturnType<typeof createRestoreUniverseUseCase>;
  getUniverseById: ReturnType<typeof createGetUniverseByIdUseCase>;
  getActiveUniverses: ReturnType<typeof createGetActiveUniversesUseCase>;
}
