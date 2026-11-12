export interface UniverseArchiveRepository {
  createArchive(manifest: Blob, images: Map<string, Blob>): Promise<Blob>;

  readArchive(archive: Blob): Promise<{
    manifest: Blob;
    images: Map<string, Blob>;
  }>;
}
