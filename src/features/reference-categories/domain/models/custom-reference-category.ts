export interface CustomReferenceCategory {
  id: string;
  universeId: string;

  name: string;
  description: string | null;

  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
