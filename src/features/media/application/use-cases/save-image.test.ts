import type { StoredImage } from '../../domain/models/stored-image';
import type { ImageStorageRepository } from '../repositories/image-storage-repository';
import { createSaveImageUseCase } from './save-image';

describe('createSaveImageUseCase', () => {
  const blob = new Blob(['image-content'], { type: 'image/png' });

  const image: StoredImage = {
    id: 'image-1',
    mimeType: 'image/png',
    size: blob.size,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  let repository: jest.Mocked<ImageStorageRepository>;
  let saveImage: ReturnType<typeof createSaveImageUseCase>;

  beforeEach(() => {
    repository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findContentById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    saveImage = createSaveImageUseCase({
      repository,
      generateId: () => 'image-1',
      getCurrentTime: () => image.createdAt,
      maxSize: 1024,
    });
  });

  it('creates and saves an image', async () => {
    await expect(saveImage({ blob })).resolves.toEqual(image);

    expect(repository.save).toHaveBeenCalledWith(image, blob);
  });

  it('does not save an image with an invalid MIME type', async () => {
    const invalidBlob = new Blob(['content'], {
      type: 'application/pdf',
    });

    await expect(saveImage({ blob: invalidBlob })).rejects.toThrow(
      'Invalid image file: INVALID_MIME_TYPE.',
    );

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('does not save an empty image', async () => {
    const emptyBlob = new Blob([], { type: 'image/png' });

    await expect(saveImage({ blob: emptyBlob })).rejects.toThrow(
      'Invalid image file: INVALID_SIZE.',
    );

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('does not save an image exceeding maximum size', async () => {
    const largeBlob = new Blob(['x'.repeat(1025)], {
      type: 'image/png',
    });

    await expect(saveImage({ blob: largeBlob })).rejects.toThrow(
      'Invalid image file: FILE_TOO_LARGE.',
    );

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('propagates repository errors', async () => {
    repository.save.mockRejectedValue(new Error('Storage error'));

    await expect(saveImage({ blob })).rejects.toThrow('Storage error');
  });
});
