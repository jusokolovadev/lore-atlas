import {
  getDatabase,
  closeDatabase,
} from 'src/infrastructure/persistence/database/database';
import { idbRequestToPromise } from '../database/idb-request';
import { idbTransactionToPromise } from '../database/idb-transaction';
import {
  CATEGORY_NAME_RESERVATIONS_STORE,
  REFERENCE_CATEGORIES_STORE,
  UNIVERSES_STORE,
} from '../database/database.types';

import type { CustomReferenceCategory } from 'src/features/reference-categories/domain/models/custom-reference-category';

import { IndexedDbReferenceCategoryRepository } from './indexed-db-reference-category-repository';
import {
  ReferenceCategoryConcurrencyError,
  ReferenceCategoryNameConflictError,
} from 'src/features/reference-categories/application/errors/reference-category-application-errors';
import { Universe } from 'src/features/universes/domain/models/universe';

function createCategory(
  overrides: Partial<CustomReferenceCategory> = {},
): CustomReferenceCategory {
  return {
    id: crypto.randomUUID(),
    universeId: 'universe-1',
    name: 'Species',
    description: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    deletedAt: null,
    revision: 1,
    ...overrides,
  };
}

function deleteDatabase(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);

    request.onsuccess = () => resolve();

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to delete database.'));
    };

    request.onblocked = () => {
      reject(new Error('Database deletion is blocked.'));
    };
  });
}

describe('IndexedDbReferenceCategoryRepository', () => {
  let repository: IndexedDbReferenceCategoryRepository;

  beforeEach(async () => {
    await closeDatabase();
    await deleteDatabase('lore-atlas');

    repository = new IndexedDbReferenceCategoryRepository();
  });

  afterEach(async () => {
    await closeDatabase();
  });

  async function saveCategory(category: CustomReferenceCategory) {
    const database = await getDatabase();

    const transaction = database.transaction(REFERENCE_CATEGORIES_STORE, 'readwrite');

    const transactionPromise = idbTransactionToPromise(transaction);

    const request = transaction.objectStore(REFERENCE_CATEGORIES_STORE).put(category);

    await Promise.all([idbRequestToPromise(request), transactionPromise]);
  }

  async function saveUniverse(universe: Universe): Promise<void> {
    const database = await getDatabase();

    const transaction = database.transaction(UNIVERSES_STORE, 'readwrite');

    const transactionPromise = idbTransactionToPromise(transaction);

    const request = transaction.objectStore(UNIVERSES_STORE).put(universe);

    await Promise.all([idbRequestToPromise(request), transactionPromise]);
  }

  function createUniverse(overrides: Partial<Universe> = {}): Universe {
    return {
      id: 'universe-1',
      name: 'Middle-earth',
      description: null,
      coverImage: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      deletedAt: null,
      revision: 1,
      enabledStandardCategoryIds: ['species', 'titles'],
      ...overrides,
    };
  }

  async function findReservation(
    universeId: string,
    name: string,
  ): Promise<{ universeId: string; name: string; categoryId: string } | undefined> {
    const database = await getDatabase();

    const transaction = database.transaction(
      CATEGORY_NAME_RESERVATIONS_STORE,
      'readonly',
    );

    const transactionPromise = idbTransactionToPromise(transaction);

    const request = transaction
      .objectStore(CATEGORY_NAME_RESERVATIONS_STORE)
      .get([universeId, name]);

    const [reservation] = await Promise.all([
      idbRequestToPromise(request),
      transactionPromise,
    ]);

    return reservation;
  }

  async function saveReservation(category: CustomReferenceCategory) {
    const database = await getDatabase();

    const transaction = database.transaction(
      CATEGORY_NAME_RESERVATIONS_STORE,
      'readwrite',
    );

    const transactionPromise = idbTransactionToPromise(transaction);

    const request = transaction.objectStore(CATEGORY_NAME_RESERVATIONS_STORE).put({
      universeId: category.universeId,
      name: category.name,
      categoryId: category.id,
    });

    await Promise.all([idbRequestToPromise(request), transactionPromise]);
  }

  describe('findById', () => {
    it('returns a category when it exists', async () => {
      const category = createCategory();

      await saveCategory(category);

      const result = await repository.findById(category.id);

      expect(result).toEqual(category);
    });

    it('returns null when category does not exist', async () => {
      const result = await repository.findById('non-existent-id');

      expect(result).toBeNull();
    });

    it('returns deleted categories', async () => {
      const category = createCategory({
        deletedAt: '2026-02-01T00:00:00.000Z',
      });

      await saveCategory(category);

      const result = await repository.findById(category.id);

      expect(result).toEqual(category);
    });
  });

  describe('findAllActiveByUniverseId', () => {
    it('returns only active categories from the requested universe', async () => {
      const activeCategory = createCategory();

      const anotherActiveCategory = createCategory({
        id: crypto.randomUUID(),
        name: 'Languages',
      });

      const deletedCategory = createCategory({
        id: crypto.randomUUID(),
        name: 'Religions',
        deletedAt: '2026-02-01T00:00:00.000Z',
      });

      const anotherUniverseCategory = createCategory({
        id: crypto.randomUUID(),
        universeId: 'universe-2',
        name: 'Species',
      });

      await Promise.all([
        saveCategory(activeCategory),
        saveCategory(anotherActiveCategory),
        saveCategory(deletedCategory),
        saveCategory(anotherUniverseCategory),
      ]);

      const result = await repository.findAllActiveByUniverseId('universe-1');

      expect(result).toHaveLength(2);
      expect(result).toEqual(
        expect.arrayContaining([activeCategory, anotherActiveCategory]),
      );
    });

    it('returns an empty array when universe has no active categories', async () => {
      const deletedCategory = createCategory({
        deletedAt: '2026-02-01T00:00:00.000Z',
      });

      await saveCategory(deletedCategory);

      const result = await repository.findAllActiveByUniverseId('universe-1');

      expect(result).toEqual([]);
    });
  });

  describe('update', () => {
    it('updates an existing category', async () => {
      const category = createCategory();

      await saveCategory(category);
      await saveReservation(category);

      const updatedCategory = {
        ...category,
        description: 'Updated description',
        updatedAt: '2026-01-02T00:00:00.000Z',
        revision: 2,
      };

      await repository.update(updatedCategory, category.revision);

      expect(await repository.findById(category.id)).toEqual(updatedCategory);

      expect(await findReservation(category.universeId, category.name)).toEqual({
        universeId: category.universeId,
        name: category.name,
        categoryId: category.id,
      });
    });

    it('releases the old name and reserves the new name when renamed', async () => {
      const category = createCategory();

      await saveCategory(category);
      await saveReservation(category);

      const renamedCategory = {
        ...category,
        name: 'Creatures',
        revision: 2,
      };

      await repository.update(renamedCategory, category.revision);

      expect(await findReservation(category.universeId, category.name)).toBeUndefined();

      expect(await findReservation(category.universeId, 'Creatures')).toEqual({
        universeId: category.universeId,
        name: 'Creatures',
        categoryId: category.id,
      });

      expect(await repository.findById(category.id)).toEqual(renamedCategory);
    });

    it('throws when the category does not exist', async () => {
      const category = createCategory({
        revision: 2,
      });

      await expect(repository.update(category, 1)).rejects.toBeInstanceOf(
        ReferenceCategoryConcurrencyError,
      );
    });

    it('throws when the expected revision is outdated', async () => {
      const category = createCategory();

      await saveCategory(category);
      await saveReservation(category);

      const updatedCategory = {
        ...category,
        description: 'Updated description',
        revision: 2,
      };

      await expect(repository.update(updatedCategory, 0)).rejects.toBeInstanceOf(
        ReferenceCategoryConcurrencyError,
      );

      expect(await repository.findById(category.id)).toEqual(category);
    });

    it('throws when the category is deleted', async () => {
      const category = createCategory({
        deletedAt: '2026-01-02T00:00:00.000Z',
      });

      await saveCategory(category);

      const updatedCategory = {
        ...category,
        description: 'Updated description',
        revision: 2,
      };

      await expect(
        repository.update(updatedCategory, category.revision),
      ).rejects.toBeInstanceOf(ReferenceCategoryConcurrencyError);

      expect(await repository.findById(category.id)).toEqual(category);
    });

    it('throws when the category name reservation is missing', async () => {
      const category = createCategory();

      await saveCategory(category);

      const updatedCategory = {
        ...category,
        description: 'Updated description',
        revision: 2,
      };

      await expect(
        repository.update(updatedCategory, category.revision),
      ).rejects.toBeInstanceOf(ReferenceCategoryConcurrencyError);

      expect(await repository.findById(category.id)).toEqual(category);
    });

    it('does not overwrite another category reservation', async () => {
      const firstCategory = createCategory({
        id: 'category-1',
        name: 'Species',
      });

      const secondCategory = createCategory({
        id: 'category-2',
        name: 'Creatures',
      });

      await saveCategory(firstCategory);
      await saveReservation(firstCategory);

      await saveCategory(secondCategory);
      await saveReservation(secondCategory);

      const renamedCategory = {
        ...secondCategory,
        name: 'Species',
        revision: 2,
      };

      await expect(
        repository.update(renamedCategory, secondCategory.revision),
      ).rejects.toBeInstanceOf(ReferenceCategoryNameConflictError);

      expect(await repository.findById(secondCategory.id)).toEqual(secondCategory);

      expect(await findReservation(secondCategory.universeId, 'Creatures')).toEqual({
        universeId: secondCategory.universeId,
        name: 'Creatures',
        categoryId: secondCategory.id,
      });

      expect(await findReservation(firstCategory.universeId, 'Species')).toEqual({
        universeId: firstCategory.universeId,
        name: firstCategory.name,
        categoryId: firstCategory.id,
      });
    });
  });

  describe('restore', () => {
    it('restores a deleted category and reserves its name', async () => {
      const category = createCategory({
        deletedAt: '2026-01-02T00:00:00.000Z',
      });

      await saveCategory(category);

      const restoredCategory = {
        ...category,
        deletedAt: null,
        updatedAt: '2026-01-03T00:00:00.000Z',
        revision: 2,
      };

      await repository.restore(restoredCategory, category.revision);

      expect(await repository.findById(category.id)).toEqual(restoredCategory);

      expect(await findReservation(category.universeId, category.name)).toEqual({
        universeId: category.universeId,
        name: category.name,
        categoryId: category.id,
      });
    });

    it('throws when the category does not exist', async () => {
      const category = createCategory({
        revision: 2,
      });

      await expect(repository.restore(category, 1)).rejects.toBeInstanceOf(
        ReferenceCategoryConcurrencyError,
      );
    });

    it('throws when the expected revision is outdated', async () => {
      const category = createCategory({
        deletedAt: '2026-01-02T00:00:00.000Z',
      });

      await saveCategory(category);

      const restoredCategory = {
        ...category,
        deletedAt: null,
        revision: 2,
      };

      await expect(repository.restore(restoredCategory, 0)).rejects.toBeInstanceOf(
        ReferenceCategoryConcurrencyError,
      );

      expect(await repository.findById(category.id)).toEqual(category);
    });

    it('throws when the category is already active', async () => {
      const category = createCategory();

      await saveCategory(category);
      await saveReservation(category);

      const restoredCategory = {
        ...category,
        revision: 2,
      };

      await expect(
        repository.restore(restoredCategory, category.revision),
      ).rejects.toBeInstanceOf(ReferenceCategoryConcurrencyError);

      expect(await repository.findById(category.id)).toEqual(category);
    });

    it('throws when the category name is already reserved by another category', async () => {
      const deletedCategory = createCategory({
        id: 'category-1',
        name: 'Species',
        deletedAt: '2026-01-02T00:00:00.000Z',
      });

      const activeCategory = createCategory({
        id: 'category-2',
        name: 'Species',
      });

      await saveCategory(deletedCategory);
      await saveCategory(activeCategory);
      await saveReservation(activeCategory);

      const restoredCategory = {
        ...deletedCategory,
        deletedAt: null,
        revision: 2,
      };

      await expect(
        repository.restore(restoredCategory, deletedCategory.revision),
      ).rejects.toBeInstanceOf(ReferenceCategoryNameConflictError);

      expect(await repository.findById(deletedCategory.id)).toEqual(deletedCategory);

      expect(await findReservation(activeCategory.universeId, 'Species')).toEqual({
        universeId: activeCategory.universeId,
        name: 'Species',
        categoryId: activeCategory.id,
      });
    });

    it('throws when the deleted category unexpectedly has a name reservation', async () => {
      const category = createCategory({
        deletedAt: '2026-01-02T00:00:00.000Z',
      });

      await saveCategory(category);
      await saveReservation(category);

      const restoredCategory = {
        ...category,
        deletedAt: null,
        revision: 2,
      };

      await expect(
        repository.restore(restoredCategory, category.revision),
      ).rejects.toBeInstanceOf(ReferenceCategoryConcurrencyError);

      expect(await repository.findById(category.id)).toEqual(category);
    });
  });

  it('should create a category when its universe is active', async () => {
    const universe = createUniverse({
      id: 'universe-1',
    });

    const category = createCategory({
      id: 'category-1',
      universeId: universe.id,
    });

    await saveUniverse(universe);

    const result = await repository.createIfUniverseActive(category);

    expect(result).toBe(true);

    await expect(repository.findById(category.id)).resolves.toEqual(category);

    await expect(
      repository.findActiveByName(category.universeId, category.name),
    ).resolves.toEqual(category);
  });

  it('should not create a category when its universe does not exist', async () => {
    const category = createCategory({
      id: 'category-1',
      universeId: 'missing-universe',
    });

    const result = await repository.createIfUniverseActive(category);

    expect(result).toBe(false);

    await expect(repository.findById(category.id)).resolves.toBeNull();
  });

  it('should not create a category when its universe is deleted', async () => {
    const universe = createUniverse({
      id: 'universe-1',
      deletedAt: '2026-01-01T00:00:00.000Z',
    });

    const category = createCategory({
      id: 'category-1',
      universeId: universe.id,
    });

    await saveUniverse(universe);

    const result = await repository.createIfUniverseActive(category);

    expect(result).toBe(false);

    await expect(repository.findById(category.id)).resolves.toBeNull();
  });

  it('should rollback category creation when its name is already reserved', async () => {
    const universe = createUniverse({
      id: 'universe-1',
    });

    const existingCategory = createCategory({
      id: 'category-1',
      universeId: universe.id,
      name: 'Species',
    });

    const duplicateCategory = createCategory({
      id: 'category-2',
      universeId: universe.id,
      name: 'Species',
    });

    await saveUniverse(universe);
    await repository.createIfUniverseActive(existingCategory);

    await expect(
      repository.createIfUniverseActive(duplicateCategory),
    ).rejects.toBeInstanceOf(ReferenceCategoryNameConflictError);

    await expect(repository.findById(duplicateCategory.id)).resolves.toBeNull();

    await expect(repository.findActiveByName(universe.id, 'Species')).resolves.toEqual(
      existingCategory,
    );
  });
});
