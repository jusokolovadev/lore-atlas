import type { ImageReference } from 'src/shared/types/image-reference';

export function remapImageReference(
  image: ImageReference | null,
  imageIdMap: ReadonlyMap<string, string>,
): ImageReference | null {
  if (!image || image.type === 'url') {
    return image;
  }

  const newFileId = imageIdMap.get(image.fileId);

  if (!newFileId) {
    throw new Error(`Image reference not found: ${image.fileId}.`);
  }

  return {
    type: 'file',
    fileId: newFileId,
  };
}
