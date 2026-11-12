import { remapImageReference } from './remap-image-reference';

describe('remapImageReference', () => {
  const imageIdMap = new Map([['old-image-1', 'new-image-1']]);

  it('remaps a local image reference', () => {
    expect(
      remapImageReference({ type: 'file', fileId: 'old-image-1' }, imageIdMap),
    ).toEqual({
      type: 'file',
      fileId: 'new-image-1',
    });
  });

  it('preserves external URLs', () => {
    const image = {
      type: 'url' as const,
      url: 'https://example.com/image.png',
    };

    expect(remapImageReference(image, imageIdMap)).toEqual(image);
  });

  it('preserves null references', () => {
    expect(remapImageReference(null, imageIdMap)).toBeNull();
  });

  it('throws when a local image reference cannot be remapped', () => {
    expect(() =>
      remapImageReference({ type: 'file', fileId: 'missing-image' }, imageIdMap),
    ).toThrow('Image reference not found: missing-image.');
  });
});
