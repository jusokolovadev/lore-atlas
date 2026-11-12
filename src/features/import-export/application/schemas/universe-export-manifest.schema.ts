import { z } from 'zod';

import {
  characterPropertiesSchema,
  eventPropertiesSchema,
  itemPropertiesSchema,
  locationPropertiesSchema,
  organizationPropertiesSchema,
} from './entity-properties.schema';

const idSchema = z.string().min(1);

const dateSchema = z
  .string()
  .refine((value) => Number.isFinite(Date.parse(value)), 'Invalid date.');

const nullableDateSchema = dateSchema.nullable();

const imageReferenceSchema = z.discriminatedUnion('type', [
  z
    .object({
      type: z.literal('url'),
      url: z.string().url(),
    })
    .strict(),

  z
    .object({
      type: z.literal('file'),
      fileId: idSchema,
    })
    .strict(),
]);

const baseUniverseEntitySchema = z.object({
  id: idSchema,
  universeId: idSchema,

  name: z.string().min(1),
  description: z.string().nullable(),
  image: imageReferenceSchema.nullable(),

  createdAt: dateSchema,
  updatedAt: dateSchema,
  deletedAt: nullableDateSchema,
  revision: z.number().int().positive(),
  isSpoiler: z.boolean(),
});

const universeEntitySchema = z.discriminatedUnion('type', [
  baseUniverseEntitySchema
    .extend({
      type: z.literal('character'),
      properties: characterPropertiesSchema,
    })
    .strict(),

  baseUniverseEntitySchema
    .extend({
      type: z.literal('location'),
      properties: locationPropertiesSchema,
    })
    .strict(),

  baseUniverseEntitySchema
    .extend({
      type: z.literal('event'),
      properties: eventPropertiesSchema,
    })
    .strict(),

  baseUniverseEntitySchema
    .extend({
      type: z.literal('item'),
      properties: itemPropertiesSchema,
    })
    .strict(),

  baseUniverseEntitySchema
    .extend({
      type: z.literal('organization'),
      properties: organizationPropertiesSchema,
    })
    .strict(),
]);

export const universeExportManifestSchema = z
  .object({
    format: z.literal('lore-atlas-universe'),
    version: z.literal(1),
    exportedAt: dateSchema,

    universe: z
      .object({
        id: idSchema,
        name: z.string().min(1),
        description: z.string().nullable(),
        coverImage: imageReferenceSchema.nullable(),
        createdAt: dateSchema,
        updatedAt: dateSchema,
        deletedAt: nullableDateSchema,
        revision: z.number().int().positive(),
        enabledStandardCategoryIds: z.array(idSchema),
      })
      .strict(),

    referenceCategories: z.array(
      z
        .object({
          id: idSchema,
          universeId: idSchema,
          name: z.string().min(1),
          description: z.string().nullable(),
          createdAt: dateSchema,
          updatedAt: dateSchema,
          revision: z.number().int().positive(),
          deletedAt: nullableDateSchema,
        })
        .strict(),
    ),

    referenceEntries: z.array(
      z
        .object({
          id: idSchema,
          universeId: idSchema,
          categoryType: z.enum(['standard', 'custom']),
          categoryId: idSchema,
          name: z.string().min(1),
          description: z.string().nullable(),
          image: imageReferenceSchema.nullable(),
          createdAt: dateSchema,
          updatedAt: dateSchema,
          deletedAt: nullableDateSchema,
          revision: z.number().int().positive(),
          isSpoiler: z.boolean(),
        })
        .strict(),
    ),

    universeEntities: z.array(universeEntitySchema),

    relationships: z.array(
      z
        .object({
          id: idSchema,
          universeId: idSchema,
          sourceEntityId: idSchema,
          targetEntityId: idSchema,
          typeId: idSchema,
          description: z.string().nullable(),
          createdAt: dateSchema,
          updatedAt: dateSchema,
          deletedAt: nullableDateSchema,
          revision: z.number().int().positive(),
          isSpoiler: z.boolean(),
        })
        .strict(),
    ),

    images: z.array(
      z
        .object({
          id: idSchema,
          mimeType: z.string().min(1),
          size: z.number().int().positive(),
          path: z.string().min(1),
          createdAt: z
            .string()
            .refine(
              (value) => Number.isFinite(Date.parse(value)),
              'Invalid creation date.',
            ),
        })
        .strict(),
    ),
  })
  .strict();

export type ParsedUniverseExportManifest = z.infer<typeof universeExportManifestSchema>;
