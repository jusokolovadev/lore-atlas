import type { UniverseExportManifest } from '../models/universe-export';
import type { ImageReference } from 'src/shared/types/image-reference';
import type { UniverseEntity } from 'src/features/entities/domain/models/universe-entity';
interface RemapUniverseExportDependencies {
  generateId: () => string;
}

interface ReferenceEntryLinkLike {
  categoryType: 'standard' | 'custom';
  categoryId: string;
  entryId: string;
}

function isReferenceEntryLink(value: unknown): value is ReferenceEntryLinkLike {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    (candidate.categoryType === 'standard' || candidate.categoryType === 'custom') &&
    typeof candidate.categoryId === 'string' &&
    typeof candidate.entryId === 'string'
  );
}

export interface RemapUniverseExportResult {
  manifest: UniverseExportManifest;
  imageIdMap: ReadonlyMap<string, string>;
}
function remapUniverseEntity(
  entity: UniverseEntity,
  universeId: string,
  entityIdMap: ReadonlyMap<string, string>,
  categoryIdMap: ReadonlyMap<string, string>,
  entryIdMap: ReadonlyMap<string, string>,
  imageIdMap: ReadonlyMap<string, string>,
): UniverseEntity {
  const common = {
    ...entity,
    id: getMappedId(entityIdMap, entity.id, 'Entity'),
    universeId,
    image: remapImageReference(entity.image, imageIdMap),
    revision: 1,
  };

  switch (entity.type) {
    case 'character':
      return {
        ...common,
        type: 'character',
        properties: remapProperties(entity.properties, categoryIdMap, entryIdMap),
      };

    case 'location':
      return {
        ...common,
        type: 'location',
        properties: remapProperties(entity.properties, categoryIdMap, entryIdMap),
      };

    case 'event':
      return {
        ...common,
        type: 'event',
        properties: remapProperties(entity.properties, categoryIdMap, entryIdMap),
      };

    case 'item':
      return {
        ...common,
        type: 'item',
        properties: remapProperties(entity.properties, categoryIdMap, entryIdMap),
      };

    case 'organization':
      return {
        ...common,
        type: 'organization',
        properties: remapProperties(entity.properties, categoryIdMap, entryIdMap),
      };
  }
}

function remapReferenceEntryLink(
  link: ReferenceEntryLinkLike,
  categoryIdMap: ReadonlyMap<string, string>,
  entryIdMap: ReadonlyMap<string, string>,
): ReferenceEntryLinkLike {
  const entryId = entryIdMap.get(link.entryId);

  if (!entryId) {
    throw new Error(`Reference entry not found: ${link.entryId}.`);
  }

  let categoryId = link.categoryId;

  if (link.categoryType === 'custom') {
    const mappedCategoryId = categoryIdMap.get(link.categoryId);

    if (!mappedCategoryId) {
      throw new Error(`Reference category not found: ${link.categoryId}.`);
    }

    categoryId = mappedCategoryId;
  }

  return {
    ...link,
    categoryId,
    entryId,
  };
}

function remapProperties<T>(
  value: T,
  categoryIdMap: ReadonlyMap<string, string>,
  entryIdMap: ReadonlyMap<string, string>,
): T {
  if (Array.isArray(value)) {
    return value.map((item) => remapProperties(item, categoryIdMap, entryIdMap)) as T;
  }

  if (isReferenceEntryLink(value)) {
    return remapReferenceEntryLink(value, categoryIdMap, entryIdMap) as T;
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      remapProperties(nestedValue, categoryIdMap, entryIdMap),
    ]),
  ) as T;
}

function remapImageReference(
  image: ImageReference | null,
  imageIdMap: ReadonlyMap<string, string>,
): ImageReference | null {
  if (!image || image.type === 'url') {
    return image;
  }

  const fileId = imageIdMap.get(image.fileId);

  if (!fileId) {
    throw new Error(`Image not found: ${image.fileId}.`);
  }

  return {
    type: 'file',
    fileId,
  };
}

function getMappedId(
  idMap: ReadonlyMap<string, string>,
  originalId: string,
  entityName: string,
): string {
  const mappedId = idMap.get(originalId);

  if (!mappedId) {
    throw new Error(`${entityName} not found: ${originalId}.`);
  }

  return mappedId;
}

export function remapUniverseExport(
  manifest: UniverseExportManifest,
  dependencies: RemapUniverseExportDependencies,
): RemapUniverseExportResult {
  const { generateId } = dependencies;

  const universeId = generateId();

  const categoryIdMap = new Map(
    manifest.referenceCategories.map((category) => [category.id, generateId()]),
  );

  const entryIdMap = new Map(
    manifest.referenceEntries.map((entry) => [entry.id, generateId()]),
  );

  const entityIdMap = new Map(
    manifest.universeEntities.map((entity) => [entity.id, generateId()]),
  );

  const relationshipIdMap = new Map(
    manifest.relationships.map((relationship) => [relationship.id, generateId()]),
  );

  const imageIdMap = new Map(manifest.images.map((image) => [image.id, generateId()]));

  return {
    manifest: {
      ...manifest,

      universe: {
        ...manifest.universe,
        id: universeId,
        revision: 1,
        coverImage: remapImageReference(manifest.universe.coverImage, imageIdMap),
      },

      referenceCategories: manifest.referenceCategories.map((category) => ({
        ...category,
        id: getMappedId(categoryIdMap, category.id, 'Reference category'),
        universeId,
        revision: 1,
      })),

      referenceEntries: manifest.referenceEntries.map((entry) => ({
        ...entry,
        id: getMappedId(entryIdMap, entry.id, 'Reference entry'),
        universeId,
        categoryId:
          entry.categoryType === 'custom'
            ? getMappedId(categoryIdMap, entry.categoryId, 'Reference category')
            : entry.categoryId,
        image: remapImageReference(entry.image, imageIdMap),
        revision: 1,
      })),

      universeEntities: manifest.universeEntities.map((entity) =>
        remapUniverseEntity(
          entity,
          universeId,
          entityIdMap,
          categoryIdMap,
          entryIdMap,
          imageIdMap,
        ),
      ),

      relationships: manifest.relationships.map((relationship) => {
        const sourceEntityId = entityIdMap.get(relationship.sourceEntityId);
        const targetEntityId = entityIdMap.get(relationship.targetEntityId);

        if (!sourceEntityId) {
          throw new Error(`Source entity not found: ${relationship.sourceEntityId}.`);
        }

        if (!targetEntityId) {
          throw new Error(`Target entity not found: ${relationship.targetEntityId}.`);
        }

        return {
          ...relationship,
          id: getMappedId(relationshipIdMap, relationship.id, 'Relationship'),
          universeId,
          sourceEntityId,
          targetEntityId,
          revision: 1,
        };
      }),

      images: manifest.images.map((image) => ({
        ...image,
        id: getMappedId(imageIdMap, image.id, 'Image'),
      })),
    },
    imageIdMap,
  };
}
