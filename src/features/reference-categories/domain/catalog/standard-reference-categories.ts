import type { StandardReferenceCategory } from '../models/standard-reference-category';

export const STANDARD_REFERENCE_CATEGORIES = [
  {
    id: 'species',
    name: 'Species',
    description: 'Types of species and races that exist in a universe.',
    isCore: true,
  },
  {
    id: 'organization-types',
    name: 'Organization Types',
    description: 'Types of organizations that exist in a universe.',
    isCore: true,
  },
  {
    id: 'titles',
    name: 'Titles',
    description: 'Titles and forms of address used in a universe.',
    isCore: true,
  },
  {
    id: 'ranks',
    name: 'Ranks',
    description: 'Ranks and hierarchical positions used in a universe.',
    isCore: true,
  },
  {
    id: 'settlement-types',
    name: 'Settlement Types',
    description: 'Types of settlements that exist in a universe.',
    isCore: true,
  },
] as const satisfies readonly StandardReferenceCategory[];

export type StandardReferenceCategoryId =
  (typeof STANDARD_REFERENCE_CATEGORIES)[number]['id'];
