import type { ReferenceEntryLink } from './reference-entry-link';

export interface LocationProperties {
  locationType: ReferenceEntryLink | null;

  terrainTypes: ReferenceEntryLink[];
  biomeTypes: ReferenceEntryLink[];
  climateTypes: ReferenceEntryLink[];

  population: number | null;
  populationDescription: string | null;

  environment: string | null;
  notableFeatures: string | null;
  naturalResources: ReferenceEntryLink[];

  history: string | null;
  dangerLevel: string | null;
  notes: string | null;
}
