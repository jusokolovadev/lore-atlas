import type { StoredImage } from '../../domain/models/stored-image';
import type { ImageStorageRepository } from '../repositories/image-storage-repository';
import { createGetImageByIdUseCase } from './get-image-by-id';

describe('createGetImageByIdUseCase', () => {
  let repository: jest.Mocked<ImageStorageRepository>;
  let getImageById: ReturnType<typeof createGetImageByIdUseCase>;

  const image: StoredImage = {
    id: 'image-1',
    mimeType: 'image/png',
    size: 1024,
    createdAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findContentById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    getImageById = createGetImageByIdUseCase({ repository });
  });

  it('returns image metadata', async () => {
    repository.findById.mockResolvedValue(image);

    await expect(getImageById('image-1')).resolves.toEqual(image);

    expect(repository.findById).toHaveBeenCalledWith('image-1');
  });

  it('returns null when image does not exist', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(getImageById('missing-image')).resolves.toBeNull();
  });

  it('propagates repository errors', async () => {
    repository.findById.mockRejectedValue(new Error('Storage error'));

    await expect(getImageById('image-1')).rejects.toThrow('Storage error');
  });
});
