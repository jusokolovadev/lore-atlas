import { z } from 'zod';

export const referenceEntryLinkSchema = z
  .object({
    categoryType: z.enum(['standard', 'custom']),
    categoryId: z.string().min(1),
    entryId: z.string().min(1),
  })
  .strict();

const nullableReferenceEntryLinkSchema = referenceEntryLinkSchema.nullable();

const referenceEntryLinkArraySchema = z.array(referenceEntryLinkSchema);

export const characterPropertiesSchema = z
  .object({
    species: nullableReferenceEntryLinkSchema,

    gender: z.string().nullable(),
    birthDate: z.string().nullable(),
    deathDate: z.string().nullable(),
    ageDescription: z.string().nullable(),

    height: z.number().finite().nullable(),
    weight: z.number().finite().nullable(),
    eyeColor: z.string().nullable(),
    hairColor: z.string().nullable(),
    appearance: z.string().nullable(),

    titles: referenceEntryLinkArraySchema,
    rank: nullableReferenceEntryLinkSchema,
    socialClass: nullableReferenceEntryLinkSchema,
    professions: referenceEntryLinkArraySchema,

    abilities: referenceEntryLinkArraySchema,

    personality: z.string().nullable(),
    backstory: z.string().nullable(),
    goals: z.string().nullable(),
  })
  .strict();

export const eventPropertiesSchema = z
  .object({
    eventType: nullableReferenceEntryLinkSchema,

    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    dateDescription: z.string().nullable(),

    significance: z.string().nullable(),
    consequences: z.string().nullable(),
    notes: z.string().nullable(),
  })
  .strict();

export const locationPropertiesSchema = z
  .object({
    locationType: nullableReferenceEntryLinkSchema,

    terrainTypes: referenceEntryLinkArraySchema,
    biomeTypes: referenceEntryLinkArraySchema,
    climateTypes: referenceEntryLinkArraySchema,

    population: z.number().finite().nullable(),
    populationDescription: z.string().nullable(),

    environment: z.string().nullable(),
    notableFeatures: z.string().nullable(),
    naturalResources: referenceEntryLinkArraySchema,

    history: z.string().nullable(),
    dangerLevel: z.string().nullable(),
    notes: z.string().nullable(),
  })
  .strict();

export const organizationPropertiesSchema = z
  .object({
    organizationType: nullableReferenceEntryLinkSchema,
    factionType: nullableReferenceEntryLinkSchema,

    structure: z.string().nullable(),
    goals: z.string().nullable(),
    activities: z.string().nullable(),
    ideology: z.string().nullable(),

    foundedDate: z.string().nullable(),
    dissolvedDate: z.string().nullable(),
    memberCount: z.number().finite().nullable(),
    memberCountDescription: z.string().nullable(),

    history: z.string().nullable(),
    resources: referenceEntryLinkArraySchema,
    notes: z.string().nullable(),
  })
  .strict();

export const itemPropertiesSchema = z
  .object({
    itemType: nullableReferenceEntryLinkSchema,
    rarity: nullableReferenceEntryLinkSchema,

    materials: referenceEntryLinkArraySchema,
    weight: z.number().finite().nullable(),
    dimensions: z.string().nullable(),
    condition: nullableReferenceEntryLinkSchema,

    abilities: referenceEntryLinkArraySchema,
    effects: z.string().nullable(),
    appearance: z.string().nullable(),

    history: z.string().nullable(),
    notes: z.string().nullable(),
  })
  .strict();
