export class ReferenceEntryNameConflictError extends Error {
  constructor(message = 'Reference entry name is already taken.') {
    super(message);
    this.name = 'ReferenceEntryNameConflictError';
  }
}

export class ReferenceEntryConcurrencyError extends Error {
  constructor(message = 'Reference entry was modified by another operation.') {
    super(message);
    this.name = 'ReferenceEntryConcurrencyError';
  }
}

export class ReferenceEntryUniverseUnavailableError extends Error {
  constructor(message = 'Universe is unavailable.') {
    super(message);
    this.name = 'ReferenceEntryUniverseUnavailableError';
  }
}

export class ReferenceEntryCategoryUnavailableError extends Error {
  constructor(message = 'Reference category is unavailable.') {
    super(message);
    this.name = 'ReferenceEntryCategoryUnavailableError';
  }
}

export class ReferenceEntryCategoryNotFoundError extends Error {
  constructor(message = 'Reference category not found.') {
    super(message);
    this.name = 'ReferenceEntryCategoryNotFoundError';
  }
}
