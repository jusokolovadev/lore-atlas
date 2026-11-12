import type { StoredImage } from '../../domain/models/stored-image';
import type { ImageStorageRepository } from '../repositories/image-storage-repository';
import type { ImageUsageRepository } from '../repositories/image-usage-repository';

import { createCleanupUnusedImagesUseCase } from './cleanup-unused-images';

describe('createCleanupUnusedImagesUseCase', () => {
  const images: StoredImage[] = [
    {
      id: 'image-1',
      mimeType: 'image/png',
      size: 100,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'image-2',
      mimeType: 'image/jpeg',
      size: 200,
      createdAt: '2026-01-02T00:00:00.000Z',
    },
    {
      id: 'image-3',
      mimeType: 'image/webp',
      size: 300,
      createdAt: '2026-01-03T00:00:00.000Z',
    },
  ];

  let imageStorageRepository: jest.Mocked<ImageStorageRepository>;
  let imageUsageRepository: jest.Mocked<ImageUsageRepository>;

  beforeEach(() => {
    imageStorageRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn().mockResolvedValue(images),
      findContentById: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    imageUsageRepository = {
      findAllReferencedImageIds: jest.fn().mockResolvedValue(['image-1', 'image-3']),
    };
  });

  it('deletes only images that are not referenced', async () => {
    const cleanup = createCleanupUnusedImagesUseCase({
      imageStorageRepository,
      imageUsageRepository,
    });

    const result = await cleanup();

    expect(result).toEqual(['image-2']);
    expect(imageStorageRepository.delete).toHaveBeenCalledTimes(1);
    expect(imageStorageRepository.delete).toHaveBeenCalledWith('image-2');
  });

  it('does not delete images that are referenced', async () => {
    imageUsageRepository.findAllReferencedImageIds.mockResolvedValue([
      'image-1',
      'image-2',
      'image-3',
    ]);

    const cleanup = createCleanupUnusedImagesUseCase({
      imageStorageRepository,
      imageUsageRepository,
    });

    const result = await cleanup();

    expect(result).toEqual([]);
    expect(imageStorageRepository.delete).not.toHaveBeenCalled();
  });

  it('deletes all images when none are referenced', async () => {
    imageUsageRepository.findAllReferencedImageIds.mockResolvedValue([]);

    const cleanup = createCleanupUnusedImagesUseCase({
      imageStorageRepository,
      imageUsageRepository,
    });

    const result = await cleanup();

    expect(result).toEqual(['image-1', 'image-2', 'image-3']);
    expect(imageStorageRepository.delete).toHaveBeenCalledTimes(3);
  });

  it('returns an empty array when no images are stored', async () => {
    imageStorageRepository.findAll.mockResolvedValue([]);

    const cleanup = createCleanupUnusedImagesUseCase({
      imageStorageRepository,
      imageUsageRepository,
    });

    const result = await cleanup();

    expect(result).toEqual([]);
    expect(imageStorageRepository.delete).not.toHaveBeenCalled();
  });

  it('does not delete images when finding references fails', async () => {
    imageUsageRepository.findAllReferencedImageIds.mockRejectedValue(
      new Error('Failed to find image references'),
    );

    const cleanup = createCleanupUnusedImagesUseCase({
      imageStorageRepository,
      imageUsageRepository,
    });

    await expect(cleanup()).rejects.toThrow('Failed to find image references');

    expect(imageStorageRepository.delete).not.toHaveBeenCalled();
  });

  it('propagates image deletion errors', async () => {
    imageStorageRepository.delete.mockRejectedValue(new Error('Failed to delete image'));

    const cleanup = createCleanupUnusedImagesUseCase({
      imageStorageRepository,
      imageUsageRepository,
    });

    await expect(cleanup()).rejects.toThrow('Failed to delete image');
  });
});
