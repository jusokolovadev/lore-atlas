import type { ReferenceEntryLink } from './reference-entry-link';

export interface CharacterProperties {
  species: ReferenceEntryLink | null;

  gender: string | null;
  birthDate: string | null;
  deathDate: string | null;
  ageDescription: string | null;

  height: number | null;
  weight: number | null;
  eyeColor: string | null;
  hairColor: string | null;
  appearance: string | null;

  titles: ReferenceEntryLink[];
  rank: ReferenceEntryLink | null;
  socialClass: ReferenceEntryLink | null;
  professions: ReferenceEntryLink[];

  abilities: ReferenceEntryLink[];

  personality: string | null;
  backstory: string | null;
  goals: string | null;
}
