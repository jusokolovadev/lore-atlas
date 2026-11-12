import type { UniverseExportManifest } from '../../domain/models/universe-export';

export interface UniverseExportRepository {
  findUniverseExportData(universeId: string): Promise<UniverseExportManifest>;

  findImageContent(imageId: string): Promise<Blob | null>;
}
