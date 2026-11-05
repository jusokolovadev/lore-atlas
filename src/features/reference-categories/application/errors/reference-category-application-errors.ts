export type ReferenceCategoryApplicationErrorCode =
  'NOT_FOUND' | 'DUPLICATE_NAME' | 'UNIVERSE_NOT_FOUND' | 'CONCURRENT_MODIFICATION';

export class ReferenceCategoryApplicationError extends Error {
  constructor(
    public readonly code: ReferenceCategoryApplicationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ReferenceCategoryApplicationError';
  }
}

export class ReferenceCategoryNameConflictError extends Error {
  constructor() {
    super('A reference category with this name already exists.');
    this.name = 'ReferenceCategoryNameConflictError';
  }
}

export class ReferenceCategoryConcurrencyError extends Error {
  constructor(message = 'Reference category was modified by another operation.') {
    super(message);
    this.name = 'ReferenceCategoryConcurrencyError';
  }
}
