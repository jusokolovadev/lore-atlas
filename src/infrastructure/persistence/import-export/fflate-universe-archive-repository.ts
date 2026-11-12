import { strFromU8, Unzip, UnzipInflate, zipSync } from 'fflate';

import type { UniverseArchiveRepository } from 'src/features/import-export/application/repositories/universe-archive-repository';

const MANIFEST_PATH = 'manifest.json';
const IMAGES_DIRECTORY = 'images/';

const DEFAULT_MAX_ARCHIVE_SIZE = 50 * 1024 * 1024;
const DEFAULT_MAX_UNCOMPRESSED_SIZE = 100 * 1024 * 1024;
const DEFAULT_MAX_IMAGE_COUNT = 1000;

const ZIP_EOCD_SIGNATURE = 0x06054b50;
const ZIP_CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;

const ZIP_EOCD_MIN_SIZE = 22;
const ZIP_MAX_COMMENT_SIZE = 0xffff;
const ZIP_CENTRAL_DIRECTORY_HEADER_SIZE = 46;

interface ZipEntry {
  path: string;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number;
}

export interface FflateUniverseArchiveRepositoryOptions {
  maxArchiveSize?: number;
  maxUncompressedSize?: number;
  maxImageCount?: number;
}

function toBlobPart(bytes: Uint8Array): ArrayBuffer {
  return Uint8Array.from(bytes).buffer;
}

function readBlobAsBytes(blob: Blob): Promise<Uint8Array> {
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

function findEndOfCentralDirectory(bytes: Uint8Array): number {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const minimumOffset = Math.max(
    0,
    bytes.length - ZIP_EOCD_MIN_SIZE - ZIP_MAX_COMMENT_SIZE,
  );

  for (let offset = bytes.length - ZIP_EOCD_MIN_SIZE; offset >= minimumOffset; offset--) {
    if (view.getUint32(offset, true) !== ZIP_EOCD_SIGNATURE) {
      continue;
    }

    const commentLength = view.getUint16(offset + 20, true);

    if (offset + ZIP_EOCD_MIN_SIZE + commentLength === bytes.length) {
      return offset;
    }
  }

  throw new Error('Invalid or corrupted ZIP archive.');
}

function parseCentralDirectory(bytes: Uint8Array): ZipEntry[] {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const eocdOffset = findEndOfCentralDirectory(bytes);

  const diskNumber = view.getUint16(eocdOffset + 4, true);
  const centralDirectoryDisk = view.getUint16(eocdOffset + 6, true);
  const entriesOnDisk = view.getUint16(eocdOffset + 8, true);
  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const centralDirectorySize = view.getUint32(eocdOffset + 12, true);
  const centralDirectoryOffset = view.getUint32(eocdOffset + 16, true);

  if (
    diskNumber === 0xffff ||
    centralDirectoryDisk === 0xffff ||
    entriesOnDisk === 0xffff ||
    totalEntries === 0xffff ||
    centralDirectorySize === 0xffffffff ||
    centralDirectoryOffset === 0xffffffff
  ) {
    throw new Error('ZIP64 archives are not supported.');
  }

  if (diskNumber !== 0 || centralDirectoryDisk !== 0 || entriesOnDisk !== totalEntries) {
    throw new Error('Multi-disk ZIP archives are not supported.');
  }

  if (
    totalEntries === 0xffff ||
    centralDirectorySize === 0xffffffff ||
    centralDirectoryOffset === 0xffffffff
  ) {
    throw new Error('ZIP64 archives are not supported.');
  }

  const centralDirectoryEnd = centralDirectoryOffset + centralDirectorySize;

  if (centralDirectoryEnd > eocdOffset || centralDirectoryOffset > bytes.length) {
    throw new Error('Invalid ZIP central directory.');
  }

  const entries: ZipEntry[] = [];
  const paths = new Set<string>();
  let offset = centralDirectoryOffset;
  let totalUncompressedSize = 0;
  let imageCount = 0;

  for (let index = 0; index < totalEntries; index++) {
    if (
      offset + ZIP_CENTRAL_DIRECTORY_HEADER_SIZE > centralDirectoryEnd ||
      view.getUint32(offset, true) !== ZIP_CENTRAL_DIRECTORY_SIGNATURE
    ) {
      throw new Error('Invalid ZIP central directory entry.');
    }

    const flags = view.getUint16(offset + 8, true);
    const compressionMethod = view.getUint16(offset + 10, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const fileNameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    const diskStart = view.getUint16(offset + 34, true);

    if (
      compressedSize === 0xffffffff ||
      uncompressedSize === 0xffffffff ||
      diskStart !== 0
    ) {
      throw new Error('ZIP64 archives are not supported.');
    }

    if (flags & 0x0001) {
      throw new Error('Encrypted ZIP archives are not supported.');
    }

    if (compressionMethod !== 0 && compressionMethod !== 8) {
      throw new Error('Unsupported ZIP compression method.');
    }

    const nameStart = offset + ZIP_CENTRAL_DIRECTORY_HEADER_SIZE;
    const nameEnd = nameStart + fileNameLength;
    const entryEnd = nameEnd + extraLength + commentLength;

    if (entryEnd > centralDirectoryEnd) {
      throw new Error('Invalid ZIP central directory entry.');
    }

    let path: string;

    try {
      path = strFromU8(bytes.subarray(nameStart, nameEnd));
    } catch {
      throw new Error('Invalid ZIP entry path encoding.');
    }

    if (paths.has(path)) {
      throw new Error(`Archive contains duplicate path: ${path}.`);
    }

    paths.add(path);

    if (path !== MANIFEST_PATH) {
      validateImagePath(path);
      imageCount++;
    }

    totalUncompressedSize += uncompressedSize;

    if (!Number.isSafeInteger(totalUncompressedSize)) {
      throw new Error('Archive exceeds maximum uncompressed size.');
    }

    entries.push({
      path,
      compressedSize,
      uncompressedSize,
      compressionMethod,
    });

    offset = entryEnd;
  }

  if (offset !== centralDirectoryEnd) {
    throw new Error('Invalid ZIP central directory size.');
  }

  return entries;
}

function validateImagePath(path: string): void {
  if (
    !path ||
    path.includes('\\') ||
    path.includes('\0') ||
    path.startsWith('/') ||
    /^[a-zA-Z]:/.test(path)
  ) {
    throw new Error(`Invalid archive path: ${path}.`);
  }

  if (!path.startsWith(IMAGES_DIRECTORY) || path.endsWith('/')) {
    throw new Error(`Invalid image path: ${path}.`);
  }

  if (
    path
      .split('/')
      .some((segment) => segment === '' || segment === '..' || segment === '.')
  ) {
    throw new Error(`Invalid archive path: ${path}.`);
  }
}

function unzipWithLimits(
  bytes: Uint8Array,
  entries: ZipEntry[],
  maxUncompressedSize: number,
): Map<string, Uint8Array> {
  const expectedEntries = new Map(entries.map((entry) => [entry.path, entry]));

  const seenEntries = new Set<string>();
  const result = new Map<string, Uint8Array>();

  let totalActualSize = 0;
  let callbackError: Error | null = null;

  const unzip = new Unzip((file) => {
    const entry = expectedEntries.get(file.name);

    if (!entry || seenEntries.has(file.name)) {
      callbackError = new Error(`Unexpected or duplicate archive entry: ${file.name}.`);
      throw callbackError;
    }

    seenEntries.add(file.name);

    const chunks: Uint8Array[] = [];
    let fileSize = 0;

    file.ondata = (error, data, final) => {
      if (error) {
        callbackError = new Error('Invalid or corrupted ZIP archive.');
        throw callbackError;
      }

      fileSize += data.length;
      totalActualSize += data.length;

      if (totalActualSize > maxUncompressedSize || fileSize > entry.uncompressedSize) {
        callbackError = new Error('Archive exceeds maximum uncompressed size.');
        throw callbackError;
      }

      chunks.push(data.slice());

      if (final) {
        if (fileSize !== entry.uncompressedSize) {
          callbackError = new Error(`Uncompressed size mismatch: ${file.name}.`);
          throw callbackError;
        }

        const content = new Uint8Array(fileSize);
        let contentOffset = 0;

        for (const chunk of chunks) {
          content.set(chunk, contentOffset);
          contentOffset += chunk.length;
        }

        result.set(file.name, content);
      }
    };

    file.start();
  });

  unzip.register(UnzipInflate);

  try {
    unzip.push(bytes, true);
  } catch {
    throw callbackError ?? new Error('Invalid or corrupted ZIP archive.');
  }

  if (callbackError) {
    throw callbackError;
  }

  if (result.size !== entries.length) {
    throw new Error('ZIP archive contains incomplete entries.');
  }

  return result;
}

export class FflateUniverseArchiveRepository implements UniverseArchiveRepository {
  private readonly maxArchiveSize: number;
  private readonly maxUncompressedSize: number;
  private readonly maxImageCount: number;

  constructor(options: FflateUniverseArchiveRepositoryOptions = {}) {
    this.maxArchiveSize = options.maxArchiveSize ?? DEFAULT_MAX_ARCHIVE_SIZE;

    this.maxUncompressedSize =
      options.maxUncompressedSize ?? DEFAULT_MAX_UNCOMPRESSED_SIZE;

    this.maxImageCount = options.maxImageCount ?? DEFAULT_MAX_IMAGE_COUNT;
  }

  async createArchive(manifest: Blob, images: Map<string, Blob>): Promise<Blob> {
    if (images.size > this.maxImageCount) {
      throw new Error('Archive contains too many images.');
    }

    const files: Record<string, Uint8Array> = {};

    for (const path of images.keys()) {
      validateImagePath(path);
    }

    files[MANIFEST_PATH] = await readBlobAsBytes(manifest);

    for (const [path, image] of images) {
      files[path] = await readBlobAsBytes(image);
    }

    this.validateUncompressedSize(files);

    const archive = zipSync(files);

    if (archive.byteLength > this.maxArchiveSize) {
      throw new Error('Archive exceeds maximum allowed size.');
    }

    return new Blob([toBlobPart(archive)], {
      type: 'application/zip',
    });
  }

  async readArchive(
    archive: Blob,
  ): Promise<{ manifest: Blob; images: Map<string, Blob> }> {
    if (archive.size > this.maxArchiveSize) {
      throw new Error('Archive exceeds maximum allowed size.');
    }

    const bytes = await readBlobAsBytes(archive);

    const entries = parseCentralDirectory(bytes);

    const imageCount = entries.filter((entry) => entry.path !== MANIFEST_PATH).length;

    if (imageCount > this.maxImageCount) {
      throw new Error('Archive contains too many images.');
    }

    const declaredUncompressedSize = entries.reduce(
      (total, entry) => total + entry.uncompressedSize,
      0,
    );

    if (declaredUncompressedSize > this.maxUncompressedSize) {
      throw new Error('Archive exceeds maximum uncompressed size.');
    }

    if (!entries.some((entry) => entry.path === MANIFEST_PATH)) {
      throw new Error('Archive manifest is missing.');
    }

    const files = unzipWithLimits(bytes, entries, this.maxUncompressedSize);

    const manifestContent = files.get(MANIFEST_PATH);

    if (!manifestContent) {
      throw new Error('Archive manifest is missing.');
    }

    const images = new Map<string, Blob>();

    for (const [path, content] of files) {
      if (path === MANIFEST_PATH) {
        continue;
      }

      images.set(path, new Blob([toBlobPart(content)]));
    }

    return {
      manifest: new Blob([toBlobPart(manifestContent)], {
        type: 'application/json',
      }),
      images,
    };
  }

  private validateUncompressedSize(files: Record<string, Uint8Array>): void {
    let totalSize = 0;

    for (const content of Object.values(files)) {
      totalSize += content.byteLength;

      if (totalSize > this.maxUncompressedSize) {
        throw new Error('Archive exceeds maximum uncompressed size.');
      }
    }
  }
}
