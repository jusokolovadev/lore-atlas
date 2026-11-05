export interface EntityDeletionRepository {
  deleteEntity(id: string, expectedRevision: number, deletedAt: string): Promise<void>;
}
