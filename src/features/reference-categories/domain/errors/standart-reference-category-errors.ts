export type StandardReferenceCategoryErrorCode =
  'CATEGORY_NOT_FOUND' | 'CORE_CATEGORY_CANNOT_BE_DISABLED';

export class StandardReferenceCategoryError extends Error {
  constructor(
    public readonly code: StandardReferenceCategoryErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'StandardReferenceCategoryErrorCode';
  }
}
