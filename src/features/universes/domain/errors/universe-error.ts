export type UniverseErrorCode =
  'INVALID_NAME' | 'ALREADY_DELETED' | 'NOT_DELETED' | 'NOT_FOUND';

export class UniverseError extends Error {
  constructor(
    public readonly code: UniverseErrorCode,
    message: string,
  ) {
    super(message);

    this.name = 'UniverseError';
  }
}
