import type { UniverseExportManifest } from '../models/universe-export';

import { remapUniverseExport } from './remap-universe-export';
import { LocationProperties } from 'src/features/entities/domain/models/location-properties';
import { CharacterProperties } from 'src/features/entities/domain/models/character-properties';

describe('remapUniverseExport', () => {
  let manifest: UniverseExportManifest;
  let generateId: jest.Mock<string, []>;

  beforeEach(() => {
    let counter = 0;

    generateId = jest.fn(() => {
      counter += 1;
      return `new-id-${counter}`;
    });

    manifest = {
      format: 'lore-atlas-universe',
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',

      universe: {
        id: 'universe-1',
        name: 'Test Universe',
        description: 'Universe description',
        coverImage: {
          type: 'file',
          fileId: 'image-1',
        },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-02T00:00:00.000Z',
        deletedAt: null,
        revision: 5,
        enabledStandardCategoryIds: ['characters', 'locations'],
      },

      referenceCategories: [
        {
          id: 'category-1',
          universeId: 'universe-1',
          name: 'Custom category',
          description: 'Category description',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          deletedAt: null,
          revision: 3,
        },
      ],

      referenceEntries: [
        {
          id: 'entry-1',
          universeId: 'universe-1',
          categoryType: 'custom',
          categoryId: 'category-1',
          name: 'Custom entry',
          description: 'Entry description',
          image: {
            type: 'file',
            fileId: 'image-2',
          },
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          deletedAt: null,
          revision: 4,
          isSpoiler: false,
        },
        {
          id: 'entry-2',
          universeId: 'universe-1',
          categoryType: 'standard',
          categoryId: 'characters',
          name: 'Standard entry',
          description: null,
          image: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          deletedAt: null,
          revision: 2,
          isSpoiler: false,
        },
      ],

      universeEntities: [
        {
          id: 'entity-1',
          universeId: 'universe-1',
          type: 'character',
          name: 'Character',
          description: 'Character description',
          image: {
            type: 'file',
            fileId: 'image-3',
          },
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          deletedAt: null,
          revision: 7,
          isSpoiler: false,
          properties: {
            species: {
              categoryType: 'custom',
              categoryId: 'category-1',
              entryId: 'entry-1',
            },
            titles: [
              {
                categoryType: 'standard',
                categoryId: 'standard-category-1',
                entryId: 'entry-2',
              },
            ],
          } as unknown as CharacterProperties,
        },
        {
          id: 'entity-2',
          universeId: 'universe-1',
          type: 'location',
          name: 'Location',
          description: null,
          image: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          deletedAt: null,
          revision: 2,
          isSpoiler: false,
          properties: {} as unknown as LocationProperties,
        },
      ],

      relationships: [
        {
          id: 'relationship-1',
          universeId: 'universe-1',
          sourceEntityId: 'entity-1',
          targetEntityId: 'entity-2',
          typeId: 'friendship',
          description: 'Relationship description',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
          deletedAt: null,
          revision: 6,
          isSpoiler: false,
        },
      ],

      images: [
        {
          id: 'image-1',
          mimeType: 'image/png',
          size: 100,
          path: 'images/image-1.png',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'image-2',
          mimeType: 'image/jpeg',
          size: 200,
          path: 'images/image-2.jpeg',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: 'image-3',
          mimeType: 'image/webp',
          size: 300,
          path: 'images/image-3.webp',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    };
  });

  it('generates new IDs for all imported records', () => {
    const result = remapUniverseExport(manifest, { generateId });

    expect(result.manifest.universe.id).toBe('new-id-1');

    expect(result.manifest.referenceCategories[0].id).toBe('new-id-2');

    expect(result.manifest.referenceEntries.map((entry) => entry.id)).toEqual([
      'new-id-3',
      'new-id-4',
    ]);

    expect(result.manifest.universeEntities.map((entity) => entity.id)).toEqual([
      'new-id-5',
      'new-id-6',
    ]);

    expect(result.manifest.relationships[0].id).toBe('new-id-7');

    expect(result.manifest.images.map((image) => image.id)).toEqual([
      'new-id-8',
      'new-id-9',
      'new-id-10',
    ]);

    expect(generateId).toHaveBeenCalledTimes(10);
  });

  it('returns the image ID mapping', () => {
    const result = remapUniverseExport(manifest, { generateId });

    expect(result.imageIdMap).toEqual(
      new Map([
        ['image-1', 'new-id-8'],
        ['image-2', 'new-id-9'],
        ['image-3', 'new-id-10'],
      ]),
    );
  });

  it('updates the universe ID and resets its revision', () => {
    const result = remapUniverseExport(manifest, { generateId });

    expect(result.manifest.universe).toEqual({
      ...manifest.universe,
      id: 'new-id-1',
      revision: 1,
      coverImage: {
        type: 'file',
        fileId: 'new-id-8',
      },
    });
  });

  it('updates custom category IDs and universe IDs', () => {
    const result = remapUniverseExport(manifest, { generateId });

    expect(result.manifest.referenceCategories[0]).toEqual({
      ...manifest.referenceCategories[0],
      id: 'new-id-2',
      universeId: 'new-id-1',
      revision: 1,
    });
  });

  it('updates reference entry IDs and custom category references', () => {
    const result = remapUniverseExport(manifest, { generateId });

    expect(result.manifest.referenceEntries).toEqual([
      {
        ...manifest.referenceEntries[0],
        id: 'new-id-3',
        universeId: 'new-id-1',
        categoryId: 'new-id-2',
        image: {
          type: 'file',
          fileId: 'new-id-9',
        },
        revision: 1,
      },
      {
        ...manifest.referenceEntries[1],
        id: 'new-id-4',
        universeId: 'new-id-1',
        categoryId: 'characters',
        revision: 1,
      },
    ]);
  });

  it('updates entity IDs, universe IDs and image references', () => {
    const result = remapUniverseExport(manifest, { generateId });

    expect(result.manifest.universeEntities[0]).toEqual({
      ...manifest.universeEntities[0],
      properties: {
        species: {
          categoryType: 'custom',
          categoryId: 'new-id-2',
          entryId: 'new-id-3',
        },
        titles: [
          {
            categoryType: 'standard',
            categoryId: 'standard-category-1',
            entryId: 'new-id-4',
          },
        ],
      },
      id: 'new-id-5',
      universeId: 'new-id-1',
      image: {
        type: 'file',
        fileId: 'new-id-10',
      },
      revision: 1,
    });

    expect(result.manifest.universeEntities[1]).toEqual({
      ...manifest.universeEntities[1],

      id: 'new-id-6',
      universeId: 'new-id-1',
      revision: 1,
    });
  });

  it('remaps reference entry links inside entity properties', () => {
    const result = remapUniverseExport(manifest, { generateId });

    expect(result.manifest.universeEntities[0].properties).toMatchObject({
      species: {
        categoryType: 'custom',
        categoryId: 'new-id-2',
        entryId: 'new-id-3',
      },
      titles: [
        {
          categoryType: 'standard',
          categoryId: 'standard-category-1',
          entryId: 'new-id-4',
        },
      ],
    });
  });

  it('remaps reference entry links recursively inside nested properties', () => {
    const nestedManifest = structuredClone(manifest);

    const character = nestedManifest.universeEntities[0];

    if (character.type !== 'character') {
      throw new Error('Expected character entity.');
    }

    character.properties = {
      ...character.properties,
      species: {
        categoryType: 'custom',
        categoryId: 'category-1',
        entryId: 'entry-1',
      },
    };

    const result = remapUniverseExport(nestedManifest, { generateId });

    expect(result.manifest.universeEntities[0]).toMatchObject({
      properties: {
        species: {
          categoryType: 'custom',
          categoryId: 'new-id-2',
          entryId: 'new-id-3',
        },
      },
    });
  });

  it('updates relationship IDs and entity references', () => {
    const result = remapUniverseExport(manifest, { generateId });

    expect(result.manifest.relationships[0]).toEqual({
      ...manifest.relationships[0],
      id: 'new-id-7',
      universeId: 'new-id-1',
      sourceEntityId: 'new-id-5',
      targetEntityId: 'new-id-6',
      revision: 1,
    });
  });

  it('updates image metadata IDs without changing image paths', () => {
    const result = remapUniverseExport(manifest, { generateId });

    expect(result.manifest.images).toEqual([
      {
        ...manifest.images[0],
        id: 'new-id-8',
      },
      {
        ...manifest.images[1],
        id: 'new-id-9',
      },
      {
        ...manifest.images[2],
        id: 'new-id-10',
      },
    ]);
  });

  it('preserves external image URLs', () => {
    const urlManifest = structuredClone(manifest);

    urlManifest.universe.coverImage = {
      type: 'url',
      url: 'https://example.com/cover.png',
    };

    const result = remapUniverseExport(urlManifest, { generateId });

    expect(result.manifest.universe.coverImage).toEqual({
      type: 'url',
      url: 'https://example.com/cover.png',
    });
  });

  it('preserves timestamps and deletedAt values', () => {
    const deletedManifest = structuredClone(manifest);

    deletedManifest.universe.deletedAt = '2026-01-03T00:00:00.000Z';
    deletedManifest.referenceCategories[0].deletedAt = '2026-01-04T00:00:00.000Z';
    deletedManifest.referenceEntries[0].deletedAt = '2026-01-05T00:00:00.000Z';
    deletedManifest.universeEntities[0].deletedAt = '2026-01-06T00:00:00.000Z';
    deletedManifest.relationships[0].deletedAt = '2026-01-07T00:00:00.000Z';

    const result = remapUniverseExport(deletedManifest, { generateId });

    expect(result.manifest.universe.deletedAt).toBe(deletedManifest.universe.deletedAt);
    expect(result.manifest.referenceCategories[0].deletedAt).toBe(
      deletedManifest.referenceCategories[0].deletedAt,
    );
    expect(result.manifest.referenceEntries[0].deletedAt).toBe(
      deletedManifest.referenceEntries[0].deletedAt,
    );
    expect(result.manifest.universeEntities[0].deletedAt).toBe(
      deletedManifest.universeEntities[0].deletedAt,
    );
    expect(result.manifest.relationships[0].deletedAt).toBe(
      deletedManifest.relationships[0].deletedAt,
    );

    expect(result.manifest.universe.createdAt).toBe(deletedManifest.universe.createdAt);
    expect(result.manifest.universe.updatedAt).toBe(deletedManifest.universe.updatedAt);
  });

  it('resets revisions of all imported records to 1', () => {
    const result = remapUniverseExport(manifest, { generateId });

    expect(result.manifest.universe.revision).toBe(1);
    expect(result.manifest.referenceCategories.every((item) => item.revision === 1)).toBe(
      true,
    );
    expect(result.manifest.referenceEntries.every((item) => item.revision === 1)).toBe(
      true,
    );
    expect(result.manifest.universeEntities.every((item) => item.revision === 1)).toBe(
      true,
    );
    expect(result.manifest.relationships.every((item) => item.revision === 1)).toBe(true);
  });

  it('does not mutate the original manifest', () => {
    const originalManifest = structuredClone(manifest);

    remapUniverseExport(manifest, { generateId });

    expect(manifest).toEqual(originalManifest);
  });

  it('throws when an entity reference points to a missing entry', () => {
    const invalidManifest = structuredClone(manifest);

    const character = invalidManifest.universeEntities[0];

    if (character.type !== 'character') {
      throw new Error('Expected character entity.');
    }

    character.properties = {
      ...character.properties,
      species: {
        categoryType: 'custom',
        categoryId: 'category-1',
        entryId: 'missing-entry',
      },
    };

    expect(() => remapUniverseExport(invalidManifest, { generateId })).toThrow(
      'Reference entry not found: missing-entry.',
    );
  });

  it('throws when an entity reference points to a missing custom category', () => {
    const invalidManifest = structuredClone(manifest);

    const character = invalidManifest.universeEntities[0];

    if (character.type !== 'character') {
      throw new Error('Expected character entity.');
    }

    character.properties = {
      ...character.properties,
      species: {
        categoryType: 'custom',
        categoryId: 'missing-category',
        entryId: 'entry-1',
      },
    };

    expect(() => remapUniverseExport(invalidManifest, { generateId })).toThrow(
      'Reference category not found: missing-category.',
    );
  });

  it('throws when a relationship references a missing source entity', () => {
    const invalidManifest = structuredClone(manifest);

    invalidManifest.relationships[0].sourceEntityId = 'missing-entity';

    expect(() => remapUniverseExport(invalidManifest, { generateId })).toThrow(
      'Source entity not found: missing-entity.',
    );
  });

  it('throws when a relationship references a missing target entity', () => {
    const invalidManifest = structuredClone(manifest);

    invalidManifest.relationships[0].targetEntityId = 'missing-entity';

    expect(() => remapUniverseExport(invalidManifest, { generateId })).toThrow(
      'Target entity not found: missing-entity.',
    );
  });

  it('throws when an image reference points to a missing image', () => {
    const invalidManifest = structuredClone(manifest);

    invalidManifest.universe.coverImage = {
      type: 'file',
      fileId: 'missing-image',
    };

    expect(() => remapUniverseExport(invalidManifest, { generateId })).toThrow(
      'Image not found: missing-image.',
    );
  });
});
