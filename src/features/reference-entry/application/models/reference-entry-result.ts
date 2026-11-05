import type { ReferenceEntry } from '../../domain/models/reference-entry';
import type { StandardReferenceEntry } from '../../domain/models/standard-reference-entry';

export type ReferenceEntryResult =
  | {
      source: 'standard';
      entry: StandardReferenceEntry;
    }
  | {
      source: 'custom';
      entry: ReferenceEntry;
    };
