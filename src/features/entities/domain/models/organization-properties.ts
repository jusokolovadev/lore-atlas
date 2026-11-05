import type { ReferenceEntryLink } from './reference-entry-link';

export interface OrganizationProperties {
  organizationType: ReferenceEntryLink | null;
  factionType: ReferenceEntryLink | null;

  structure: string | null;
  goals: string | null;
  activities: string | null;
  ideology: string | null;

  foundedDate: string | null;
  dissolvedDate: string | null;
  memberCount: number | null;
  memberCountDescription: string | null;

  history: string | null;
  resources: ReferenceEntryLink[];
  notes: string | null;
}
