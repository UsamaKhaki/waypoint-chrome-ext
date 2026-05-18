import type { StorageKey } from '@/types';

type StorageData = Record<string, unknown>;
type ChromeArea = 'local' | 'sync';
type ChangeListener = (newValue: unknown, oldValue: unknown) => void;

/**
 * Keys that sync across the user's signed-in Chrome profiles.
 *
 * Rules:
 *  - User-curated config that's small and benefits from following the user
 *    across devices goes here (settings, layouts, templates, custom modes).
 *  - Auth tokens NEVER sync (security — they're per-device).
 *  - Large / transient state (sessions, tab snapshots, daily focus, recent
 *    command history, per-device caches) stays local.
 *  - Chrome sync limits: 100KB total, 8KB/item, ~1800 writes/hour. If a sync
 *    write exceeds quota we fall back to local automatically.
 */
const SYNC_KEYS: ReadonlySet<StorageKey> = new Set<StorageKey>([
  'settings',
  'workspaceMode',
  'customWorkspaceModes',
  'overviewLayout',
  'branchTemplates',
  'prTemplates',
  'snippets',
  'onboardingCompleted',
  'environmentsMigratedToBookmarks',
  'subscription',
]);

function areaFor(key: StorageKey): ChromeArea {
  return SYNC_KEYS.has(key) ? 'sync' : 'local';
}

const hasChrome = (): boolean => typeof chrome !== 'undefined' && !!chrome?.storage;

/**
 * Sync writes can fail with QUOTA_BYTES / QUOTA_BYTES_PER_ITEM if a single
 * value blows past 8KB or the total goes over 100KB. We swallow the error and
 * fall back to local so the app never loses data — a "soft demotion" that
 * keeps the feature working, just without cross-device sync for that item.
 */
async function writeWithFallback(key: StorageKey, value: unknown, area: ChromeArea): Promise<void> {
  return new Promise<void>((resolve) => {
    chrome.storage[area].set({ [key]: value }, () => {
      const err = chrome.runtime.lastError;
      if (err && area === 'sync') {
        console.warn(
          `[storage] sync write for "${key}" failed (${err.message}); falling back to local.`
        );
        chrome.storage.local.set({ [key]: value }, () => resolve());
      } else {
        resolve();
      }
    });
  });
}

export const storage = {
  async get<T>(key: StorageKey): Promise<T | null> {
    return new Promise((resolve) => {
      if (hasChrome()) {
        const area = areaFor(key);
        chrome.storage[area].get(key, (result) => {
          if (result[key] !== undefined) {
            resolve(result[key] as T);
          } else if (area === 'sync') {
            // Backfill: an older install may still have this value in local.
            chrome.storage.local.get(key, (localResult) => {
              resolve((localResult[key] as T) ?? null);
            });
          } else {
            resolve(null);
          }
        });
      } else {
        const raw = localStorage.getItem(key);
        resolve(raw ? (JSON.parse(raw) as T) : null);
      }
    });
  },

  async set<T>(key: StorageKey, value: T): Promise<void> {
    if (hasChrome()) {
      return writeWithFallback(key, value, areaFor(key));
    }
    return new Promise((resolve) => {
      localStorage.setItem(key, JSON.stringify(value));
      resolve();
    });
  },

  async remove(key: StorageKey): Promise<void> {
    return new Promise((resolve) => {
      if (hasChrome()) {
        // Remove from both areas to keep things tidy on key area migrations.
        chrome.storage.local.remove(key, () => {
          chrome.storage.sync.remove(key, () => resolve());
        });
      } else {
        localStorage.removeItem(key);
        resolve();
      }
    });
  },

  async getAll(): Promise<StorageData> {
    if (hasChrome()) {
      const [localData, syncData] = await Promise.all([
        new Promise<StorageData>((r) => chrome.storage.local.get(null, r)),
        new Promise<StorageData>((r) => chrome.storage.sync.get(null, r)),
      ]);
      // Sync wins for sync-designated keys; local fills in the rest.
      return { ...localData, ...syncData };
    }
    const data: StorageData = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) {
        const raw = localStorage.getItem(k);
        data[k] = raw ? JSON.parse(raw) : null;
      }
    }
    return data;
  },

  async clear(): Promise<void> {
    return new Promise((resolve) => {
      if (hasChrome()) {
        chrome.storage.local.clear(() => {
          chrome.storage.sync.clear(() => resolve());
        });
      } else {
        localStorage.clear();
        resolve();
      }
    });
  },

  async exportAll(): Promise<string> {
    const data = await this.getAll();
    return JSON.stringify(data, null, 2);
  },

  async importAll(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString) as StorageData;
    for (const [key, value] of Object.entries(data)) {
      await this.set(key as StorageKey, value);
    }
  },

  /**
   * Subscribe to changes for a specific key in any area. Fires when the value
   * is updated locally or by another signed-in device via Chrome sync.
   * Returns an unsubscribe function.
   */
  onChange(key: StorageKey, listener: ChangeListener): () => void {
    if (!hasChrome() || !chrome.storage.onChanged) return () => {};
    const handler = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (!(key in changes)) return;
      // Only react to the area we actually use for this key.
      if (area !== areaFor(key)) return;
      const change = changes[key];
      listener(change.newValue, change.oldValue);
    };
    chrome.storage.onChanged.addListener(handler);
    return () => chrome.storage.onChanged.removeListener(handler);
  },

  /** Whether the given key is configured to sync across devices. */
  isSynced(key: StorageKey): boolean {
    return SYNC_KEYS.has(key);
  },
};
