export class UniverseEntityConcurrencyError extends Error {
  constructor(message = 'Entity was modified by another operation.') {
    super(message);
    this.name = 'UniverseEntityConcurrencyError';
  }
}
