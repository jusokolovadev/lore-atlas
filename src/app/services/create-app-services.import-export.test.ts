import { createAppServices } from './create-app-services';

import type { UniverseExportRepository } from 'src/features/import-export/application/repositories/universe-export-repository';
import type { UniverseImportRepository } from 'src/features/import-export/application/repositories/universe-import-repository';
import type { UniverseArchiveRepository } from 'src/features/import-export/application/repositories/universe-archive-repository';

describe('createAppServices — import/export', () => {
  const manifest = {
    format: 'lore-atlas-universe' as const,
    version: 1 as const,
    exportedAt: '2026-01-01T00:00:00.000Z',
    universe: {
      id: 'universe-1',
      name: 'Test Universe',
      description: null,
      coverImage: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      deletedAt: null,
      revision: 1,
      enabledStandardCategoryIds: [],
    },
    referenceCategories: [],
    referenceEntries: [],
    universeEntities: [],
    relationships: [],
    images: [],
  };

  it('uses the provided export repositories', async () => {
    const archive = new Blob(['archive']);

    const universeExportRepository: jest.Mocked<UniverseExportRepository> = {
      findUniverseExportData: jest.fn().mockResolvedValue(manifest),
      findImageContent: jest.fn(),
    };

    const universeArchiveRepository: jest.Mocked<UniverseArchiveRepository> = {
      createArchive: jest.fn().mockResolvedValue(archive),
      readArchive: jest.fn(),
    };

    const services = createAppServices({
      universeExportRepository,
      universeArchiveRepository,
      getCurrentTime: () => '2026-01-01T00:00:00.000Z',
    });

    const result = await services.exportUniverse('universe-1');

    expect(universeExportRepository.findUniverseExportData).toHaveBeenCalledWith(
      'universe-1',
    );

    expect(universeArchiveRepository.createArchive).toHaveBeenCalled();

    expect(result).toBe(archive);
  });

  it('uses the provided import repositories', async () => {
    const archive = new Blob(['archive']);
    const manifestBlob = new Blob([JSON.stringify(manifest)], {
      type: 'application/json',
    });

    const universeArchiveRepository: jest.Mocked<UniverseArchiveRepository> = {
      createArchive: jest.fn(),
      readArchive: jest.fn().mockResolvedValue({
        manifest: manifestBlob,
        images: new Map(),
      }),
    };

    const universeImportRepository: jest.Mocked<UniverseImportRepository> = {
      importUniverse: jest.fn().mockResolvedValue('imported-universe-id'),
    };

    const services = createAppServices({
      universeArchiveRepository,
      universeImportRepository,
    });

    const result = await services.importUniverse(archive);

    expect(universeArchiveRepository.readArchive).toHaveBeenCalledWith(archive);

    expect(universeImportRepository.importUniverse).toHaveBeenCalledWith(
      expect.objectContaining({
        format: 'lore-atlas-universe',
        universe: expect.objectContaining({
          name: 'Test Universe',
        }),
      }),
      new Map(),
    );

    expect(result).toBe('imported-universe-id');
  });

  it('exposes default import/export services', () => {
    const services = createAppServices();

    expect(services.exportUniverse).toEqual(expect.any(Function));
    expect(services.importUniverse).toEqual(expect.any(Function));
  });
});
