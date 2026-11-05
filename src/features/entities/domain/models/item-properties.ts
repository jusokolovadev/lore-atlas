import type { ReferenceEntryLink } from './reference-entry-link';

export interface ItemProperties {
  itemType: ReferenceEntryLink | null;
  rarity: ReferenceEntryLink | null;

  materials: ReferenceEntryLink[];
  weight: number | null;
  dimensions: string | null;
  condition: ReferenceEntryLink | null;

  abilities: ReferenceEntryLink[];
  effects: string | null;
  appearance: string | null;

  history: string | null;
  notes: string | null;
}
