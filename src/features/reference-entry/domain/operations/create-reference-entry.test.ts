import type { ImageReference } from 'src/shared/types/image-reference';

import type { ReferenceEntry } from '../models/reference-entry';
import { ReferenceEntryError } from '../errors/reference-entry-error';
import {
  createReferenceEntry,
  type CreateReferenceEntryInput,
} from './create-reference-entry';

describe('createReferenceEntry', () => {
  const metadata = {
    id: 'entry-1',
    now: '2026-01-01T12:00:00.000Z',
  };

  const validInput: CreateReferenceEntryInput = {
    universeId: 'universe-1',
    categoryType: 'custom',
    categoryId: 'category-1',
    name: 'Elves',
  };

  it('should create a reference entry with the provided data', () => {
    const result = createReferenceEntry(validInput, metadata);

    const expected: ReferenceEntry = {
      id: 'entry-1',
      universeId: 'universe-1',
      categoryType: 'custom',
      categoryId: 'category-1',
      name: 'Elves',
      description: null,
      image: null,
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-01T12:00:00.000Z',
      deletedAt: null,
      revision: 1,
      isSpoiler: false,
    };

    expect(result).toEqual(expected);
  });

  it('should trim the name', () => {
    const result = createReferenceEntry({ ...validInput, name: '  Elves  ' }, metadata);

    expect(result.name).toBe('Elves');
  });

  it('should throw an error when the name is empty', () => {
    expect(() => createReferenceEntry({ ...validInput, name: '' }, metadata)).toThrow(
      ReferenceEntryError,
    );
  });

  it('should throw an error when the name contains only whitespace', () => {
    expect(() => createReferenceEntry({ ...validInput, name: '   ' }, metadata)).toThrow(
      expect.objectContaining({
        code: 'INVALID_NAME',
      }),
    );
  });

  it('should use null for optional fields when they are omitted', () => {
    const result = createReferenceEntry(validInput, metadata);

    expect(result.description).toBeNull();
    expect(result.image).toBeNull();
  });

  it('should preserve the provided description and image', () => {
    const image: ImageReference = {
      type: 'url',
      url: 'https://example.com/elves.png',
    };

    const result = createReferenceEntry(
      {
        ...validInput,
        description: 'An ancient race.',
        image,
      },
      metadata,
    );

    expect(result.description).toBe('An ancient race.');
    expect(result.image).toBe(image);
  });

  it('should preserve explicit null values for optional fields', () => {
    const result = createReferenceEntry(
      {
        ...validInput,
        description: null,
        image: null,
      },
      metadata,
    );

    expect(result.description).toBeNull();
    expect(result.image).toBeNull();
  });

  it('should not modify the input', () => {
    const input = { ...validInput };

    createReferenceEntry(input, metadata);

    expect(input).toEqual(validInput);
  });
});
