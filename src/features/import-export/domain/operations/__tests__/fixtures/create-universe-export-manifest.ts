import type { UniverseExportManifest } from 'src/features/import-export/domain/models/universe-export';

export function createUniverseExportManifest(): UniverseExportManifest {
  return {
    format: 'lore-atlas-universe',
    version: 1,
    exportedAt: '2026-11-06T10:00:00.000Z',

    universe: {
      id: 'universe-1',
      name: 'Test Universe',
      description: null,
      coverImage: { type: 'file', fileId: 'image-1' },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-02-01T00:00:00.000Z',
      deletedAt: null,
      revision: 5,
      enabledStandardCategoryIds: ['standard-category-1'],
    },

    referenceCategories: [
      {
        id: 'category-1',
        universeId: 'universe-1',
        name: 'Custom category',
        description: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
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
        description: null,
        image: { type: 'file', fileId: 'image-1' },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
        deletedAt: null,
        revision: 4,
        isSpoiler: false,
      },
      {
        id: 'entry-2',
        universeId: 'universe-1',
        categoryType: 'standard',
        categoryId: 'standard-category-1',
        name: 'Standard entry',
        description: null,
        image: { type: 'url', url: 'https://example.com/image.png' },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
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
        name: 'Test Character',
        description: null,
        image: { type: 'file', fileId: 'image-1' },
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
        deletedAt: null,
        revision: 7,
        isSpoiler: true,
        properties: {
          species: {
            categoryType: 'custom',
            categoryId: 'category-1',
            entryId: 'entry-1',
          },
          gender: null,
          birthDate: null,
          deathDate: null,
          ageDescription: null,
          height: null,
          weight: null,
          eyeColor: null,
          hairColor: null,
          appearance: null,
          titles: [
            {
              categoryType: 'standard',
              categoryId: 'standard-category-1',
              entryId: 'entry-2',
            },
          ],
          rank: null,
          socialClass: null,
          professions: [],
          abilities: [],
          personality: null,
          backstory: null,
          goals: null,
        },
      },
    ],

    relationships: [
      {
        id: 'relationship-1',
        universeId: 'universe-1',
        sourceEntityId: 'entity-1',
        targetEntityId: 'entity-1',
        typeId: 'friendship',
        description: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-02-01T00:00:00.000Z',
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
        createdAt: '2026-01-01T00:00:00.000Z',
        path: 'images/image-1.png',
      },
    ],
  } as UniverseExportManifest;
}
