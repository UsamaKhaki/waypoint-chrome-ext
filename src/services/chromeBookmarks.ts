/**
 * Thin wrapper around the chrome.bookmarks API.
 *
 * Exposes a flat-list view of the user's browser bookmarks (only url-bearing
 * leaves), plus minimal mutation helpers and a change subscription. The
 * extension's bookmarks store treats Chrome as the source of truth and keeps
 * its own metadata (pin, favorite, tags, description, lastUsedAt) in a local
 * overlay keyed by the Chrome bookmark id.
 */

import type { BookmarkCategory } from '@/types';

export interface ChromeBookmarkLeaf {
  id: string;
  parentId: string | undefined;
  parentTitle: string | undefined;
  title: string;
  url: string;
  index: number;
  dateAdded: number;
  /** Folder path from root, e.g. "Bookmarks Bar / Dev / GitHub". */
  folderPath: string;
}

const FOLDER_CATEGORY_RULES: { match: RegExp; category: BookmarkCategory }[] = [
  { match: /github|git\b/i, category: 'github' },
  { match: /pull.?request|^pr\b|reviews?/i, category: 'pull-requests' },
  { match: /ci.?cd|jenkins|circle|actions|pipeline/i, category: 'ci-cd' },
  { match: /monitor|grafana|datadog|sentry|alert/i, category: 'monitoring' },
  { match: /docs?|documentation|wiki|notion|confluence/i, category: 'documentation' },
  { match: /local(host)?|dev\b/i, category: 'local-dev' },
  { match: /stag(e|ing)/i, category: 'stage' },
  { match: /prod(uction)?\b/i, category: 'production' },
  { match: /design|figma|sketch/i, category: 'design' },
  { match: /personal|home/i, category: 'personal' },
  { match: /tools?|company|admin/i, category: 'company-tools' },
];

export function categoryFromFolder(folderPath: string | undefined): BookmarkCategory {
  if (!folderPath) return 'custom';
  for (const rule of FOLDER_CATEGORY_RULES) {
    if (rule.match.test(folderPath)) return rule.category;
  }
  return 'custom';
}

function isAvailable(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.bookmarks;
}

function walkTree(
  nodes: chrome.bookmarks.BookmarkTreeNode[],
  out: ChromeBookmarkLeaf[],
  parents: { id: string; title: string }[]
) {
  for (const n of nodes) {
    if (n.url) {
      const parent = parents[parents.length - 1];
      out.push({
        id: n.id,
        parentId: n.parentId,
        parentTitle: parent?.title,
        title: n.title || n.url,
        url: n.url,
        index: n.index ?? 0,
        dateAdded: n.dateAdded ?? Date.now(),
        folderPath: parents
          .map((p) => p.title)
          .filter(Boolean)
          .join(' / '),
      });
    }
    if (n.children?.length) {
      walkTree(n.children, out, [...parents, { id: n.id, title: n.title }]);
    }
  }
}

/** Return every url-bearing bookmark, flattened. Empty array if unavailable. */
export async function listAllChromeBookmarks(): Promise<ChromeBookmarkLeaf[]> {
  if (!isAvailable()) return [];
  return new Promise((resolve) => {
    chrome.bookmarks.getTree((tree) => {
      const out: ChromeBookmarkLeaf[] = [];
      // The root has unnamed virtual folders ("Bookmarks bar", "Other bookmarks", ...).
      // We descend into their children so the visible folder path starts at the
      // top-level user-facing folder.
      walkTree(tree[0]?.children ?? [], out, []);
      resolve(out);
    });
  });
}

/**
 * Create a new Chrome bookmark. If `folderTitle` is provided we look for an
 * existing top-level folder (in "Other bookmarks") with that name and create
 * one if missing. Otherwise drops into "Other bookmarks".
 */
export async function createChromeBookmark(
  title: string,
  url: string,
  folderTitle?: string
): Promise<chrome.bookmarks.BookmarkTreeNode | null> {
  if (!isAvailable()) return null;

  let parentId: string | undefined;
  if (folderTitle) {
    parentId = await ensureFolder(folderTitle);
  }

  return new Promise((resolve) => {
    chrome.bookmarks.create({ parentId, title, url }, (node) => resolve(node ?? null));
  });
}

async function ensureFolder(title: string): Promise<string | undefined> {
  if (!isAvailable()) return undefined;
  // "Other bookmarks" has id "2" by Chrome convention.
  const OTHER_BOOKMARKS_ID = '2';
  const existing = await new Promise<chrome.bookmarks.BookmarkTreeNode[]>((resolve) => {
    chrome.bookmarks.search({ title }, (results) => resolve(results ?? []));
  });
  const folder = existing.find((n) => !n.url && n.title === title);
  if (folder) return folder.id;
  return new Promise<string | undefined>((resolve) => {
    chrome.bookmarks.create({ parentId: OTHER_BOOKMARKS_ID, title }, (node) => resolve(node?.id));
  });
}

export async function updateChromeBookmark(
  id: string,
  changes: { title?: string; url?: string }
): Promise<void> {
  if (!isAvailable()) return;
  return new Promise((resolve) => {
    chrome.bookmarks.update(id, changes, () => resolve());
  });
}

export async function removeChromeBookmark(id: string): Promise<void> {
  if (!isAvailable()) return;
  return new Promise((resolve) => {
    chrome.bookmarks.remove(id, () => resolve());
  });
}

export async function moveChromeBookmark(
  id: string,
  destination: { parentId?: string; index?: number }
): Promise<void> {
  if (!isAvailable()) return;
  return new Promise((resolve) => {
    chrome.bookmarks.move(id, destination, () => resolve());
  });
}

type ChangeHandler = () => void;

/**
 * Subscribe to every Chrome bookmark mutation. Returns an unsubscribe fn.
 * Listeners are coalesced to a single change callback because the store
 * always responds by refetching the full tree.
 */
export function subscribeToBookmarkChanges(handler: ChangeHandler): () => void {
  if (!isAvailable()) return () => {};
  const events = [
    chrome.bookmarks.onCreated,
    chrome.bookmarks.onChanged,
    chrome.bookmarks.onRemoved,
    chrome.bookmarks.onMoved,
    chrome.bookmarks.onChildrenReordered,
    chrome.bookmarks.onImportEnded,
  ].filter(Boolean);
  events.forEach((evt) => evt.addListener(handler));
  return () => events.forEach((evt) => evt.removeListener(handler));
}
