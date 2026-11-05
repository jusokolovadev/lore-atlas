import type { ReferenceEntryLink } from './reference-entry-link';

export interface EventProperties {
  eventType: ReferenceEntryLink | null;

  startDate: string | null;
  endDate: string | null;
  dateDescription: string | null;

  significance: string | null;
  consequences: string | null;
  notes: string | null;
}
