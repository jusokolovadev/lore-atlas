import { universeExportManifestSchema } from './universe-export-manifest.schema';

import { createUniverseExportManifest } from 'src/features/import-export/domain/operations/__tests__/fixtures/create-universe-export-manifest';

describe('universeExportManifestSchema', () => {
  it('accepts a valid manifest', () => {
    const result = universeExportManifestSchema.safeParse(createUniverseExportManifest());
    expect(result.success).toBe(true);
  });

  it('rejects an unsupported format', () => {
    const manifest = createUniverseExportManifest();

    const result = universeExportManifestSchema.safeParse({
      ...manifest,
      format: 'another-format',
    });

    expect(result.success).toBe(false);
  });

  it('rejects an unsupported version', () => {
    const manifest = createUniverseExportManifest();

    const result = universeExportManifestSchema.safeParse({
      ...manifest,
      version: 2,
    });

    expect(result.success).toBe(false);
  });

  it('rejects missing required fields', () => {
    const manifest = createUniverseExportManifest();

    const { name: _name, ...universeWithoutName } = manifest.universe;

    const result = universeExportManifestSchema.safeParse({
      ...manifest,
      universe: universeWithoutName,
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid dates', () => {
    const manifest = createUniverseExportManifest();

    const result = universeExportManifestSchema.safeParse({
      ...manifest,
      exportedAt: 'not-a-date',
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid image references', () => {
    const manifest = createUniverseExportManifest();

    const result = universeExportManifestSchema.safeParse({
      ...manifest,
      universe: {
        ...manifest.universe,
        coverImage: {
          type: 'file',
          url: 'https://example.com/image.png',
        },
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects an invalid entity type', () => {
    const manifest = createUniverseExportManifest();

    const result = universeExportManifestSchema.safeParse({
      ...manifest,
      universeEntities: [
        {
          ...manifest.universeEntities[0],
          type: 'unknown',
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('rejects properties that do not match the entity type', () => {
    const manifest = createUniverseExportManifest();

    const character = manifest.universeEntities.find(
      (entity) => entity.type === 'character',
    );

    if (!character || character.type !== 'character') {
      throw new Error('Expected character entity.');
    }

    const result = universeExportManifestSchema.safeParse({
      ...manifest,
      universeEntities: [
        {
          ...character,
          properties: {
            locationType: null,
            terrainTypes: [],
          },
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('rejects malformed reference entry links', () => {
    const manifest = createUniverseExportManifest();

    const character = manifest.universeEntities.find(
      (entity) => entity.type === 'character',
    );

    if (!character || character.type !== 'character') {
      throw new Error('Expected character entity.');
    }

    const result = universeExportManifestSchema.safeParse({
      ...manifest,
      universeEntities: [
        {
          ...character,
          properties: {
            ...character.properties,
            species: {
              categoryType: 'custom',
              categoryId: 'category-1',
            },
          },
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('rejects unknown fields', () => {
    const manifest = createUniverseExportManifest();

    const result = universeExportManifestSchema.safeParse({
      ...manifest,
      unexpectedField: true,
    });

    expect(result.success).toBe(false);
  });

  it('rejects invalid image metadata', () => {
    const manifest = createUniverseExportManifest();

    const result = universeExportManifestSchema.safeParse({
      ...manifest,
      images: [
        {
          ...manifest.images[0],
          size: -1,
        },
      ],
    });

    expect(result.success).toBe(false);
  });
});
