import type { UniverseExportRepository } from '../repositories/universe-export-repository';
import type { UniverseArchiveRepository } from '../repositories/universe-archive-repository';

export interface ExportUniverseDependencies {
  exportRepository: UniverseExportRepository;
  archiveRepository: UniverseArchiveRepository;
  getCurrentTime: () => string;
}

export function createExportUniverseUseCase({
  exportRepository,
  archiveRepository,
  getCurrentTime,
}: ExportUniverseDependencies) {
  return async (universeId: string): Promise<Blob> => {
    const manifest = await exportRepository.findUniverseExportData(universeId);

    const images = new Map<string, Blob>();

    for (const image of manifest.images) {
      const content = await exportRepository.findImageContent(image.id);

      if (!content) {
        throw new Error(`Image content not found: ${image.id}.`);
      }

      images.set(image.path, content);
    }

    const exportManifest = {
      ...manifest,
      exportedAt: getCurrentTime(),
    };

    const manifestBlob = new Blob([JSON.stringify(exportManifest)], {
      type: 'application/json',
    });

    return archiveRepository.createArchive(manifestBlob, images);
  };
}
