import { createStoredImage } from './create-stored-image';

describe('createStoredImage', () => {
  const validInput = {
    id: 'image-1',
    mimeType: 'image/png',
    size: 1024,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  it('creates a stored image', () => {
    expect(createStoredImage(validInput)).toEqual({
      id: 'image-1',
      mimeType: 'image/png',
      size: 1024,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
  });

  it('does not mutate the input', () => {
    const input = { ...validInput };

    createStoredImage(input);

    expect(input).toEqual(validInput);
  });

  it('throws when ID is empty', () => {
    expect(() =>
      createStoredImage({
        ...validInput,
        id: ' ',
      }),
    ).toThrow('Image ID is required.');
  });

  it('throws when MIME type is not an image', () => {
    expect(() =>
      createStoredImage({
        ...validInput,
        mimeType: 'application/pdf',
      }),
    ).toThrow('File must be an image.');
  });

  it('throws when MIME type is empty', () => {
    expect(() =>
      createStoredImage({
        ...validInput,
        mimeType: '',
      }),
    ).toThrow('File must be an image.');
  });

  it('throws when size is zero', () => {
    expect(() =>
      createStoredImage({
        ...validInput,
        size: 0,
      }),
    ).toThrow('Image size must be a positive safe integer.');
  });

  it('throws when size is negative', () => {
    expect(() =>
      createStoredImage({
        ...validInput,
        size: -1,
      }),
    ).toThrow('Image size must be a positive safe integer.');
  });

  it('throws when size is not an integer', () => {
    expect(() =>
      createStoredImage({
        ...validInput,
        size: 1.5,
      }),
    ).toThrow('Image size must be a positive safe integer.');
  });

  it('throws when size is not a safe integer', () => {
    expect(() =>
      createStoredImage({
        ...validInput,
        size: Number.MAX_SAFE_INTEGER + 1,
      }),
    ).toThrow('Image size must be a positive safe integer.');
  });

  it('throws when creation date is invalid', () => {
    expect(() =>
      createStoredImage({
        ...validInput,
        createdAt: 'invalid-date',
      }),
    ).toThrow('Invalid creation date.');
  });
});
