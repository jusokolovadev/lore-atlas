import type { RelationshipRepository } from '../repositories/relationship-repository';
import { createCreateRelationshipUseCase } from './create-relationship';

describe('createCreateRelationshipUseCase', () => {
  const currentTime = '2026-11-06T08:00:00.000Z';

  let relationshipRepository: jest.Mocked<RelationshipRepository>;
  let generateId: jest.Mock;
  let getCurrentTime: jest.Mock;

  const createUseCase = () =>
    createCreateRelationshipUseCase({
      relationshipRepository,
      generateId,
      getCurrentTime,
    });

  beforeEach(() => {
    relationshipRepository = {
      findById: jest.fn(),
      findAllActiveByUniverseId: jest.fn(),
      findAllActiveByEntityId: jest.fn(),
      createIfParticipantsAvailable: jest.fn().mockResolvedValue('created'),
      update: jest.fn(),
      restore: jest.fn(),
    };

    generateId = jest.fn().mockReturnValue('relationship-1');
    getCurrentTime = jest.fn().mockReturnValue(currentTime);
  });

  it('creates and persists a relationship', async () => {
    const relationship = await createUseCase()({
      universeId: 'universe-1',
      sourceEntityId: 'entity-1',
      targetEntityId: 'entity-2',
      typeId: 'parent-of',
    });

    expect(relationship).toEqual({
      id: 'relationship-1',
      universeId: 'universe-1',
      sourceEntityId: 'entity-1',
      targetEntityId: 'entity-2',
      typeId: 'parent-of',
      description: null,
      isSpoiler: false,
      createdAt: currentTime,
      updatedAt: currentTime,
      deletedAt: null,
      revision: 1,
    });

    expect(generateId).toHaveBeenCalledTimes(1);
    expect(getCurrentTime).toHaveBeenCalledTimes(1);

    expect(relationshipRepository.createIfParticipantsAvailable).toHaveBeenCalledWith(
      relationship,
    );
  });

  it('does not persist a relationship with an unknown type', async () => {
    await expect(
      createUseCase()({
        universeId: 'universe-1',
        sourceEntityId: 'entity-1',
        targetEntityId: 'entity-2',
        typeId: 'unknown-type',
      }),
    ).rejects.toThrow('Relationship type not found.');

    expect(relationshipRepository.createIfParticipantsAvailable).not.toHaveBeenCalled();
  });

  it('does not persist a relationship with invalid participants', async () => {
    await expect(
      createUseCase()({
        universeId: 'universe-1',
        sourceEntityId: 'entity-1',
        targetEntityId: 'entity-1',
        typeId: 'friend-of',
      }),
    ).rejects.toThrow('Relationship participants are invalid.');

    expect(relationshipRepository.createIfParticipantsAvailable).not.toHaveBeenCalled();
  });

  it('throws when participants are unavailable', async () => {
    relationshipRepository.createIfParticipantsAvailable.mockResolvedValue(
      'participants-unavailable',
    );

    await expect(
      createUseCase()({
        universeId: 'universe-1',
        sourceEntityId: 'entity-1',
        targetEntityId: 'entity-2',
        typeId: 'friend-of',
      }),
    ).rejects.toThrow('Relationship participants not found or deleted.');
  });

  it('throws when the relationship already exists', async () => {
    relationshipRepository.createIfParticipantsAvailable.mockResolvedValue(
      'already-exists',
    );

    await expect(
      createUseCase()({
        universeId: 'universe-1',
        sourceEntityId: 'entity-1',
        targetEntityId: 'entity-2',
        typeId: 'friend-of',
      }),
    ).rejects.toThrow('Relationship already exists.');
  });

  it('does not swallow repository errors', async () => {
    relationshipRepository.createIfParticipantsAvailable.mockRejectedValue(
      new Error('Database error.'),
    );

    await expect(
      createUseCase()({
        universeId: 'universe-1',
        sourceEntityId: 'entity-1',
        targetEntityId: 'entity-2',
        typeId: 'friend-of',
      }),
    ).rejects.toThrow('Database error.');
  });
});
