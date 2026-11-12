import type { RelationshipRepository } from '../repositories/relationship-repository';
import { createGetRelationshipsByEntityIdUseCase } from './get-relationships-by-entity-id';

describe('createGetRelationshipsByEntityIdUseCase', () => {
  let relationshipRepository: jest.Mocked<RelationshipRepository>;

  const createUseCase = () =>
    createGetRelationshipsByEntityIdUseCase({ relationshipRepository });

  beforeEach(() => {
    relationshipRepository = {
      findById: jest.fn(),
      findAllActiveByUniverseId: jest.fn(),
      findAllActiveByEntityId: jest.fn().mockResolvedValue([]),
      createIfParticipantsAvailable: jest.fn(),
      update: jest.fn(),
      restore: jest.fn(),
    };
  });

  it('returns active relationships for an entity', async () => {
    const relationships = await createUseCase()('universe-1', 'entity-1');

    expect(relationships).toEqual([]);
    expect(relationshipRepository.findAllActiveByEntityId).toHaveBeenCalledWith(
      'universe-1',
      'entity-1',
    );
  });
});
