import { beforeEach, describe, expect, it, vi } from 'vitest';

// Chrome enforces an 8KB per-item limit on storage.sync. The fake mirrors that
// so the quota fallback paths can be exercised.
const SYNC_QUOTA_BYTES_PER_ITEM = 8192;

type Store = Record<string, unknown>;

function createFakeChrome() {
  const runtime: { lastError?: { message: string } } = {};

  function area(name: 'local' | 'sync') {
    const data: Store = {};
    return {
      data,
      get(key: string | null, cb: (res: Store) => void) {
        cb(key === null ? { ...data } : key in data ? { [key]: data[key] } : {});
      },
      set(items: Store, cb: () => void) {
        const tooLarge = Object.values(items).some(
          (v) => JSON.stringify(v).length > SYNC_QUOTA_BYTES_PER_ITEM
        );
        if (name === 'sync' && tooLarge) {
          runtime.lastError = { message: 'QUOTA_BYTES_PER_ITEM quota exceeded' };
        } else {
          Object.assign(data, items);
        }
        cb();
        runtime.lastError = undefined;
      },
      remove(key: string, cb: () => void) {
        delete data[key];
        cb();
      },
      clear(cb: () => void) {
        for (const k of Object.keys(data)) delete data[k];
        cb();
      },
    };
  }

  return {
    runtime,
    storage: {
      local: area('local'),
      sync: area('sync'),
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
  };
}

let fakeChrome: ReturnType<typeof createFakeChrome>;

async function loadStorage() {
  // The module keeps the cloud-sync flag in module state, so each test gets a
  // fresh copy.
  vi.resetModules();
  const mod = await import('./storage');
  return mod.storage;
}

beforeEach(() => {
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  fakeChrome = createFakeChrome();
  vi.stubGlobal('chrome', fakeChrome);
});

describe('storage area routing', () => {
  it('writes sync-designated keys to chrome.storage.sync', async () => {
    const storage = await loadStorage();
    await storage.set('settings', { theme: 'dark' });
    expect(fakeChrome.storage.sync.data.settings).toEqual({ theme: 'dark' });
    expect(fakeChrome.storage.local.data.settings).toBeUndefined();
  });

  it('never syncs auth tokens', async () => {
    const storage = await loadStorage();
    await storage.set('githubToken', 'ghp_example');
    expect(fakeChrome.storage.local.data.githubToken).toBe('ghp_example');
    expect(fakeChrome.storage.sync.data.githubToken).toBeUndefined();
    expect(storage.isSynced('githubToken')).toBe(false);
  });

  it('backfills a sync key from local for installs that predate sync', async () => {
    fakeChrome.storage.local.data.snippets = [{ id: 'legacy' }];
    const storage = await loadStorage();
    await expect(storage.get('snippets')).resolves.toEqual([{ id: 'legacy' }]);
  });

  it('falls back to local when a sync write exceeds the item quota', async () => {
    const storage = await loadStorage();
    const big = 'x'.repeat(SYNC_QUOTA_BYTES_PER_ITEM + 1);
    await storage.set('snippets', big);
    expect(fakeChrome.storage.sync.data.snippets).toBeUndefined();
    expect(fakeChrome.storage.local.data.snippets).toBe(big);
  });
});

describe('setCloudSync', () => {
  it('moves sync keys down to local when disabled and remembers the choice', async () => {
    fakeChrome.storage.sync.data.settings = { theme: 'dark' };
    const storage = await loadStorage();

    await storage.setCloudSync(false);

    expect(fakeChrome.storage.local.data.settings).toEqual({ theme: 'dark' });
    expect(fakeChrome.storage.sync.data.settings).toBeUndefined();
    expect(fakeChrome.storage.local.data.cloudSyncEnabled).toBe(false);
    expect(storage.getCloudSyncEnabled()).toBe(false);
  });

  it('moves sync keys up to sync when re-enabled', async () => {
    fakeChrome.storage.local.data.cloudSyncEnabled = false;
    fakeChrome.storage.local.data.settings = { theme: 'light' };
    const storage = await loadStorage();
    await storage.initCloudSync();

    await storage.setCloudSync(true);

    expect(fakeChrome.storage.sync.data.settings).toEqual({ theme: 'light' });
    expect(fakeChrome.storage.local.data.settings).toBeUndefined();
  });

  it('keeps the local copy when a value is too large to sync', async () => {
    // Regression: the quota fallback writes back to local, which is the source
    // area when enabling sync. Removing the "source" afterwards deleted the data.
    const big = 'x'.repeat(SYNC_QUOTA_BYTES_PER_ITEM + 1);
    fakeChrome.storage.local.data.cloudSyncEnabled = false;
    fakeChrome.storage.local.data.snippets = big;
    const storage = await loadStorage();
    await storage.initCloudSync();

    await storage.setCloudSync(true);

    expect(fakeChrome.storage.local.data.snippets).toBe(big);
    await expect(storage.get('snippets')).resolves.toBe(big);
  });
});
