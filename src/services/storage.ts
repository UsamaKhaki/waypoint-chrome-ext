import type { StorageKey } from '@/types';

type StorageData = Record<string, unknown>;

export const storage = {
  async get<T>(key: StorageKey): Promise<T | null> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(key, (result) => {
          resolve((result[key] as T) ?? null);
        });
      } else {
        // Dev fallback: localStorage
        const raw = localStorage.getItem(key);
        resolve(raw ? (JSON.parse(raw) as T) : null);
      }
    });
  },

  async set<T>(key: StorageKey, value: T): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set({ [key]: value }, resolve);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
        resolve();
      }
    });
  },

  async remove(key: StorageKey): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.remove(key, resolve);
      } else {
        localStorage.removeItem(key);
        resolve();
      }
    });
  },

  async getAll(): Promise<StorageData> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.get(null, resolve);
      } else {
        const data: StorageData = {};
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k) {
            const raw = localStorage.getItem(k);
            data[k] = raw ? JSON.parse(raw) : null;
          }
        }
        resolve(data);
      }
    });
  },

  async clear(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.clear(resolve);
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
};
