import type { ImageReference } from 'src/shared/types/image-reference';

export interface BaseUniverseEntity {
  id: string;
  universeId: string;

  name: string;
  description: string | null;
  image: ImageReference | null;

  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  revision: number;
  isSpoiler: boolean;
}
