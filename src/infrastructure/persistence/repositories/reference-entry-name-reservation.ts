import type { ReferenceEntryCategoryType } from 'src/features/reference-entry/domain/models/reference-entry';

export interface ReferenceEntryNameReservation {
  universeId: string;
  categoryType: ReferenceEntryCategoryType;
  categoryId: string;
  name: string;
  entryId: string;
}
