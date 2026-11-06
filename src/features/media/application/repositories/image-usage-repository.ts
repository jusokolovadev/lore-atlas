export interface ImageUsageRepository {
  findAllReferencedImageIds(): Promise<string[]>;
}
