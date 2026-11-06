import type { Relationship } from '../../domain/models/relationship';
import type { RelationshipRepository } from '../repositories/relationship-repository';
import { createRestoreRelationshipUseCase } from './restore-relationship';

describe('createRestoreRelationshipUseCase', () => {
  const currentTime = '2026-11-06T08:00:00.000Z';

  const deletedRelationship: Relationship = {
    id: 'relationship-1',
    universeId: 'universe-1',
    sourceEntityId: 'entity-1',
    targetEntityId: 'entity-2',
    typeId: 'parent-of',
    description: null,
    isSpoiler: false,
    createdAt: '2026-11-05T10:00:00.000Z',
    updatedAt: '2026-11-05T12:00:00.000Z',
    deletedAt: '2026-11-05T12:00:00.000Z',
    revision: 2,
  };

  let relationshipRepository: jest.Mocked<RelationshipRepository>;
  let getCurrentTime: jest.Mock;

  const createUseCase = () =>
    createRestoreRelationshipUseCase({
      relationshipRepository,
      getCurrentTime,
    });

  beforeEach(() => {
    relationshipRepository = {
      findById: jest.fn().mockResolvedValue(deletedRelationship),
      findAllActiveByUniverseId: jest.fn(),
      findAllActiveByEntityId: jest.fn(),
      createIfParticipantsAvailable: jest.fn(),
      update: jest.fn(),
      restore: jest.fn().mockResolvedValue(undefined),
    };

    getCurrentTime = jest.fn().mockReturnValue(currentTime);
  });

  it('restores and persists a relationship', async () => {
    const result = await createUseCase()({
      id: 'relationship-1',
      expectedRevision: 2,
    });

    expect(result).toEqual({
      ...deletedRelationship,
      updatedAt: currentTime,
      deletedAt: null,
      revision: 3,
    });

    expect(relationshipRepository.restore).toHaveBeenCalledWith(result, 2);
    expect(getCurrentTime).toHaveBeenCalledTimes(1);
  });

  it('throws when the relationship does not exist', async () => {
    relationshipRepository.findById.mockResolvedValue(null);

    await expect(
      createUseCase()({
        id: 'missing',
        expectedRevision: 2,
      }),
    ).rejects.toThrow('Relationship not found.');

    expect(relationshipRepository.restore).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('throws when the relationship is already active', async () => {
    relationshipRepository.findById.mockResolvedValue({
      ...deletedRelationship,
      deletedAt: null,
    });

    await expect(
      createUseCase()({
        id: 'relationship-1',
        expectedRevision: 2,
      }),
    ).rejects.toThrow('Relationship is not deleted.');

    expect(relationshipRepository.restore).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('throws when the revision does not match', async () => {
    await expect(
      createUseCase()({
        id: 'relationship-1',
        expectedRevision: 3,
      }),
    ).rejects.toThrow('Relationship revision conflict.');

    expect(relationshipRepository.restore).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    relationshipRepository.restore.mockRejectedValue(
      new Error('Participants are unavailable.'),
    );

    await expect(
      createUseCase()({
        id: 'relationship-1',
        expectedRevision: 2,
      }),
    ).rejects.toThrow('Participants are unavailable.');
  });
});
