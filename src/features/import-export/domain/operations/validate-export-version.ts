import {
  UNIVERSE_EXPORT_FORMAT,
  UNIVERSE_EXPORT_VERSION,
} from '../models/universe-export';

export type ExportVersionValidationResult =
  | { valid: true }
  | {
      valid: false;
      reason: 'INVALID_FORMAT' | 'UNSUPPORTED_VERSION';
    };

export function validateExportVersion(input: {
  format: unknown;
  version: unknown;
}): ExportVersionValidationResult {
  if (input.format !== UNIVERSE_EXPORT_FORMAT) {
    return {
      valid: false,
      reason: 'INVALID_FORMAT',
    };
  }

  if (input.version !== UNIVERSE_EXPORT_VERSION) {
    return {
      valid: false,
      reason: 'UNSUPPORTED_VERSION',
    };
  }

  return { valid: true };
}
