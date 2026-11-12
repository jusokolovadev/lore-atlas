import type { StoredImage } from 'src/features/media/domain/models/stored-image';

export interface ImageFileRecord extends StoredImage {
  blob: Blob;
}
