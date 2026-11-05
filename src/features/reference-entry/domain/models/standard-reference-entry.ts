import type { ImageReference } from 'src/shared/types/image-reference';

export interface StandardReferenceEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly image: ImageReference | null;
}
