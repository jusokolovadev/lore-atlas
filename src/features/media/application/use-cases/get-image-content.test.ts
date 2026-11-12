import type { ImageStorageRepository } from '../repositories/image-storage-repository';
import { createGetImageContentUseCase } from './get-image-content';

describe('createGetImageContentUseCase', () => {
  let repository: jest.Mocked<ImageStorageRepository>;
  let getImageContent: ReturnType<typeof createGetImageContentUseCase>;

  const blob = new Blob(['image-content'], { type: 'image/png' });

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findContentById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn(),
    };

    getImageContent = createGetImageContentUseCase({ repository });
  });

  it('returns image content', async () => {
    repository.findContentById.mockResolvedValue(blob);

    await expect(getImageContent('image-1')).resolves.toBe(blob);

    expect(repository.findContentById).toHaveBeenCalledWith('image-1');
  });

  it('returns null when image does not exist', async () => {
    repository.findContentById.mockResolvedValue(null);

    await expect(getImageContent('missing-image')).resolves.toBeNull();
  });

  it('propagates repository errors', async () => {
    repository.findContentById.mockRejectedValue(new Error('Storage error'));

    await expect(getImageContent('image-1')).rejects.toThrow('Storage error');
  });
});
