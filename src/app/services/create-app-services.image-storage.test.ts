import type { ImageStorageRepository } from 'src/features/media/application/repositories/image-storage-repository';
import type { StoredImage } from 'src/features/media/domain/models/stored-image';

import { createAppServices } from './create-app-services';
import { ImageUsageRepository } from 'src/features/media/application/repositories/image-usage-repository';

describe('createAppServices — Image Storage', () => {
  const blob = new Blob(['image-content'], { type: 'image/png' });

  const image: StoredImage = {
    id: 'image-1',
    mimeType: 'image/png',
    size: blob.size,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  let repository: jest.Mocked<ImageStorageRepository>;
  let imageUsageRepository: jest.Mocked<ImageUsageRepository>;

  beforeEach(() => {
    repository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn().mockResolvedValue(image),
      findContentById: jest.fn().mockResolvedValue(blob),
      findAll: jest.fn().mockResolvedValue([]),

      delete: jest.fn().mockResolvedValue(undefined),
    };

    imageUsageRepository = {
      findAllReferencedImageIds: jest.fn().mockResolvedValue([]),
    };
  });

  it('exposes all Image Storage use cases', () => {
    const services = createAppServices({
      imageStorageRepository: repository,
    });

    expect(services.saveImage).toBeDefined();
    expect(services.getImageById).toBeDefined();
    expect(services.getImageContent).toBeDefined();
    expect(services.deleteImage).toBeDefined();
  });

  it('saves an image using the provided repository', async () => {
    const services = createAppServices({
      imageStorageRepository: repository,
      generateId: () => image.id,
      getCurrentTime: () => image.createdAt,
    });

    const result = await services.saveImage({ blob });

    expect(result).toEqual(image);
    expect(repository.save).toHaveBeenCalledWith(image, blob);
  });

  it('gets image metadata using the provided repository', async () => {
    const services = createAppServices({
      imageStorageRepository: repository,
    });

    const result = await services.getImageById(image.id);

    expect(result).toEqual(image);
    expect(repository.findById).toHaveBeenCalledWith(image.id);
  });

  it('gets image content using the provided repository', async () => {
    const services = createAppServices({
      imageStorageRepository: repository,
    });

    const result = await services.getImageContent(image.id);

    expect(result).toBe(blob);
    expect(repository.findContentById).toHaveBeenCalledWith(image.id);
  });

  it('deletes an image using the provided repository', async () => {
    const services = createAppServices({
      imageStorageRepository: repository,
    });

    await services.deleteImage(image.id);

    expect(repository.delete).toHaveBeenCalledWith(image.id);
  });

  it('uses the default image size limit when none is provided', async () => {
    const services = createAppServices({
      imageStorageRepository: repository,
      generateId: () => image.id,
      getCurrentTime: () => image.createdAt,
    });

    const oversizedBlob = new Blob([new Uint8Array(10 * 1024 * 1024 + 1)], {
      type: 'image/png',
    });

    await expect(services.saveImage({ blob: oversizedBlob })).rejects.toThrow(
      'FILE_TOO_LARGE',
    );

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('uses a custom image size limit', async () => {
    const services = createAppServices({
      imageStorageRepository: repository,
      generateId: () => image.id,
      getCurrentTime: () => image.createdAt,
      maxImageSize: 512,
    });

    const oversizedBlob = new Blob([new Uint8Array(513)], { type: 'image/png' });

    await expect(services.saveImage({ blob: oversizedBlob })).rejects.toThrow(
      'FILE_TOO_LARGE',
    );

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('cleans up unused images using the provided repositories', async () => {
    repository.findAll.mockResolvedValue([image]);
    imageUsageRepository.findAllReferencedImageIds.mockResolvedValue([]);

    const services = createAppServices({
      imageStorageRepository: repository,
      imageUsageRepository,
    });

    await services.cleanupUnusedImages();

    expect(repository.findAll).toHaveBeenCalled();
    expect(imageUsageRepository.findAllReferencedImageIds).toHaveBeenCalled();
    expect(repository.delete).toHaveBeenCalledWith(image.id);
  });
});
