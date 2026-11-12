import type { UniverseExportManifest } from '../models/universe-export';

export type UniverseExportValidationErrorCode =
  | 'DUPLICATE_ID'
  | 'DUPLICATE_IMAGE_PATH'
  | 'INVALID_UNIVERSE_ID'
  | 'MISSING_REFERENCE_CATEGORY'
  | 'MISSING_REFERENCE_ENTRY'
  | 'REFERENCE_CATEGORY_MISMATCH'
  | 'MISSING_ENTITY'
  | 'MISSING_IMAGE';

export interface UniverseExportValidationError {
  code: UniverseExportValidationErrorCode;
  path: string;
  message: string;
}

export type UniverseExportValidationResult =
  { valid: true; errors: [] } | { valid: false; errors: UniverseExportValidationError[] };

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

export function validateUniverseExport(
  manifest: UniverseExportManifest,
): UniverseExportValidationResult {
  const errors: UniverseExportValidationError[] = [];

  const addError = (
    code: UniverseExportValidationErrorCode,
    path: string,
    message: string,
  ) => {
    errors.push({ code, path, message });
  };

  const checkUniqueIds = (
    records: Array<{ id: string }>,
    collectionPath: string,
  ): Set<string> => {
    const ids = new Set<string>();

    records.forEach((record, index) => {
      if (ids.has(record.id)) {
        addError(
          'DUPLICATE_ID',
          `${collectionPath}[${index}].id`,
          `Duplicate ID: ${record.id}.`,
        );
      }

      ids.add(record.id);
    });

    return ids;
  };

  const universeId = manifest.universe.id;

  const categoryIds = checkUniqueIds(manifest.referenceCategories, 'referenceCategories');

  checkUniqueIds(manifest.referenceEntries, 'referenceEntries');

  const entityIds = checkUniqueIds(manifest.universeEntities, 'universeEntities');

  checkUniqueIds(manifest.relationships, 'relationships');

  const imageIds = checkUniqueIds(manifest.images, 'images');

  const imagePaths = new Set<string>();

  manifest.images.forEach((image, index) => {
    if (imagePaths.has(image.path)) {
      addError(
        'DUPLICATE_ID',
        `images[${index}].path`,
        `Duplicate image path: ${image.path}.`,
      );
    }

    imagePaths.add(image.path);
  });

  const checkUniverseId = (id: string, path: string) => {
    if (id !== universeId) {
      addError(
        'INVALID_UNIVERSE_ID',
        path,
        `Expected universe ID "${universeId}", received "${id}".`,
      );
    }
  };

  manifest.referenceCategories.forEach((category, index) => {
    checkUniverseId(category.universeId, `referenceCategories[${index}].universeId`);
  });

  manifest.referenceEntries.forEach((entry, index) => {
    checkUniverseId(entry.universeId, `referenceEntries[${index}].universeId`);

    if (entry.categoryType === 'custom' && !categoryIds.has(entry.categoryId)) {
      addError(
        'MISSING_REFERENCE_CATEGORY',
        `referenceEntries[${index}].categoryId`,
        `Custom reference category not found: ${entry.categoryId}.`,
      );
    }
  });

  manifest.universeEntities.forEach((entity, index) => {
    checkUniverseId(entity.universeId, `universeEntities[${index}].universeId`);
  });

  manifest.relationships.forEach((relationship, index) => {
    checkUniverseId(relationship.universeId, `relationships[${index}].universeId`);

    if (!entityIds.has(relationship.sourceEntityId)) {
      addError(
        'MISSING_ENTITY',
        `relationships[${index}].sourceEntityId`,
        `Source entity not found: ${relationship.sourceEntityId}.`,
      );
    }

    if (!entityIds.has(relationship.targetEntityId)) {
      addError(
        'MISSING_ENTITY',
        `relationships[${index}].targetEntityId`,
        `Target entity not found: ${relationship.targetEntityId}.`,
      );
    }
  });

  const checkImageReference = (
    image: { type: 'url'; url: string } | { type: 'file'; fileId: string } | null,
    path: string,
  ) => {
    if (image?.type === 'file' && !imageIds.has(image.fileId)) {
      addError('MISSING_IMAGE', path, `Image not found: ${image.fileId}.`);
    }
  };

  checkImageReference(manifest.universe.coverImage, 'universe.coverImage');

  manifest.referenceEntries.forEach((entry, index) => {
    checkImageReference(entry.image, `referenceEntries[${index}].image`);
  });

  manifest.universeEntities.forEach((entity, index) => {
    checkImageReference(entity.image, `universeEntities[${index}].image`);
  });

  const checkReferenceEntryLink = (link: ReferenceEntryLinkLike, path: string) => {
    const entry = manifest.referenceEntries.find(
      (candidate) => candidate.id === link.entryId,
    );

    if (!entry) {
      addError(
        'MISSING_REFERENCE_ENTRY',
        path,
        `Reference entry not found: ${link.entryId}.`,
      );
      return;
    }

    if (
      entry.categoryType !== link.categoryType ||
      entry.categoryId !== link.categoryId
    ) {
      addError(
        'REFERENCE_CATEGORY_MISMATCH',
        path,
        `Reference entry "${link.entryId}" does not belong to category "${link.categoryId}".`,
      );
    }
  };

  const visitProperties = (value: unknown, path: string): void => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        visitProperties(item, `${path}[${index}]`);
      });
      return;
    }

    if (isReferenceEntryLink(value)) {
      checkReferenceEntryLink(value, path);
      return;
    }

    if (typeof value !== 'object' || value === null) {
      return;
    }

    Object.entries(value).forEach(([key, nestedValue]) => {
      visitProperties(nestedValue, `${path}.${key}`);
    });
  };

  manifest.universeEntities.forEach((entity, index) => {
    visitProperties(entity.properties, `universeEntities[${index}].properties`);
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [] };
}
