import type { RelationshipDeletionRepository } from '../repositories/relationship-deletion-repository';
import { createDeleteRelationshipUseCase } from './delete-relationship';

describe('createDeleteRelationshipUseCase', () => {
  const currentTime = '2026-11-06T08:00:00.000Z';

  let relationshipDeletionRepository: jest.Mocked<RelationshipDeletionRepository>;
  let getCurrentTime: jest.Mock;

  const createUseCase = () =>
    createDeleteRelationshipUseCase({
      relationshipDeletionRepository,
      getCurrentTime,
    });

  beforeEach(() => {
    relationshipDeletionRepository = {
      deleteRelationship: jest.fn().mockResolvedValue(undefined),
    };

    getCurrentTime = jest.fn().mockReturnValue(currentTime);
  });

  it('deletes a relationship', async () => {
    await expect(
      createUseCase()({
        id: 'relationship-1',
        expectedRevision: 2,
      }),
    ).resolves.toBeUndefined();

    expect(getCurrentTime).toHaveBeenCalledTimes(1);

    expect(relationshipDeletionRepository.deleteRelationship).toHaveBeenCalledWith(
      'relationship-1',
      2,
      currentTime,
    );
  });

  it('propagates repository errors', async () => {
    relationshipDeletionRepository.deleteRelationship.mockRejectedValue(
      new Error('Relationship revision conflict.'),
    );

    await expect(
      createUseCase()({
        id: 'relationship-1',
        expectedRevision: 2,
      }),
    ).rejects.toThrow('Relationship revision conflict.');
  });
});
