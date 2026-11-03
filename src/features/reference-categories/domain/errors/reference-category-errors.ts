export type ReferenceCategoryErrorCode =
  'INVALID_NAME' | 'ALREADY_DELETED' | 'NOT_DELETED';

export class ReferenceCategoryError extends Error {
  constructor(
    public readonly code: ReferenceCategoryErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ReferenceCategoryError';
  }
}
