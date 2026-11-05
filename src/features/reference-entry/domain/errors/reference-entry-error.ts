export type ReferenceEntryErrorCode = 'INVALID_NAME' | 'ALREADY_DELETED' | 'NOT_DELETED';

export class ReferenceEntryError extends Error {
  constructor(
    public readonly code: ReferenceEntryErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ReferenceEntryError';
  }
}
