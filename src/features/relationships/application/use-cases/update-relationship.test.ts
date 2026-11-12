import type { Relationship } from '../../domain/models/relationship';
import type { RelationshipRepository } from '../repositories/relationship-repository';
import { createUpdateRelationshipUseCase } from './update-relationship';

describe('createUpdateRelationshipUseCase', () => {
  const currentTime = '2026-11-06T08:00:00.000Z';

  const currentRelationship: Relationship = {
    id: 'relationship-1',
    universeId: 'universe-1',
    sourceEntityId: 'entity-1',
    targetEntityId: 'entity-2',
    typeId: 'parent-of',
    description: null,
    isSpoiler: false,
    createdAt: '2026-11-05T10:00:00.000Z',
    updatedAt: '2026-11-05T10:00:00.000Z',
    deletedAt: null,
    revision: 1,
  };

  let relationshipRepository: jest.Mocked<RelationshipRepository>;
  let getCurrentTime: jest.Mock;

  const createUseCase = () =>
    createUpdateRelationshipUseCase({
      relationshipRepository,
      getCurrentTime,
    });

  beforeEach(() => {
    relationshipRepository = {
      findById: jest.fn().mockResolvedValue(currentRelationship),
      findAllActiveByUniverseId: jest.fn(),
      findAllActiveByEntityId: jest.fn(),
      createIfParticipantsAvailable: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      restore: jest.fn(),
    };

    getCurrentTime = jest.fn().mockReturnValue(currentTime);
  });

  it('updates and persists a relationship', async () => {
    const result = await createUseCase()({
      id: 'relationship-1',
      expectedRevision: 1,
      changes: {
        description: 'Biological parent',
      },
    });

    expect(result).toEqual({
      ...currentRelationship,
      description: 'Biological parent',
      updatedAt: currentTime,
      revision: 2,
    });

    expect(relationshipRepository.findById).toHaveBeenCalledWith('relationship-1');

    expect(relationshipRepository.update).toHaveBeenCalledWith(result, 1);
    expect(getCurrentTime).toHaveBeenCalledTimes(1);
  });

  it('throws when the relationship does not exist', async () => {
    relationshipRepository.findById.mockResolvedValue(null);

    await expect(
      createUseCase()({
        id: 'missing',
        expectedRevision: 1,
        changes: { description: 'Updated' },
      }),
    ).rejects.toThrow('Relationship not found or deleted.');

    expect(relationshipRepository.update).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('throws when the relationship is deleted', async () => {
    relationshipRepository.findById.mockResolvedValue({
      ...currentRelationship,
      deletedAt: currentTime,
    });

    await expect(
      createUseCase()({
        id: 'relationship-1',
        expectedRevision: 1,
        changes: { description: 'Updated' },
      }),
    ).rejects.toThrow('Relationship not found or deleted.');

    expect(relationshipRepository.update).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('throws when the revision does not match', async () => {
    await expect(
      createUseCase()({
        id: 'relationship-1',
        expectedRevision: 2,
        changes: { description: 'Updated' },
      }),
    ).rejects.toThrow('Relationship revision conflict.');

    expect(relationshipRepository.update).not.toHaveBeenCalled();
    expect(getCurrentTime).not.toHaveBeenCalled();
  });

  it('does not persist an invalid domain update', async () => {
    await expect(
      createUseCase()({
        id: 'relationship-1',
        expectedRevision: 1,
        changes: {
          typeId: 'friend-of',
        },
      }),
    ).rejects.toThrow('Relationship direction cannot be changed.');

    expect(relationshipRepository.update).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    relationshipRepository.update.mockRejectedValue(new Error('Database error.'));

    await expect(
      createUseCase()({
        id: 'relationship-1',
        expectedRevision: 1,
        changes: { description: 'Updated' },
      }),
    ).rejects.toThrow('Database error.');
  });
});
