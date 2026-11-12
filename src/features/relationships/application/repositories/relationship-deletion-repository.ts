export interface RelationshipDeletionRepository {
  deleteRelationship(
    id: string,
    expectedRevision: number,
    deletedAt: string,
  ): Promise<void>;
}
