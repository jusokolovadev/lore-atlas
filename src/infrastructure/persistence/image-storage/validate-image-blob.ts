export type SupportedImageMimeType =
  'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';

export interface ImageDecoder {
  (blob: Blob): Promise<{ close: () => void }>;
}

const IMAGE_SIGNATURES: Record<SupportedImageMimeType, number[][]> = {
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  ],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],
};

function hasSignature(bytes: Uint8Array, signatures: number[][]): boolean {
  return signatures.some((signature) =>
    signature.every((byte, index) => bytes[index] === byte),
  );
}

async function readBlobAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  if (typeof blob.arrayBuffer === 'function') {
    return blob.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Unable to read image content.'));
      }
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error('Unable to read image content.'));
    };

    reader.readAsArrayBuffer(blob);
  });
}

export async function validateImageBlob(
  blob: Blob,
  decodeImage: ImageDecoder = createImageBitmap,
): Promise<void> {
  const mimeType = blob.type as SupportedImageMimeType;
  const signatures = IMAGE_SIGNATURES[mimeType];

  if (!signatures) {
    throw new Error('Unsupported image format.');
  }

  const header = new Uint8Array(await readBlobAsArrayBuffer(blob.slice(0, 12)));

  if (!hasSignature(header, signatures)) {
    throw new Error('Image content does not match its MIME type.');
  }

  if (
    mimeType === 'image/webp' &&
    String.fromCharCode(...header.slice(8, 12)) !== 'WEBP'
  ) {
    throw new Error('Invalid WebP image signature.');
  }

  let decodedImage: Awaited<ReturnType<ImageDecoder>>;

  try {
    decodedImage = await decodeImage(blob);
  } catch {
    throw new Error('Image content cannot be decoded.');
  }

  decodedImage.close();
}
