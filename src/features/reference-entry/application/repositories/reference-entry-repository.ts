import type {
  ReferenceEntry,
  ReferenceEntryCategoryType,
} from '../../domain/models/reference-entry';

export interface ReferenceEntryRepository {
  findById(id: string): Promise<ReferenceEntry | null>;

  findAllActiveByCategory(
    universeId: string,
    categoryType: ReferenceEntryCategoryType,
    categoryId: string,
  ): Promise<ReferenceEntry[]>;

  findAllActiveByUniverseId(universeId: string): Promise<ReferenceEntry[]>;

  createIfCategoryAvailable(entry: ReferenceEntry): Promise<void>;

  update(entry: ReferenceEntry, expectedRevision: number): Promise<void>;

  restore(entry: ReferenceEntry, expectedRevision: number): Promise<void>;
}
