import type { ImageReference } from 'src/shared/types';

export interface Universe {
  id: string;
  name: string;
  description: string | null;
  coverImage: ImageReference | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
