import type { UniverseArchiveRepository } from '../repositories/universe-archive-repository';
import type { UniverseImportRepository } from '../repositories/universe-import-repository';

import { remapUniverseExport } from '../../domain/operations/remap-universe-export';
import { validateUniverseExport } from '../../domain/operations/validate-universe-export';
import { universeExportManifestSchema } from '../schemas/universe-export-manifest.schema';

export interface ImportUniverseDependencies {
  archiveRepository: UniverseArchiveRepository;
  importRepository: UniverseImportRepository;
  generateId: () => string;
}

function readBlobAsText(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Unable to read archive manifest.'));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error('Unable to read archive manifest.'));
    };

    reader.readAsText(blob);
  });
}

export function createImportUniverseUseCase({
  archiveRepository,
  importRepository,
  generateId,
}: ImportUniverseDependencies) {
  return async function importUniverse(archive: Blob): Promise<string> {
    const archiveContents = await archiveRepository.readArchive(archive);

    let parsedJson: unknown;

    try {
      const json = await readBlobAsText(archiveContents.manifest);
      parsedJson = JSON.parse(json);
    } catch {
      throw new Error('Invalid universe archive manifest JSON.');
    }

    // 1. Validate the JSON structure.
    const schemaResult = universeExportManifestSchema.safeParse(parsedJson);

    if (!schemaResult.success) {
      throw new Error(`Invalid universe archive manifest: ${schemaResult.error.message}`);
    }

    const manifest = schemaResult.data;

    // 2. Validate relationships between records.
    const domainResult = validateUniverseExport(manifest);

    if (!domainResult.valid) {
      const details = domainResult.errors
        .map((error) => `${error.path}: ${error.message}`)
        .join('\n');

      throw new Error(`Invalid universe archive data:\n${details}`);
    }

    // 3. Check that every declared image exists and has the expected size.
    const imageContents = new Map<string, Blob>();

    for (const image of manifest.images) {
      const content = archiveContents.images.get(image.path);

      if (!content) {
        throw new Error(`Image file not found in archive: ${image.path}.`);
      }

      if (content.size !== image.size) {
        throw new Error(`Image size mismatch: ${image.path}.`);
      }

      // ZIP entries do not preserve MIME types.
      // The actual image format is validated by the persistence layer.

      imageContents.set(image.id, new Blob([content], { type: image.mimeType }));
    }

    // 4. Generate new IDs for all imported records.
    const remapped = remapUniverseExport(manifest, { generateId });

    // 5. Remap image content keys to the new image IDs.
    const remappedImageContents = new Map<string, Blob>();

    for (const [originalId, content] of imageContents) {
      const newId = remapped.imageIdMap.get(originalId);

      if (!newId) {
        throw new Error(`Image ID mapping not found: ${originalId}.`);
      }

      remappedImageContents.set(newId, content);
    }

    // 6. Persist the remapped data.
    return importRepository.importUniverse(remapped.manifest, remappedImageContents);
  };
}
