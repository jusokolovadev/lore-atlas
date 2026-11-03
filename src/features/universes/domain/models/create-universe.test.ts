import { createUniverse } from './create-universe';

describe('createUniverse', () => {
  const metadata = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    now: '2026-11-03T10:00:00.000Z',
  };

  it('should create a universe with default values', () => {
    const universe = createUniverse({ name: 'Middle-earth' }, metadata);

    expect(universe).toEqual({
      id: metadata.id,
      name: 'Middle-earth',
      description: null,
      coverImage: null,
      createdAt: metadata.now,
      updatedAt: metadata.now,
      deletedAt: null,
    });
  });

  it('should trim the universe name', () => {
    const universe = createUniverse({ name: '  Middle-earth  ' }, metadata);

    expect(universe.name).toBe('Middle-earth');
  });

  it('should preserve optional values', () => {
    const universe = createUniverse(
      {
        name: 'Middle-earth',
        description: 'A fictional world',
        coverImage: {
          type: 'url',
          url: 'https://example.com/cover.jpg',
        },
      },
      metadata,
    );

    expect(universe.description).toBe('A fictional world');
    expect(universe.coverImage).toEqual({
      type: 'url',
      url: 'https://example.com/cover.jpg',
    });
  });

  it('should reject an empty name', () => {
    expect(() => createUniverse({ name: '   ' }, metadata)).toThrow(
      'Universe name cannot be empty.',
    );
  });
});
