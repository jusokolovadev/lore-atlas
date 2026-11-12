import type { UniverseExportRepository } from '../repositories/universe-export-repository';
import type { UniverseImportRepository } from '../repositories/universe-import-repository';

import { createExportUniverseUseCase } from './export-universe';
import { createImportUniverseUseCase } from './import-universe';

import { remapUniverseExport } from '../../domain/operations/remap-universe-export';
import { createUniverseExportManifest } from '../../domain/operations/__tests__/fixtures/create-universe-export-manifest';

import { FflateUniverseArchiveRepository } from 'src/infrastructure/persistence/import-export/fflate-universe-archive-repository';

describe('import/export round-trip', () => {
  const imageContent = new Blob([new Uint8Array(100)], { type: 'image/png' });

  const getCurrentTime = () => '2026-11-06T12:00:00.000Z';

  function createIdGenerator() {
    let counter = 0;

    return () => `imported-id-${++counter}`;
  }

  it('exports and imports a universe through a ZIP archive', async () => {
    const manifest = createUniverseExportManifest();

    const exportRepository: jest.Mocked<UniverseExportRepository> = {
      findUniverseExportData: jest.fn().mockResolvedValue(manifest),
      findImageContent: jest.fn().mockResolvedValue(imageContent),
    };

    const importRepository: jest.Mocked<UniverseImportRepository> = {
      importUniverse: jest.fn().mockResolvedValue('imported-universe-id'),
    };

    const archiveRepository = new FflateUniverseArchiveRepository();

    const exportUniverse = createExportUniverseUseCase({
      exportRepository,
      archiveRepository,
      getCurrentTime,
    });

    const importUniverse = createImportUniverseUseCase({
      archiveRepository,
      importRepository,
      generateId: createIdGenerator(),
    });

    const archive = await exportUniverse('universe-1');

    expect(archive).toBeInstanceOf(Blob);
    expect(archive.size).toBeGreaterThan(0);

    const expectedManifest = {
      ...manifest,
      exportedAt: getCurrentTime(),
    };

    const expectedRemapping = remapUniverseExport(expectedManifest, {
      generateId: createIdGenerator(),
    });

    const importedUniverseId = await importUniverse(archive);

    expect(importedUniverseId).toBe('imported-universe-id');

    expect(importRepository.importUniverse).toHaveBeenCalledTimes(1);

    const [importedManifest, importedImages] =
      importRepository.importUniverse.mock.calls[0];

    expect(importedManifest).toEqual(expectedRemapping.manifest);

    expect(importedManifest.universe.id).not.toBe('universe-1');

    expect(importedImages).toEqual(
      new Map([[expectedRemapping.imageIdMap.get('image-1')!, imageContent]]),
    );
  });

  it('preserves external image URLs during the round-trip', async () => {
    const manifest = createUniverseExportManifest();

    const archiveRepository = new FflateUniverseArchiveRepository();

    const exportRepository: jest.Mocked<UniverseExportRepository> = {
      findUniverseExportData: jest.fn().mockResolvedValue(manifest),
      findImageContent: jest.fn().mockResolvedValue(imageContent),
    };

    const importRepository: jest.Mocked<UniverseImportRepository> = {
      importUniverse: jest.fn().mockResolvedValue('imported-universe-id'),
    };

    const exportUniverse = createExportUniverseUseCase({
      exportRepository,
      archiveRepository,
      getCurrentTime,
    });

    const importUniverse = createImportUniverseUseCase({
      archiveRepository,
      importRepository,
      generateId: createIdGenerator(),
    });

    const archive = await exportUniverse('universe-1');

    await importUniverse(archive);

    const [importedManifest] = importRepository.importUniverse.mock.calls[0];

    // URL image references should not be remapped.
    // Add assertions here for URL references present in the fixture.
    expect(importedManifest.universe.id).not.toBe(manifest.universe.id);
  });
});
