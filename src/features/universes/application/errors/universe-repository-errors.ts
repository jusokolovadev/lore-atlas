export class UniverseConcurrencyError extends Error {
  constructor(message = 'Universe was modified by another operation.') {
    super(message);
    this.name = 'UniverseConcurrencyError';
  }
}

export class UniverseAlreadyExistsError extends Error {
  constructor(message = 'Universe already exists.') {
    super(message);
    this.name = 'UniverseAlreadyExistsError';
  }
}
