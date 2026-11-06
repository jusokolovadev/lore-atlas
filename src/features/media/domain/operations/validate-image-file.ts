export interface ValidateImageFileInput {
  mimeType: string;
  size: number;
  maxSize: number;
}

export type ImageFileValidationResult =
  | { valid: true }
  | {
      valid: false;
      reason: 'INVALID_MIME_TYPE' | 'INVALID_SIZE' | 'FILE_TOO_LARGE';
    };

export function validateImageFile(
  input: ValidateImageFileInput,
): ImageFileValidationResult {
  if (!input.mimeType.startsWith('image/')) {
    return {
      valid: false,
      reason: 'INVALID_MIME_TYPE',
    };
  }

  if (
    !Number.isSafeInteger(input.size) ||
    input.size <= 0 ||
    !Number.isSafeInteger(input.maxSize) ||
    input.maxSize <= 0
  ) {
    return {
      valid: false,
      reason: 'INVALID_SIZE',
    };
  }

  if (input.size > input.maxSize) {
    return {
      valid: false,
      reason: 'FILE_TOO_LARGE',
    };
  }

  return { valid: true };
}
