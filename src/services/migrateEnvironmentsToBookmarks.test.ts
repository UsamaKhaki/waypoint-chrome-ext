import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Environment } from '@/types';

const store: Record<string, unknown> = {};

vi.mock('@/services/storage', () => ({
  storage: {
    get: vi.fn(async (key: string) => (key in store ? store[key] : null)),
    set: vi.fn(async (key: string, value: unknown) => {
      store[key] = value;
    }),
  },
}));

const createChromeBookmark = vi.fn();
vi.mock('./chromeBookmarks', () => ({
  createChromeBookmark: (...args: unknown[]) => createChromeBookmark(...args),
}));

const { migrateEnvironmentsToBookmarks } = await import('./migrateEnvironmentsToBookmarks');

function env(overrides: Partial<Environment>): Environment {
  return {
    id: 'env-1',
    name: 'Production',
    type: 'production',
    links: [],
    color: '#f00',
    isActive: false,
    ...overrides,
  };
}

beforeEach(() => {
  for (const k of Object.keys(store)) delete store[k];
  createChromeBookmark.mockReset();
  let nextId = 1;
  createChromeBookmark.mockImplementation(async () => ({ id: `bm-${nextId++}` }));
});

describe('migrateEnvironmentsToBookmarks', () => {
  it('does nothing once the migration flag is set', async () => {
    store.environmentsMigratedToBookmarks = true;
    store.environments = [env({ links: [{ label: 'App', url: 'https://app', type: 'frontend' }] })];

    await expect(migrateEnvironmentsToBookmarks()).resolves.toEqual({
      ranNow: false,
      importedCount: 0,
    });
    expect(createChromeBookmark).not.toHaveBeenCalled();
  });

  it('sets the flag without importing when there are no environments', async () => {
    await expect(migrateEnvironmentsToBookmarks()).resolves.toEqual({
      ranNow: false,
      importedCount: 0,
    });
    expect(store.environmentsMigratedToBookmarks).toBe(true);
  });

  it('creates a bookmark per link and tags it with the environment', async () => {
    store.environments = [
      env({
        name: 'Production',
        notes: 'Be careful',
        links: [
          { label: 'App', url: 'https://app.example.com', type: 'frontend' },
          { label: '', url: 'https://logs.example.com', type: 'logs' },
          { label: 'Empty', url: '', type: 'admin' },
        ],
      }),
    ];

    const result = await migrateEnvironmentsToBookmarks();

    expect(result).toEqual({ ranNow: true, importedCount: 2 });
    expect(createChromeBookmark).toHaveBeenNthCalledWith(
      1,
      'App',
      'https://app.example.com',
      'Environments / Production'
    );
    // Falls back to the URL when a link has no label.
    expect(createChromeBookmark).toHaveBeenNthCalledWith(
      2,
      'https://logs.example.com',
      'https://logs.example.com',
      'Environments / Production'
    );
    expect(store.bookmarksMeta).toEqual({
      'bm-1': {
        environment: 'production',
        tags: ['Production', 'frontend'],
        description: 'Be careful',
      },
      'bm-2': {
        environment: 'production',
        tags: ['Production', 'logs'],
        description: 'Be careful',
      },
    });
    expect(store.environmentsMigratedToBookmarks).toBe(true);
  });

  it('skips a failing link without aborting the rest', async () => {
    createChromeBookmark
      .mockRejectedValueOnce(new Error('bookmarks API unavailable'))
      .mockResolvedValueOnce({ id: 'bm-ok' });
    store.environments = [
      env({
        links: [
          { label: 'Broken', url: 'https://broken', type: 'frontend' },
          { label: 'Works', url: 'https://works', type: 'backend' },
        ],
      }),
    ];

    await expect(migrateEnvironmentsToBookmarks()).resolves.toEqual({
      ranNow: true,
      importedCount: 1,
    });
    expect(Object.keys(store.bookmarksMeta as object)).toEqual(['bm-ok']);
  });
});
