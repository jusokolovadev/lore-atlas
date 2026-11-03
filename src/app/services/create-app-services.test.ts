import type { UniverseRepository } from 'src/features/universes/application/repositories/universe-repository';

import { createAppServices } from './create-app-services';

describe('createAppServices', () => {
  it('should create services with the provided dependencies', async () => {
    const repository: UniverseRepository = {
      findById: jest.fn().mockResolvedValue(null),
      findAllActive: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const services = createAppServices({
      repository,
      generateId: () => 'universe-1',
      getCurrentTime: () => '2026-01-01T00:00:00.000Z',
    });

    const universe = await services.createUniverse({
      name: ' Middle-earth ',
    });

    expect(universe).toEqual({
      id: 'universe-1',
      name: 'Middle-earth',
      description: null,
      coverImage: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      deletedAt: null,
    });

    expect(repository.save).toHaveBeenCalledWith(universe);
  });

  it('should use the same repository for all services', async () => {
    const repository: UniverseRepository = {
      findById: jest.fn().mockResolvedValue(null),
      findAllActive: jest.fn().mockResolvedValue([]),
      save: jest.fn().mockResolvedValue(undefined),
    };

    const services = createAppServices({ repository });

    await services.getActiveUniverses();
    await services.getUniverseById('universe-1');

    expect(repository.findAllActive).toHaveBeenCalledTimes(1);
    expect(repository.findById).toHaveBeenCalledWith('universe-1');
  });
});
