export interface Relationship {
  id: string;
  universeId: string;

  sourceEntityId: string;
  targetEntityId: string;

  typeId: string;

  description: string | null;

  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  revision: number;
  isSpoiler: boolean;
}
