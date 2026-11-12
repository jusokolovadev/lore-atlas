import type { UniverseExportRepository } from '../repositories/universe-export-repository';
import type { UniverseArchiveRepository } from '../repositories/universe-archive-repository';

import { createExportUniverseUseCase } from './export-universe';
import { createUniverseExportManifest } from '../../domain/operations/__tests__/fixtures/create-universe-export-manifest';

describe('exportUniverse', () => {
  let exportRepository: jest.Mocked<UniverseExportRepository>;
  let archiveRepository: jest.Mocked<UniverseArchiveRepository>;

  const imageContent = new Blob([new Uint8Array(100)], {
    type: 'image/png',
  });

  const currentTime = '2026-11-12T10:00:00.000Z';

  beforeEach(() => {
    exportRepository = {
      findUniverseExportData: jest.fn(),
      findImageContent: jest.fn(),
    };

    archiveRepository = {
      createArchive: jest.fn().mockResolvedValue(new Blob(['archive'])),
      readArchive: jest.fn(),
    };
  });

  it('exports a universe archive', async () => {
    const manifest = createUniverseExportManifest();

    exportRepository.findUniverseExportData.mockResolvedValue(manifest);
    exportRepository.findImageContent.mockResolvedValue(imageContent);

    const exportUniverse = createExportUniverseUseCase({
      exportRepository,
      archiveRepository,
      getCurrentTime: () => currentTime,
    });

    const result = await exportUniverse('universe-1');

    expect(result).toBeInstanceOf(Blob);
    expect(exportRepository.findUniverseExportData).toHaveBeenCalledWith('universe-1');
    expect(archiveRepository.createArchive).toHaveBeenCalledTimes(1);
  });

  it('includes the export timestamp in the manifest', async () => {
    const manifest = createUniverseExportManifest();

    exportRepository.findUniverseExportData.mockResolvedValue(manifest);
    exportRepository.findImageContent.mockResolvedValue(imageContent);

    const exportUniverse = createExportUniverseUseCase({
      exportRepository,
      archiveRepository,
      getCurrentTime: () => currentTime,
    });

    await exportUniverse('universe-1');

    const [manifestBlob] = archiveRepository.createArchive.mock.calls[0];

    const exportedManifest = JSON.parse(
      await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Unable to read manifest.'));
          }
        };

        reader.onerror = () => reject(reader.error);
        reader.readAsText(manifestBlob);
      }),
    );

    expect(exportedManifest.exportedAt).toBe(currentTime);
  });

  it('includes image contents using their archive paths', async () => {
    const manifest = createUniverseExportManifest();

    exportRepository.findUniverseExportData.mockResolvedValue(manifest);
    exportRepository.findImageContent.mockResolvedValue(imageContent);

    const exportUniverse = createExportUniverseUseCase({
      exportRepository,
      archiveRepository,
      getCurrentTime: () => currentTime,
    });

    await exportUniverse('universe-1');

    expect(archiveRepository.createArchive).toHaveBeenCalledWith(
      expect.any(Blob),
      new Map([['images/image-1.png', imageContent]]),
    );
  });

  it('exports multiple images', async () => {
    const manifest = createUniverseExportManifest();

    manifest.images.push({
      id: 'image-2',
      mimeType: 'image/jpeg',
      size: 100,
      createdAt: '2026-01-02T00:00:00.000Z',
      path: 'images/image-2.jpg',
    });

    const secondImage = new Blob([new Uint8Array(100)], {
      type: 'image/jpeg',
    });

    exportRepository.findUniverseExportData.mockResolvedValue(manifest);
    exportRepository.findImageContent
      .mockResolvedValueOnce(imageContent)
      .mockResolvedValueOnce(secondImage);

    const exportUniverse = createExportUniverseUseCase({
      exportRepository,
      archiveRepository,
      getCurrentTime: () => currentTime,
    });

    await exportUniverse('universe-1');

    expect(exportRepository.findImageContent).toHaveBeenNthCalledWith(1, 'image-1');
    expect(exportRepository.findImageContent).toHaveBeenNthCalledWith(2, 'image-2');

    expect(archiveRepository.createArchive).toHaveBeenCalledWith(
      expect.any(Blob),
      new Map([
        ['images/image-1.png', imageContent],
        ['images/image-2.jpg', secondImage],
      ]),
    );
  });

  it('rejects when image content is missing', async () => {
    const manifest = createUniverseExportManifest();

    exportRepository.findUniverseExportData.mockResolvedValue(manifest);
    exportRepository.findImageContent.mockResolvedValue(null);

    const exportUniverse = createExportUniverseUseCase({
      exportRepository,
      archiveRepository,
      getCurrentTime: () => currentTime,
    });

    await expect(exportUniverse('universe-1')).rejects.toThrow(
      'Image content not found: image-1.',
    );

    expect(archiveRepository.createArchive).not.toHaveBeenCalled();
  });

  it('does not create an archive when image loading fails', async () => {
    const manifest = createUniverseExportManifest();

    exportRepository.findUniverseExportData.mockResolvedValue(manifest);
    exportRepository.findImageContent.mockRejectedValue(
      new Error('Image storage failed.'),
    );

    const exportUniverse = createExportUniverseUseCase({
      exportRepository,
      archiveRepository,
      getCurrentTime: () => currentTime,
    });

    await expect(exportUniverse('universe-1')).rejects.toThrow('Image storage failed.');

    expect(archiveRepository.createArchive).not.toHaveBeenCalled();
  });

  it('propagates archive creation errors', async () => {
    const manifest = createUniverseExportManifest();

    exportRepository.findUniverseExportData.mockResolvedValue(manifest);
    exportRepository.findImageContent.mockResolvedValue(imageContent);
    archiveRepository.createArchive.mockRejectedValue(
      new Error('Archive creation failed.'),
    );

    const exportUniverse = createExportUniverseUseCase({
      exportRepository,
      archiveRepository,
      getCurrentTime: () => currentTime,
    });

    await expect(exportUniverse('universe-1')).rejects.toThrow(
      'Archive creation failed.',
    );
  });
});
