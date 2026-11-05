import type { ImageReference } from 'src/shared/types';

export type ReferenceEntryCategoryType = 'standard' | 'custom';

export interface ReferenceEntry {
  id: string;
  universeId: string;

  categoryType: ReferenceEntryCategoryType;
  categoryId: string;

  name: string;
  description: string | null;
  image: ImageReference | null;

  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  revision: number;
}
