import { validateImageFile } from './validate-image-file';

describe('validateImageFile', () => {
  const validInput = {
    mimeType: 'image/png',
    size: 1024,
    maxSize: 5 * 1024 * 1024,
  };

  it('returns valid for a valid image', () => {
    expect(validateImageFile(validInput)).toEqual({
      valid: true,
    });
  });

  it('returns invalid when MIME type is not an image', () => {
    expect(
      validateImageFile({
        ...validInput,
        mimeType: 'application/pdf',
      }),
    ).toEqual({
      valid: false,
      reason: 'INVALID_MIME_TYPE',
    });
  });

  it('returns invalid when MIME type is empty', () => {
    expect(
      validateImageFile({
        ...validInput,
        mimeType: '',
      }),
    ).toEqual({
      valid: false,
      reason: 'INVALID_MIME_TYPE',
    });
  });

  it('returns invalid when size is zero', () => {
    expect(
      validateImageFile({
        ...validInput,
        size: 0,
      }),
    ).toEqual({
      valid: false,
      reason: 'INVALID_SIZE',
    });
  });

  it('returns invalid when size is negative', () => {
    expect(
      validateImageFile({
        ...validInput,
        size: -1,
      }),
    ).toEqual({
      valid: false,
      reason: 'INVALID_SIZE',
    });
  });

  it('returns invalid when size is not an integer', () => {
    expect(
      validateImageFile({
        ...validInput,
        size: 1.5,
      }),
    ).toEqual({
      valid: false,
      reason: 'INVALID_SIZE',
    });
  });

  it('returns invalid when size exceeds the safe integer range', () => {
    expect(
      validateImageFile({
        ...validInput,
        size: Number.MAX_SAFE_INTEGER + 1,
      }),
    ).toEqual({
      valid: false,
      reason: 'INVALID_SIZE',
    });
  });

  it('returns invalid when maxSize is zero', () => {
    expect(
      validateImageFile({
        ...validInput,
        maxSize: 0,
      }),
    ).toEqual({
      valid: false,
      reason: 'INVALID_SIZE',
    });
  });

  it('returns invalid when maxSize is negative', () => {
    expect(
      validateImageFile({
        ...validInput,
        maxSize: -1,
      }),
    ).toEqual({
      valid: false,
      reason: 'INVALID_SIZE',
    });
  });

  it('returns invalid when maxSize is not an integer', () => {
    expect(
      validateImageFile({
        ...validInput,
        maxSize: 1.5,
      }),
    ).toEqual({
      valid: false,
      reason: 'INVALID_SIZE',
    });
  });

  it('returns invalid when file exceeds maximum size', () => {
    expect(
      validateImageFile({
        ...validInput,
        size: validInput.maxSize + 1,
      }),
    ).toEqual({
      valid: false,
      reason: 'FILE_TOO_LARGE',
    });
  });

  it('accepts file with size exactly equal to maximum size', () => {
    expect(
      validateImageFile({
        ...validInput,
        size: validInput.maxSize,
      }),
    ).toEqual({
      valid: true,
    });
  });
});
