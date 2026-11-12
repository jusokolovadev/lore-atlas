import { zipSync } from 'fflate';

import { FflateUniverseArchiveRepository } from './fflate-universe-archive-repository';

function readBytes(blob: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (!(reader.result instanceof ArrayBuffer)) {
        reject(new Error('Unable to read Blob.'));
        return;
      }

      resolve(new Uint8Array(reader.result));
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error('Unable to read Blob.'));
    };

    reader.readAsArrayBuffer(blob);
  });
}

describe('FflateUniverseArchiveRepository', () => {
  let repository: FflateUniverseArchiveRepository;

  beforeEach(() => {
    repository = new FflateUniverseArchiveRepository();
  });

  function createManifest(): Blob {
    return new Blob([JSON.stringify({ format: 'lore-atlas-universe', version: 1 })], {
      type: 'application/json',
    });
  }

  function createZip(files: Record<string, Uint8Array>): Blob {
    return new Blob([zipSync(files)], { type: 'application/zip' });
  }

  function readText(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          reject(new Error('Unable to read Blob as text.'));
          return;
        }

        resolve(reader.result);
      };

      reader.onerror = () => {
        reject(reader.error ?? new Error('Unable to read Blob as text.'));
      };

      reader.readAsText(blob);
    });
  }

  it('creates and reads an archive without images', async () => {
    const manifest = createManifest();

    const archive = await repository.createArchive(manifest, new Map());

    const result = await repository.readArchive(archive);

    expect(await readText(result.manifest)).toBe(await readText(manifest));
    expect(result.images.size).toBe(0);
  });

  it('creates and reads an archive with images', async () => {
    const manifest = createManifest();
    const image = new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'image/png' });

    const archive = await repository.createArchive(
      manifest,
      new Map([['images/image-1.png', image]]),
    );

    const result = await repository.readArchive(archive);

    expect(await readText(result.manifest)).toBe(await readText(manifest));

    const restoredImage = result.images.get('images/image-1.png');

    expect(restoredImage).toBeDefined();
    expect(new Uint8Array(await readBytes(restoredImage!))).toEqual(
      new Uint8Array([1, 2, 3, 4]),
    );
  });

  it('preserves multiple images', async () => {
    const images = new Map([
      ['images/image-1.png', new Blob([new Uint8Array([1, 2, 3])])],
      ['images/image-2.jpg', new Blob([new Uint8Array([4, 5, 6])])],
    ]);

    const archive = await repository.createArchive(createManifest(), images);

    const result = await repository.readArchive(archive);

    expect(result.images.size).toBe(2);

    const firstImage = result.images.get('images/image-1.png');
    const secondImage = result.images.get('images/image-2.jpg');

    expect(firstImage).toBeDefined();
    expect(secondImage).toBeDefined();

    expect(await readBytes(firstImage!)).toEqual(new Uint8Array([1, 2, 3]));

    expect(await readBytes(secondImage!)).toEqual(new Uint8Array([4, 5, 6]));
  });

  it('rejects archives exceeding the maximum compressed size', async () => {
    const limitedRepository = new FflateUniverseArchiveRepository({
      maxArchiveSize: 10,
    });

    await expect(
      limitedRepository.readArchive(new Blob([new Uint8Array(11)])),
    ).rejects.toThrow('Archive exceeds maximum allowed size.');
  });

  it('rejects archives exceeding the maximum uncompressed size', async () => {
    const limitedRepository = new FflateUniverseArchiveRepository({
      maxUncompressedSize: 20,
    });

    const archive = createZip({
      'manifest.json': new Uint8Array(21),
    });

    await expect(limitedRepository.readArchive(archive)).rejects.toThrow(
      'Archive exceeds maximum uncompressed size.',
    );
  });

  it('rejects archives containing too many images', async () => {
    const limitedRepository = new FflateUniverseArchiveRepository({
      maxImageCount: 1,
    });

    const archive = createZip({
      'manifest.json': new Uint8Array([1]),
      'images/image-1.png': new Uint8Array([1]),
      'images/image-2.png': new Uint8Array([2]),
    });

    await expect(limitedRepository.readArchive(archive)).rejects.toThrow(
      'Archive contains too many images.',
    );
  });

  it('rejects archives without a manifest', async () => {
    const archive = createZip({
      'images/image-1.png': new Uint8Array([1]),
    });

    await expect(repository.readArchive(archive)).rejects.toThrow(
      'Archive manifest is missing.',
    );
  });

  it('rejects invalid ZIP archives', async () => {
    const archive = new Blob([new Uint8Array([1, 2, 3, 4, 5])]);

    await expect(repository.readArchive(archive)).rejects.toThrow(
      'Invalid or corrupted ZIP archive.',
    );
  });

  it('rejects archives with unexpected files', async () => {
    const archive = createZip({
      'manifest.json': new Uint8Array([1]),
      'documents/readme.txt': new Uint8Array([2]),
    });

    await expect(repository.readArchive(archive)).rejects.toThrow(
      'Invalid image path: documents/readme.txt.',
    );
  });

  it('rejects paths containing parent directory segments', async () => {
    await expect(
      repository.createArchive(
        createManifest(),
        new Map([['images/../secret.png', new Blob([new Uint8Array([1])])]]),
      ),
    ).rejects.toThrow('Invalid archive path: images/../secret.png.');
  });

  it('rejects paths containing current directory segments', async () => {
    await expect(
      repository.createArchive(
        createManifest(),
        new Map([['images/./image.png', new Blob([new Uint8Array([1])])]]),
      ),
    ).rejects.toThrow('Invalid archive path: images/./image.png.');
  });

  it('rejects paths containing empty segments', async () => {
    await expect(
      repository.createArchive(
        createManifest(),
        new Map([['images//image.png', new Blob([new Uint8Array([1])])]]),
      ),
    ).rejects.toThrow('Invalid archive path: images//image.png.');
  });

  it('rejects absolute paths', async () => {
    await expect(
      repository.createArchive(
        createManifest(),
        new Map([['/images/image.png', new Blob([new Uint8Array([1])])]]),
      ),
    ).rejects.toThrow('Invalid archive path: /images/image.png.');
  });

  it('rejects Windows-style paths', async () => {
    await expect(
      repository.createArchive(
        createManifest(),
        new Map([['images\\image.png', new Blob([new Uint8Array([1])])]]),
      ),
    ).rejects.toThrow('Invalid archive path: images\\image.png.');
  });

  it('rejects paths containing null bytes', async () => {
    await expect(
      repository.createArchive(
        createManifest(),
        new Map([['images/image\0.png', new Blob([new Uint8Array([1])])]]),
      ),
    ).rejects.toThrow('Invalid archive path: images/image\0.png.');
  });

  it('rejects paths outside the images directory', async () => {
    await expect(
      repository.createArchive(
        createManifest(),
        new Map([['documents/image.png', new Blob([new Uint8Array([1])])]]),
      ),
    ).rejects.toThrow('Invalid image path: documents/image.png.');
  });

  it('rejects directory paths', async () => {
    await expect(
      repository.createArchive(
        createManifest(),
        new Map([['images/folder/', new Blob([new Uint8Array([1])])]]),
      ),
    ).rejects.toThrow('Invalid image path: images/folder/.');
  });

  it('rejects too many images when creating an archive', async () => {
    const limitedRepository = new FflateUniverseArchiveRepository({
      maxImageCount: 1,
    });

    await expect(
      limitedRepository.createArchive(
        createManifest(),
        new Map([
          ['images/image-1.png', new Blob([new Uint8Array([1])])],
          ['images/image-2.png', new Blob([new Uint8Array([2])])],
        ]),
      ),
    ).rejects.toThrow('Archive contains too many images.');
  });

  it('rejects archives exceeding the uncompressed size when creating them', async () => {
    const limitedRepository = new FflateUniverseArchiveRepository({
      maxUncompressedSize: 10,
    });

    await expect(
      limitedRepository.createArchive(
        createManifest(),
        new Map([['images/image-1.png', new Blob([new Uint8Array(20)])]]),
      ),
    ).rejects.toThrow('Archive exceeds maximum uncompressed size.');
  });

  it('rejects archives exceeding the compressed size when creating them', async () => {
    const limitedRepository = new FflateUniverseArchiveRepository({
      maxArchiveSize: 10,
    });

    await expect(
      limitedRepository.createArchive(createManifest(), new Map()),
    ).rejects.toThrow('Archive exceeds maximum allowed size.');
  });

  it('rejects encrypted ZIP archives', async () => {
    const archive = createZip({
      'manifest.json': new Uint8Array([1]),
    });

    const bytes = new Uint8Array(await readBytes(archive));
    const view = new DataView(bytes.buffer);

    const eocdOffset = bytes.length - 22;
    const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);

    view.setUint16(centralDirectoryOffset + 8, 0x0001, true);

    await expect(repository.readArchive(new Blob([bytes]))).rejects.toThrow(
      'Encrypted ZIP archives are not supported.',
    );
  });

  it('rejects unsupported compression methods', async () => {
    const archive = createZip({
      'manifest.json': new Uint8Array([1]),
    });

    const bytes = new Uint8Array(await readBytes(archive));
    const view = new DataView(bytes.buffer);

    const eocdOffset = bytes.length - 22;
    const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);

    view.setUint16(centralDirectoryOffset + 10, 99, true);

    await expect(repository.readArchive(new Blob([bytes]))).rejects.toThrow(
      'Unsupported ZIP compression method.',
    );
  });

  it('rejects ZIP64 archives', async () => {
    const archive = createZip({
      'manifest.json': new Uint8Array([1]),
    });

    const bytes = new Uint8Array(await readBytes(archive));
    const view = new DataView(bytes.buffer);

    const eocdOffset = bytes.length - 22;

    view.setUint16(eocdOffset + 10, 0xffff, true);

    await expect(repository.readArchive(new Blob([bytes]))).rejects.toThrow(
      'ZIP64 archives are not supported.',
    );
  });
});
