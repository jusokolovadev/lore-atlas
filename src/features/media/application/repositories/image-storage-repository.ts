import type { StoredImage } from '../../domain/models/stored-image';

export interface ImageStorageRepository {
  save(image: StoredImage, blob: Blob): Promise<void>;
  findById(id: string): Promise<StoredImage | null>;
  findAll(): Promise<StoredImage[]>;
  findContentById(id: string): Promise<Blob | null>;
  delete(id: string): Promise<void>;
}
