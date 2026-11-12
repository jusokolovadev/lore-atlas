import type { ImageStorageRepository } from '../repositories/image-storage-repository';
import { createDeleteImageUseCase } from './delete-image';

describe('createDeleteImageUseCase', () => {
  let repository: jest.Mocked<ImageStorageRepository>;
  let deleteImage: ReturnType<typeof createDeleteImageUseCase>;

  beforeEach(() => {
    repository = {
      save: jest.fn(),
      findById: jest.fn(),
      findContentById: jest.fn(),
      findAll: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
    };

    deleteImage = createDeleteImageUseCase({ repository });
  });

  it('deletes an image', async () => {
    await expect(deleteImage('image-1')).resolves.toBeUndefined();

    expect(repository.delete).toHaveBeenCalledWith('image-1');
  });

  it('does not fail when deleting a non-existent image', async () => {
    repository.delete.mockResolvedValue(undefined);

    await expect(deleteImage('missing-image')).resolves.toBeUndefined();
  });

  it('propagates repository errors', async () => {
    repository.delete.mockRejectedValue(new Error('Storage error'));

    await expect(deleteImage('image-1')).rejects.toThrow('Storage error');
  });
});
