import type { Relationship } from '../../domain/models/relationship';
import type { RelationshipRepository } from '../repositories/relationship-repository';
import { createGetRelationshipByIdUseCase } from './get-relationship-by-id';

describe('createGetRelationshipByIdUseCase', () => {
  let relationshipRepository: jest.Mocked<RelationshipRepository>;

  const createUseCase = () =>
    createGetRelationshipByIdUseCase({ relationshipRepository });

  beforeEach(() => {
    relationshipRepository = {
      findById: jest.fn(),
      findAllActiveByUniverseId: jest.fn(),
      findAllActiveByEntityId: jest.fn(),
      createIfParticipantsAvailable: jest.fn(),
      update: jest.fn(),
      restore: jest.fn(),
    };
  });

  it('returns a relationship by ID', async () => {
    const relationship: Relationship = {
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

    relationshipRepository.findById.mockResolvedValue(relationship);

    await expect(createUseCase()('relationship-1')).resolves.toEqual(relationship);

    expect(relationshipRepository.findById).toHaveBeenCalledWith('relationship-1');
  });

  it('returns null when the relationship does not exist', async () => {
    relationshipRepository.findById.mockResolvedValue(null);

    await expect(createUseCase()('missing')).resolves.toBeNull();
  });

  it('returns deleted relationships', async () => {
    const relationship: Relationship = {
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

    relationshipRepository.findById.mockResolvedValue(relationship);

    await expect(createUseCase()('relationship-1')).resolves.toEqual(relationship);
  });
});
