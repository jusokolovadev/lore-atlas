import type { UniverseExportManifest } from '../../domain/models/universe-export';

export interface UniverseImportRepository {
  importUniverse(
    manifest: UniverseExportManifest,
    imageContents: Map<string, Blob>,
  ): Promise<string>;
}
