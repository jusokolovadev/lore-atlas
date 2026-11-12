import {
  UNIVERSE_EXPORT_FORMAT,
  UNIVERSE_EXPORT_VERSION,
} from '../models/universe-export';

import { validateExportVersion } from './validate-export-version';

describe('validateExportVersion', () => {
  it('accepts the current export format and version', () => {
    expect(
      validateExportVersion({
        format: UNIVERSE_EXPORT_FORMAT,
        version: UNIVERSE_EXPORT_VERSION,
      }),
    ).toEqual({ valid: true });
  });

  it('rejects an invalid format', () => {
    expect(
      validateExportVersion({
        format: 'other-format',
        version: UNIVERSE_EXPORT_VERSION,
      }),
    ).toEqual({
      valid: false,
      reason: 'INVALID_FORMAT',
    });
  });

  it('rejects an unsupported version', () => {
    expect(
      validateExportVersion({
        format: UNIVERSE_EXPORT_FORMAT,
        version: 2,
      }),
    ).toEqual({
      valid: false,
      reason: 'UNSUPPORTED_VERSION',
    });
  });

  it('rejects non-numeric versions', () => {
    expect(
      validateExportVersion({
        format: UNIVERSE_EXPORT_FORMAT,
        version: '1',
      }),
    ).toEqual({
      valid: false,
      reason: 'UNSUPPORTED_VERSION',
    });
  });
});
