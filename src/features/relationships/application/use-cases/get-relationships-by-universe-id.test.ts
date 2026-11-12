import type { RelationshipRepository } from '../repositories/relationship-repository';
import { createGetRelationshipsByUniverseIdUseCase } from './get-relationships-by-universe-id';

describe('createGetRelationshipsByUniverseIdUseCase', () => {
  let relationshipRepository: jest.Mocked<RelationshipRepository>;

  const createUseCase = () =>
    createGetRelationshipsByUniverseIdUseCase({ relationshipRepository });

  beforeEach(() => {
    relationshipRepository = {
      findById: jest.fn(),
      findAllActiveByUniverseId: jest.fn().mockResolvedValue([]),
      findAllActiveByEntityId: jest.fn(),
      createIfParticipantsAvailable: jest.fn(),
      update: jest.fn(),
      restore: jest.fn(),
    };
  });

  it('returns active relationships for a universe', async () => {
    const relationships = await createUseCase()('universe-1');

    expect(relationships).toEqual([]);
    expect(relationshipRepository.findAllActiveByUniverseId).toHaveBeenCalledWith(
      'universe-1',
    );
  });
});
