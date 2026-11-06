import { validateImageBlob, type ImageDecoder } from './validate-image-blob';

describe('validateImageBlob', () => {
  const decodeImage: jest.MockedFunction<ImageDecoder> = jest.fn();
  beforeEach(() => {
    jest.clearAllMocks();

    decodeImage.mockResolvedValue({
      close: jest.fn(),
    });
  });

  it('accepts a valid PNG image', async () => {
    const blob = new Blob(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
      { type: 'image/png' },
    );

    await expect(validateImageBlob(blob, decodeImage)).resolves.toBeUndefined();

    expect(decodeImage).toHaveBeenCalledWith(blob);
  });

  it('accepts a valid JPEG image signature', async () => {
    const blob = new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: 'image/jpeg' });

    await expect(validateImageBlob(blob, decodeImage)).resolves.toBeUndefined();
  });

  it('accepts a valid GIF image signature', async () => {
    const blob = new Blob([new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])], {
      type: 'image/gif',
    });

    await expect(validateImageBlob(blob, decodeImage)).resolves.toBeUndefined();
  });

  it('accepts a valid WebP image signature', async () => {
    const blob = new Blob(
      [
        new Uint8Array([
          0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
        ]),
      ],
      { type: 'image/webp' },
    );

    await expect(validateImageBlob(blob, decodeImage)).resolves.toBeUndefined();
  });

  it('rejects unsupported MIME types', async () => {
    const blob = new Blob(['content'], {
      type: 'image/svg+xml',
    });

    await expect(validateImageBlob(blob, decodeImage)).rejects.toThrow(
      'Unsupported image format.',
    );

    expect(decodeImage).not.toHaveBeenCalled();
  });

  it('rejects content with an invalid signature', async () => {
    const blob = new Blob([new Uint8Array([0x00, 0x01, 0x02, 0x03])], {
      type: 'image/png',
    });

    await expect(validateImageBlob(blob, decodeImage)).rejects.toThrow(
      'Image content does not match its MIME type.',
    );

    expect(decodeImage).not.toHaveBeenCalled();
  });

  it('rejects WebP content without the WEBP marker', async () => {
    const blob = new Blob(
      [
        new Uint8Array([
          0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        ]),
      ],
      { type: 'image/webp' },
    );

    await expect(validateImageBlob(blob, decodeImage)).rejects.toThrow(
      'Invalid WebP image signature.',
    );

    expect(decodeImage).not.toHaveBeenCalled();
  });

  it('rejects content that cannot be decoded', async () => {
    const blob = new Blob(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
      { type: 'image/png' },
    );

    decodeImage.mockRejectedValueOnce(new Error('Decode error'));

    await expect(validateImageBlob(blob, decodeImage)).rejects.toThrow(
      'Image content cannot be decoded.',
    );
  });

  it('closes the decoded image', async () => {
    const close = jest.fn();

    decodeImage.mockResolvedValueOnce({ close });

    const blob = new Blob(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
      { type: 'image/png' },
    );

    await validateImageBlob(blob, decodeImage);

    expect(close).toHaveBeenCalledTimes(1);
  });
});
