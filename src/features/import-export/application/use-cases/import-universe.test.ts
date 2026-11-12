import type { UniverseArchiveRepository } from '../repositories/universe-archive-repository';
import type { UniverseImportRepository } from '../repositories/universe-import-repository';

import { createImportUniverseUseCase } from './import-universe';
import { remapUniverseExport } from '../../domain/operations/remap-universe-export';
import { createUniverseExportManifest } from '../../domain/operations/__tests__/fixtures/create-universe-export-manifest';

describe('importUniverse', () => {
  let archiveRepository: jest.Mocked<UniverseArchiveRepository>;
  let importRepository: jest.Mocked<UniverseImportRepository>;

  const imageContent = new Blob([new Uint8Array(100)], {
    type: 'image/png',
  });

  const createArchive = (manifest: unknown = createUniverseExportManifest()) => ({
    manifest: new Blob([JSON.stringify(manifest)], {
      type: 'application/json',
    }),
    images: new Map([['images/image-1.png', imageContent]]),
  });

  const createIdGenerator = () => {
    let counter = 0;

    return () => `generated-id-${++counter}`;
  };

  beforeEach(() => {
    archiveRepository = {
      createArchive: jest.fn(),
      readArchive: jest.fn(),
    };

    importRepository = {
      importUniverse: jest.fn().mockResolvedValue('imported-universe-id'),
    };
  });

  it('imports a valid universe archive with remapped IDs', async () => {
    const manifest = createUniverseExportManifest();
    const archiveContents = createArchive(manifest);

    archiveRepository.readArchive.mockResolvedValue(archiveContents);

    const expected = remapUniverseExport(manifest, {
      generateId: createIdGenerator(),
    });

    const importUniverse = createImportUniverseUseCase({
      archiveRepository,
      importRepository,
      generateId: createIdGenerator(),
    });

    const result = await importUniverse(new Blob());

    expect(result).toBe('imported-universe-id');

    const expectedImageContents = new Map([
      [
        expected.imageIdMap.get('image-1')!,
        archiveContents.images.get('images/image-1.png')!,
      ],
    ]);

    expect(importRepository.importUniverse).toHaveBeenCalledWith(
      expected.manifest,
      expectedImageContents,
    );

    expect(expected.manifest.universe.id).not.toBe(manifest.universe.id);
    expect(expected.imageIdMap.get('image-1')).not.toBe('image-1');
  });

  it('rejects invalid JSON', async () => {
    archiveRepository.readArchive.mockResolvedValue({
      manifest: new Blob(['{invalid json']),
      images: new Map(),
    });

    const importUniverse = createImportUniverseUseCase({
      archiveRepository,
      importRepository,
      generateId: createIdGenerator(),
    });

    await expect(importUniverse(new Blob())).rejects.toThrow(
      'Invalid universe archive manifest JSON.',
    );

    expect(importRepository.importUniverse).not.toHaveBeenCalled();
  });

  it('rejects an invalid manifest structure', async () => {
    archiveRepository.readArchive.mockResolvedValue(
      createArchive({
        format: 'invalid-format',
      }),
    );

    const importUniverse = createImportUniverseUseCase({
      archiveRepository,
      importRepository,
      generateId: createIdGenerator(),
    });

    await expect(importUniverse(new Blob())).rejects.toThrow(
      'Invalid universe archive manifest:',
    );

    expect(importRepository.importUniverse).not.toHaveBeenCalled();
  });

  it('rejects inconsistent references', async () => {
    const manifest = createUniverseExportManifest();

    manifest.relationships[0].sourceEntityId = 'missing-entity';

    archiveRepository.readArchive.mockResolvedValue(createArchive(manifest));

    const importUniverse = createImportUniverseUseCase({
      archiveRepository,
      importRepository,
      generateId: createIdGenerator(),
    });

    await expect(importUniverse(new Blob())).rejects.toThrow(
      'Invalid universe archive data:',
    );

    expect(importRepository.importUniverse).not.toHaveBeenCalled();
  });

  it('rejects missing image files', async () => {
    archiveRepository.readArchive.mockResolvedValue({
      manifest: new Blob([JSON.stringify(createUniverseExportManifest())]),
      images: new Map(),
    });

    const importUniverse = createImportUniverseUseCase({
      archiveRepository,
      importRepository,
      generateId: createIdGenerator(),
    });

    await expect(importUniverse(new Blob())).rejects.toThrow(
      'Image file not found in archive: images/image-1.png.',
    );

    expect(importRepository.importUniverse).not.toHaveBeenCalled();
  });

  it('rejects images with an unexpected size', async () => {
    const manifest = createUniverseExportManifest();

    archiveRepository.readArchive.mockResolvedValue({
      manifest: new Blob([JSON.stringify(manifest)]),
      images: new Map([['images/image-1.png', new Blob(['too-small'])]]),
    });

    const importUniverse = createImportUniverseUseCase({
      archiveRepository,
      importRepository,
      generateId: createIdGenerator(),
    });

    await expect(importUniverse(new Blob())).rejects.toThrow(
      'Image size mismatch: images/image-1.png.',
    );

    expect(importRepository.importUniverse).not.toHaveBeenCalled();
  });

  it('rejects images with an unexpected MIME type', async () => {
    const manifest = createUniverseExportManifest();

    archiveRepository.readArchive.mockResolvedValue({
      manifest: new Blob([JSON.stringify(manifest)]),
      images: new Map([
        [
          'images/image-1.png',
          new Blob([new Uint8Array(100)], {
            type: 'image/jpeg',
          }),
        ],
      ]),
    });

    expect(importRepository.importUniverse).not.toHaveBeenCalled();
  });

  it('rejects empty image files', async () => {
    const manifest = createUniverseExportManifest();

    archiveRepository.readArchive.mockResolvedValue({
      manifest: new Blob([JSON.stringify(manifest)]),
      images: new Map([['images/image-1.png', new Blob([], { type: 'image/png' })]]),
    });

    const importUniverse = createImportUniverseUseCase({
      archiveRepository,
      importRepository,
      generateId: createIdGenerator(),
    });

    await expect(importUniverse(new Blob())).rejects.toThrow(
      'Image size mismatch: images/image-1.png.',
    );

    expect(importRepository.importUniverse).not.toHaveBeenCalled();
  });

  it('does not import when archive reading fails', async () => {
    archiveRepository.readArchive.mockRejectedValue(new Error('Invalid ZIP archive.'));

    const importUniverse = createImportUniverseUseCase({
      archiveRepository,
      importRepository,
      generateId: createIdGenerator(),
    });

    await expect(importUniverse(new Blob())).rejects.toThrow('Invalid ZIP archive.');

    expect(importRepository.importUniverse).not.toHaveBeenCalled();
  });

  it('propagates import repository errors', async () => {
    const archiveContents = createArchive();

    archiveRepository.readArchive.mockResolvedValue(archiveContents);
    importRepository.importUniverse.mockRejectedValue(
      new Error('Database transaction failed.'),
    );

    const importUniverse = createImportUniverseUseCase({
      archiveRepository,
      importRepository,
      generateId: createIdGenerator(),
    });

    await expect(importUniverse(new Blob())).rejects.toThrow(
      'Database transaction failed.',
    );
  });
});
