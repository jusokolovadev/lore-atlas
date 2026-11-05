import type { CustomReferenceCategory } from '../../domain/models/custom-reference-category';

export interface ReferenceCategoryRepository {
  findById(id: string): Promise<CustomReferenceCategory | null>;

  findActiveByName(
    universeId: string,
    name: string,
  ): Promise<CustomReferenceCategory | null>;

  findAllActiveByUniverseId(universeId: string): Promise<CustomReferenceCategory[]>;

  createIfUniverseActive(category: CustomReferenceCategory): Promise<boolean>;

  update(category: CustomReferenceCategory, expectedRevision: number): Promise<void>;

  restore(category: CustomReferenceCategory, expectedRevision: number): Promise<void>;
}
