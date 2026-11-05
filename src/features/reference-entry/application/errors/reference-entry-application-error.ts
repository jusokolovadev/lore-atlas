export type ReferenceEntryApplicationErrorCode =
  | 'NOT_FOUND'
  | 'UNIVERSE_NOT_FOUND'
  | 'CATEGORY_NOT_FOUND'
  | 'CATEGORY_UNAVAILABLE'
  | 'DUPLICATE_NAME'
  | 'CONCURRENT_MODIFICATION';

export class ReferenceEntryApplicationError extends Error {
  constructor(
    public readonly code: ReferenceEntryApplicationErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ReferenceEntryApplicationError';
  }
}
