export interface UniverseDeletionRepository {
  deleteUniverseWithCategories(universeId: string, now: string): Promise<void>;
}
