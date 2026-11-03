export type InitializationState =
  { status: 'loading' } | { status: 'ready' } | { status: 'error'; message: string };
