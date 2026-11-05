import type { EntityDeletionRepository } from '../repositories/entity-deletion-repository';
import { createDeleteUniverseEntityUseCase } from './delete-universe-entity';

describe('createDeleteUniverseEntityUseCase', () => {
  let entityDeletionRepository: jest.Mocked<EntityDeletionRepository>;
  let getCurrentTime: jest.Mock;
  let deleteEntity: ReturnType<typeof createDeleteUniverseEntityUseCase>;

  beforeEach(() => {
    entityDeletionRepository = {
      deleteEntity: jest.fn().mockResolvedValue(undefined),
    };

    getCurrentTime = jest.fn(() => '2026-11-05T12:00:00.000Z');

    deleteEntity = createDeleteUniverseEntityUseCase({
      entityDeletionRepository,
      getCurrentTime,
    });
  });

  it('deletes an entity using the expected revision and current time', async () => {
    await deleteEntity({
      id: 'entity-1',
      expectedRevision: 3,
    });

    expect(getCurrentTime).toHaveBeenCalledTimes(1);

    expect(entityDeletionRepository.deleteEntity).toHaveBeenCalledWith(
      'entity-1',
      3,
      '2026-11-05T12:00:00.000Z',
    );
  });

  it('propagates repository errors', async () => {
    const error = new Error('Entity revision conflict.');

    entityDeletionRepository.deleteEntity.mockRejectedValue(error);

    await expect(
      deleteEntity({
        id: 'entity-1',
        expectedRevision: 3,
      }),
    ).rejects.toBe(error);
  });
});
