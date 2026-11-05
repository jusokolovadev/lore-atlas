import type { ReferenceEntryCategoryType } from '../../../reference-entry/domain/models/reference-entry';

export interface ReferenceEntryLink {
  categoryType: ReferenceEntryCategoryType;
  categoryId: string;
  entryId: string;
}
