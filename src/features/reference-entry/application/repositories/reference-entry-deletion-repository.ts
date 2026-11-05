export interface ReferenceEntryDeletionRepository {
  deleteReferenceEntry(
    id: string,
    expectedRevision: number,
    deletedAt: string,
  ): Promise<void>;
}
