import { create } from 'zustand';
import type { Bookmark, BookmarkCategory } from '@/types';
import { storage } from '@/services/storage';
import {
  listAllChromeBookmarks,
  createChromeBookmark,
  updateChromeBookmark,
  removeChromeBookmark,
  moveChromeBookmark,
  subscribeToBookmarkChanges,
  categoryFromFolder,
  type ChromeBookmarkLeaf,
} from '@/services/chromeBookmarks';

/**
 * The Chrome bookmarks tree is the source of truth for title/url/order. We
 * keep a per-bookmark metadata overlay (pin, favorite, tags, description,
 * lastUsedAt, optional user-chosen category) keyed by the Chrome bookmark id.
 */
interface BookmarkMeta {
  isPinned?: boolean;
  isFavorite?: boolean;
  tags?: string[];
  description?: string;
  lastUsedAt?: number;
  category?: BookmarkCategory;
  environment?: Bookmark['environment'];
  order?: number;
}

type MetaMap = Record<string, BookmarkMeta>;

interface BookmarksState {
  bookmarks: Bookmark[];
  isLoading: boolean;
  isSyncing: boolean;
  load: () => Promise<void>;
  add: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'order'>) => Promise<void>;
  update: (id: string, updates: Partial<Bookmark>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  reorder: (bookmarks: Bookmark[]) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  markUsed: (id: string) => Promise<void>;
  getByCategory: (category: BookmarkCategory) => Bookmark[];
}

function mergeWithMeta(leaves: ChromeBookmarkLeaf[], meta: MetaMap): Bookmark[] {
  const merged = leaves.map<Bookmark>((leaf) => {
    const m = meta[leaf.id] ?? {};
    const category: BookmarkCategory = m.category ?? categoryFromFolder(leaf.folderPath);
    const folderTag = leaf.folderPath ? leaf.folderPath.split(' / ').pop() : undefined;
    const tags = m.tags && m.tags.length > 0 ? m.tags : folderTag ? [folderTag] : [];
    return {
      id: leaf.id,
      title: leaf.title,
      url: leaf.url,
      description: m.description,
      tags,
      category,
      environment: m.environment,
      isPinned: m.isPinned ?? false,
      isFavorite: m.isFavorite ?? false,
      order: m.order ?? leaf.index,
      createdAt: leaf.dateAdded,
      lastUsedAt: m.lastUsedAt,
      folder: leaf.parentTitle,
      folderPath: leaf.folderPath,
    };
  });
  merged.sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    if (a.order !== b.order) return a.order - b.order;
    return a.createdAt - b.createdAt;
  });
  return merged;
}

async function readMeta(): Promise<MetaMap> {
  return (await storage.get<MetaMap>('bookmarksMeta')) ?? {};
}

async function writeMeta(meta: MetaMap): Promise<void> {
  await storage.set('bookmarksMeta', meta);
}

async function patchMeta(id: string, patch: BookmarkMeta): Promise<MetaMap> {
  const meta = await readMeta();
  const next: MetaMap = { ...meta, [id]: { ...meta[id], ...patch } };
  await writeMeta(next);
  return next;
}

async function pruneMeta(leaves: ChromeBookmarkLeaf[]): Promise<MetaMap> {
  const meta = await readMeta();
  const liveIds = new Set(leaves.map((l) => l.id));
  let changed = false;
  const next: MetaMap = {};
  for (const [id, value] of Object.entries(meta)) {
    if (liveIds.has(id)) {
      next[id] = value;
    } else {
      changed = true;
    }
  }
  if (changed) await writeMeta(next);
  return next;
}

let chromeSubscribed = false;

export const useBookmarksStore = create<BookmarksState>((set, get) => ({
  bookmarks: [],
  isLoading: false,
  isSyncing: false,

  load: async () => {
    set({ isLoading: true });
    const leaves = await listAllChromeBookmarks();

    // Fall back to legacy app-only bookmarks when the chrome.bookmarks API
    // isn't available (e.g. tests running outside an extension context).
    if (leaves.length === 0 && (typeof chrome === 'undefined' || !chrome.bookmarks)) {
      const legacy = await storage.get<Bookmark[]>('bookmarks');
      set({ bookmarks: legacy ?? [], isLoading: false });
      return;
    }

    const meta = await pruneMeta(leaves);
    set({ bookmarks: mergeWithMeta(leaves, meta), isLoading: false });

    if (!chromeSubscribed) {
      chromeSubscribed = true;
      subscribeToBookmarkChanges(async () => {
        const fresh = await listAllChromeBookmarks();
        const freshMeta = await pruneMeta(fresh);
        set({ bookmarks: mergeWithMeta(fresh, freshMeta) });
      });
    }
  },

  add: async (bookmark) => {
    set({ isSyncing: true });
    const folderTitle = bookmark.tags?.[0] ?? bookmark.category;
    const created = await createChromeBookmark(bookmark.title, bookmark.url, folderTitle);
    if (created) {
      await patchMeta(created.id, {
        category: bookmark.category,
        tags: bookmark.tags,
        description: bookmark.description,
        isPinned: bookmark.isPinned,
        isFavorite: bookmark.isFavorite,
        environment: bookmark.environment,
      });
    }
    await get().load();
    set({ isSyncing: false });
  },

  update: async (id, updates) => {
    set({ isSyncing: true });
    if (updates.title !== undefined || updates.url !== undefined) {
      await updateChromeBookmark(id, {
        title: updates.title,
        url: updates.url,
      });
    }
    const metaPatch: BookmarkMeta = {};
    if ('description' in updates) metaPatch.description = updates.description;
    if ('tags' in updates) metaPatch.tags = updates.tags;
    if ('category' in updates) metaPatch.category = updates.category;
    if ('environment' in updates) metaPatch.environment = updates.environment;
    if ('isPinned' in updates) metaPatch.isPinned = updates.isPinned;
    if ('isFavorite' in updates) metaPatch.isFavorite = updates.isFavorite;
    if ('order' in updates) metaPatch.order = updates.order;
    if (Object.keys(metaPatch).length > 0) {
      await patchMeta(id, metaPatch);
    }
    await get().load();
    set({ isSyncing: false });
  },

  remove: async (id) => {
    set({ isSyncing: true });
    await removeChromeBookmark(id);
    const meta = await readMeta();
    if (meta[id]) {
      const { [id]: _drop, ...rest } = meta;
      void _drop;
      await writeMeta(rest);
    }
    await get().load();
    set({ isSyncing: false });
  },

  reorder: async (bookmarks) => {
    const meta = await readMeta();
    const next: MetaMap = { ...meta };
    bookmarks.forEach((b, i) => {
      next[b.id] = { ...next[b.id], order: i };
    });
    await writeMeta(next);
    for (let i = 0; i < bookmarks.length; i++) {
      try {
        await moveChromeBookmark(bookmarks[i].id, { index: i });
      } catch {
        /* some virtual folders disallow reordering — metadata order still wins */
      }
    }
    set({ bookmarks });
  },

  togglePin: async (id) => {
    const current = get().bookmarks.find((b) => b.id === id);
    await patchMeta(id, { isPinned: !(current?.isPinned ?? false) });
    await get().load();
  },

  toggleFavorite: async (id) => {
    const current = get().bookmarks.find((b) => b.id === id);
    await patchMeta(id, { isFavorite: !(current?.isFavorite ?? false) });
    await get().load();
  },

  markUsed: async (id) => {
    await patchMeta(id, { lastUsedAt: Date.now() });
    set({
      bookmarks: get().bookmarks.map((b) => (b.id === id ? { ...b, lastUsedAt: Date.now() } : b)),
    });
  },

  getByCategory: (category) => get().bookmarks.filter((b) => b.category === category),
}));
