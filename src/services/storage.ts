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

/**
 * Runtime cloud-sync switch. When OFF, sync-designated keys are written to
 * local instead — the user's data stays on this device only. Defaults to ON to
 * preserve the historical behaviour (sync keys always synced); Pro users can
 * turn it off from Settings. The preference itself lives in local storage and
 * never syncs, so toggling on one device can't fight with another.
 */
let cloudSyncEnabled = true;

function areaFor(key: StorageKey): ChromeArea {
  return SYNC_KEYS.has(key) && cloudSyncEnabled ? 'sync' : 'local';
}

const hasChrome = (): boolean => typeof chrome !== 'undefined' && !!chrome?.storage;

/** Raw single-area read, bypassing area routing (used for migration). */
function rawGet<T>(key: StorageKey, area: ChromeArea): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.storage[area].get(key, (res) => resolve(res[key] as T | undefined));
  });
}

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

  /** The set of keys that follow the user across devices when sync is on. */
  syncKeys(): StorageKey[] {
    return [...SYNC_KEYS];
  },

  /**
   * Hydrate the cloud-sync preference from local storage. Must run before the
   * stores load so `areaFor()` routes reads to the correct area. Returns the
   * resolved flag.
   */
  async initCloudSync(): Promise<boolean> {
    if (!hasChrome()) return cloudSyncEnabled;
    const stored = await new Promise<boolean | undefined>((resolve) => {
      chrome.storage.local.get('cloudSyncEnabled', (res) =>
        resolve(res.cloudSyncEnabled as boolean | undefined)
      );
    });
    if (typeof stored === 'boolean') cloudSyncEnabled = stored;
    return cloudSyncEnabled;
  },

  getCloudSyncEnabled(): boolean {
    return cloudSyncEnabled;
  },

  /**
   * Flip cloud sync on/off and migrate the sync-designated keys between areas
   * so no data is lost or stranded:
   *   - enabling  → copy each key up from local to sync, clear the local copy
   *   - disabling → copy each key down from sync to local, clear the sync copy
   * The preference is written to local last, so a failed migration leaves the
   * flag untouched.
   */
  async setCloudSync(enabled: boolean): Promise<void> {
    if (!hasChrome()) {
      cloudSyncEnabled = enabled;
      return;
    }
    const from: ChromeArea = enabled ? 'local' : 'sync';
    const to: ChromeArea = enabled ? 'sync' : 'local';

    for (const key of SYNC_KEYS) {
      const value = await rawGet<unknown>(key, from);
      if (value === undefined) continue;
      await writeWithFallback(key, value, to);
      // Only drop the source copy if the destination write actually landed
      // there (sync writes can soft-demote to local under quota).
      await new Promise<void>((resolve) => chrome.storage[from].remove(key, () => resolve()));
    }

    cloudSyncEnabled = enabled;
    await new Promise<void>((resolve) =>
      chrome.storage.local.set({ cloudSyncEnabled: enabled }, () => resolve())
    );
  },
};
