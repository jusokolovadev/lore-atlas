import type { Universe } from 'src/features/universes/domain/models/universe';
import type { ReferenceEntry } from 'src/features/reference-entry/domain/models/reference-entry';
import type { UniverseEntity } from 'src/features/entities/domain/models/universe-entity';
import type { Relationship } from 'src/features/relationships/domain/models/relationship';
import type { CustomReferenceCategory } from 'src/features/reference-categories/domain/models/custom-reference-category';

export const UNIVERSE_EXPORT_FORMAT = 'lore-atlas-universe' as const;

export const UNIVERSE_EXPORT_VERSION = 1 as const;

export interface ExportedImageMetadata {
  id: string;
  mimeType: string;
  size: number;
  createdAt: string;
  path: string;
}

export interface UniverseExportManifest {
  format: typeof UNIVERSE_EXPORT_FORMAT;
  version: number;
  exportedAt: string;
  universe: Universe;
  referenceCategories: CustomReferenceCategory[];
  referenceEntries: ReferenceEntry[];
  universeEntities: UniverseEntity[];
  relationships: Relationship[];
  images: ExportedImageMetadata[];
}
