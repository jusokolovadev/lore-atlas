import { validateUniverseExport } from './validate-universe-export';
import { createUniverseExportManifest } from './__tests__/fixtures/create-universe-export-manifest';

describe('validateUniverseExport', () => {
  it('accepts a valid manifest', () => {
    const result = validateUniverseExport(createUniverseExportManifest());

    expect(result).toEqual({
      valid: true,
      errors: [],
    });
  });

  it('detects duplicate IDs', () => {
    const manifest = createUniverseExportManifest();

    manifest.referenceEntries[1].id = manifest.referenceEntries[0].id;

    const result = validateUniverseExport(manifest);

    expect(result.valid).toBe(false);

    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'DUPLICATE_ID',
          path: 'referenceEntries[1].id',
        }),
      );
    }
  });

  it('detects duplicate image paths', () => {
    const manifest = createUniverseExportManifest();

    manifest.images.push({
      ...manifest.images[0],
      id: 'image-2',
    });

    const result = validateUniverseExport(manifest);

    expect(result.valid).toBe(false);

    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'DUPLICATE_ID',
          path: 'images[1].path',
        }),
      );
    }
  });

  it('detects children belonging to another universe', () => {
    const manifest = createUniverseExportManifest();

    manifest.referenceCategories[0].universeId = 'another-universe';

    const result = validateUniverseExport(manifest);

    expect(result.valid).toBe(false);

    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_UNIVERSE_ID',
          path: 'referenceCategories[0].universeId',
        }),
      );
    }
  });

  it('detects missing custom categories', () => {
    const manifest = createUniverseExportManifest();

    manifest.referenceEntries[0].categoryId = 'missing-category';

    const result = validateUniverseExport(manifest);

    expect(result.valid).toBe(false);

    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_REFERENCE_CATEGORY',
          path: 'referenceEntries[0].categoryId',
        }),
      );
    }
  });

  it('detects missing relationship entities', () => {
    const manifest = createUniverseExportManifest();

    manifest.relationships[0].sourceEntityId = 'missing-entity';

    const result = validateUniverseExport(manifest);

    expect(result.valid).toBe(false);

    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_ENTITY',
          path: 'relationships[0].sourceEntityId',
        }),
      );
    }
  });

  it('detects missing image files', () => {
    const manifest = createUniverseExportManifest();

    manifest.universe.coverImage = {
      type: 'file',
      fileId: 'missing-image',
    };

    const result = validateUniverseExport(manifest);

    expect(result.valid).toBe(false);

    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_IMAGE',
          path: 'universe.coverImage',
        }),
      );
    }
  });

  it('detects missing reference entries in entity properties', () => {
    const manifest = createUniverseExportManifest();

    const character = manifest.universeEntities.find(
      (entity) => entity.type === 'character',
    );

    if (!character || character.type !== 'character') {
      throw new Error('Expected character entity.');
    }

    character.properties.species = {
      categoryType: 'custom',
      categoryId: 'category-1',
      entryId: 'missing-entry',
    };

    const result = validateUniverseExport(manifest);

    expect(result.valid).toBe(false);

    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'MISSING_REFERENCE_ENTRY',
        }),
      );
    }
  });

  it('detects category mismatches in entity properties', () => {
    const manifest = createUniverseExportManifest();

    const character = manifest.universeEntities.find(
      (entity) => entity.type === 'character',
    );

    if (!character || character.type !== 'character') {
      throw new Error('Expected character entity.');
    }

    character.properties.species = {
      categoryType: 'custom',
      categoryId: 'another-category',
      entryId: 'entry-1',
    };

    const result = validateUniverseExport(manifest);

    expect(result.valid).toBe(false);

    if (!result.valid) {
      expect(result.errors).toContainEqual(
        expect.objectContaining({
          code: 'REFERENCE_CATEGORY_MISMATCH',
        }),
      );
    }
  });

  it('does not mutate the original manifest', () => {
    const manifest = createUniverseExportManifest();
    const original = structuredClone(manifest);

    validateUniverseExport(manifest);

    expect(manifest).toEqual(original);
  });

  it('collects multiple validation errors', () => {
    const manifest = createUniverseExportManifest();

    manifest.referenceCategories[0].universeId = 'another-universe';
    manifest.universe.coverImage = {
      type: 'file',
      fileId: 'missing-image',
    };

    const result = validateUniverseExport(manifest);

    expect(result.valid).toBe(false);

    if (!result.valid) {
      expect(result.errors).toHaveLength(2);
    }
  });
});
