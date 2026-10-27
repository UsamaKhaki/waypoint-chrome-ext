import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Star,
  Pin,
  Clock,
  Folder,
  FolderOpen,
  ChevronRight,
  LayoutGrid,
  Rows3,
  X,
  Globe,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';
import { useBookmarksStore } from '@/store/bookmarks.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BookmarkCard } from './BookmarkCard';
import { BookmarkForm } from './BookmarkForm';
import { cn } from '@/lib/utils';
import type { Bookmark, BookmarkCategory, EnvironmentType } from '@/types';

type FilterTab = 'all' | 'pinned' | 'favorites' | 'recent';
type ViewMode = 'grid' | 'list';

const UNCATEGORIZED = 'Other';

function folderColor(name: string): string {
  // Stable hue derived from folder name so each folder gets a consistent tint.
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 65% 60%)`;
}

export function BookmarksPanel() {
  const { bookmarks } = useBookmarksStore();
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [view, setView] = useState<ViewMode>('grid');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | undefined>(undefined);
  const [addingCategory, setAddingCategory] = useState<BookmarkCategory | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);

  /* ── Apply search + filter tab ──────────────────────────────────── */
  const filtered = useMemo(() => {
    let result = bookmarks;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          (b.folder?.toLowerCase().includes(q) ?? false) ||
          b.tags.some((t) => t.toLowerCase().includes(q)) ||
          b.description?.toLowerCase().includes(q)
      );
    }

    switch (filterTab) {
      case 'pinned':
        return result.filter((b) => b.isPinned);
      case 'favorites':
        return result.filter((b) => b.isFavorite);
      case 'recent':
        return [...result].sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0)).slice(0, 30);
      default:
        return result;
    }
  }, [bookmarks, search, filterTab]);

  /* ── Group by actual Chrome folder ─────────────────────────────── */
  const { folders, groups } = useMemo(() => {
    const map = new Map<string, Bookmark[]>();
    for (const b of filtered) {
      const key = b.folder?.trim() || UNCATEGORIZED;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(b);
    }
    // Sort folders: largest first, then alphabetical
    const folderList = Array.from(map.keys()).sort((a, b) => {
      const diff = (map.get(b)?.length ?? 0) - (map.get(a)?.length ?? 0);
      if (diff !== 0) return diff;
      return a.localeCompare(b);
    });
    return { folders: folderList, groups: map };
  }, [filtered]);

  const visibleFolders = activeFolder ? folders.filter((f) => f === activeFolder) : folders;

  /* ── Environment buckets (Local / Stage / Production) ──────────────── */
  const envCounts = useMemo(() => {
    const out: Record<EnvironmentType, number> = { local: 0, stage: 0, production: 0 };
    for (const b of bookmarks) {
      if (b.environment) out[b.environment] += 1;
    }
    return out;
  }, [bookmarks]);

  const openAllInEnvironment = (env: EnvironmentType) => {
    const items = bookmarks.filter((b) => b.environment === env);
    if (items.length === 0) return;

    if (env === 'production') {
      const ok = window.confirm(
        `Open ${items.length} Production link${items.length === 1 ? '' : 's'} in new tabs?\n\nThese point to your live environment — double-check before clicking through.`
      );
      if (!ok) return;
    }
    for (const b of items) chrome.tabs.create({ url: b.url });
  };

  const pinned = useMemo(() => filtered.filter((b) => b.isPinned), [filtered]);

  /* ── Form helpers ──────────────────────────────────────────────── */
  const openAdd = (category?: BookmarkCategory) => {
    setEditingBookmark(undefined);
    setAddingCategory(category);
    setIsFormOpen(true);
  };
  const openEdit = (bookmark: Bookmark) => {
    setEditingBookmark(bookmark);
    setAddingCategory(undefined);
    setIsFormOpen(true);
  };

  const toggleFolder = (name: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const filterTabs: { id: FilterTab; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'All', icon: Folder },
    { id: 'pinned', label: 'Pinned', icon: Pin },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'recent', label: 'Recent', icon: Clock },
  ];

  return (
    <div data-testid="bookmarks-panel" className="flex flex-col h-full">
      {/* ───────────────── Header ───────────────── */}
      <div className="px-6 pt-6 pb-4 border-b border-border-subtle">
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-primary tracking-tight">Bookmarks</h1>
            <p className="text-sm text-muted mt-1">
              {bookmarks.length.toLocaleString()} saved · {folders.length} folder
              {folders.length === 1 ? '' : 's'} · synced with Chrome
            </p>
          </div>
          <Button data-testid="add-bookmark-btn" onClick={() => openAdd()}>
            <Plus className="h-4 w-4" />
            New Bookmark
          </Button>
        </div>

        {/* Search + filter tabs + view toggle */}
        <div className="flex items-center gap-3">
          <div className="flex-1 max-w-md">
            <Input
              data-testid="bookmark-search"
              placeholder="Search by title, URL, folder, or tag…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="flex items-center gap-1 bg-surface-elevated rounded-xl p-1">
            {filterTabs.map((tab) => {
              const Icon = tab.icon;
              const active = filterTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-testid={`bookmark-filter-${tab.id}`}
                  onClick={() => setFilterTab(tab.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150',
                    active ? 'bg-surface text-primary shadow-sm' : 'text-muted hover:text-secondary'
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 bg-surface-elevated rounded-xl p-1">
            <button
              onClick={() => setView('grid')}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                view === 'grid' ? 'bg-surface text-primary' : 'text-muted hover:text-secondary'
              )}
              title="Grid view"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setView('list')}
              className={cn(
                'p-1.5 rounded-lg transition-colors',
                view === 'list' ? 'bg-surface text-primary' : 'text-muted hover:text-secondary'
              )}
              title="List view"
            >
              <Rows3 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Folder pill bar */}
        {folders.length > 0 && (
          <div className="flex items-center gap-1.5 mt-4 overflow-x-auto scrollbar-none pb-1">
            <button
              onClick={() => setActiveFolder(null)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors',
                activeFolder === null
                  ? 'bg-accent/15 text-accent border border-accent/20'
                  : 'bg-surface-elevated text-secondary border border-border-subtle hover:text-primary'
              )}
            >
              <FolderOpen className="h-3 w-3" />
              All folders
              <span className="text-muted">{filtered.length}</span>
            </button>
            {folders.map((name) => {
              const count = groups.get(name)?.length ?? 0;
              const active = activeFolder === name;
              return (
                <button
                  key={name}
                  onClick={() => setActiveFolder(active ? null : name)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border',
                    active
                      ? 'bg-accent/15 text-accent border-accent/20'
                      : 'bg-surface-elevated text-secondary border-border-subtle hover:text-primary'
                  )}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: folderColor(name) }}
                  />
                  {name}
                  <span className="text-muted">{count}</span>
                </button>
              );
            })}
            {activeFolder && (
              <button
                onClick={() => setActiveFolder(null)}
                className="flex items-center gap-1 px-2 py-1.5 rounded-full text-xs text-muted hover:text-primary"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* ───────────────── Environment quick-actions ───────────────── */}
      {envCounts.local + envCounts.stage + envCounts.production > 0 && (
        <div className="px-6 pt-4 pb-2 border-b border-border-subtle flex items-center gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 text-xs text-muted whitespace-nowrap mr-1">
            <Globe className="h-3.5 w-3.5" />
            Environments
          </div>
          {(['local', 'stage', 'production'] as EnvironmentType[]).map((env) => {
            const count = envCounts[env];
            if (count === 0) return null;
            const dotColor =
              env === 'local'
                ? 'bg-env-local'
                : env === 'stage'
                  ? 'bg-env-stage'
                  : 'bg-env-production';
            const isProd = env === 'production';
            return (
              <button
                key={env}
                onClick={() => openAllInEnvironment(env)}
                className={cn(
                  'group flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-colors',
                  isProd
                    ? 'border-env-production/30 text-env-production hover:bg-env-production/10'
                    : 'border-border-subtle text-secondary hover:bg-surface-elevated hover:text-primary'
                )}
                title={`Open all ${count} ${env} link${count === 1 ? '' : 's'} in new tabs`}
              >
                <span
                  className={cn('h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]', dotColor)}
                />
                <span className="capitalize">{env}</span>
                <span className="text-muted">{count}</span>
                {isProd ? (
                  <AlertTriangle className="h-3 w-3" />
                ) : (
                  <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ───────────────── Body ───────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-surface-elevated flex items-center justify-center mb-4">
              <Folder className="h-7 w-7 text-muted" />
            </div>
            <h3 className="text-base font-semibold text-primary">
              {search
                ? 'No bookmarks match your search'
                : filterTab === 'pinned'
                  ? 'Nothing pinned yet'
                  : filterTab === 'favorites'
                    ? 'No favorites yet'
                    : filterTab === 'recent'
                      ? "You haven't opened anything from here yet"
                      : 'No bookmarks yet'}
            </h3>
            <p className="text-sm text-muted mt-1.5 max-w-xs">
              {search
                ? 'Try a different keyword or clear your search.'
                : 'Add bookmarks here or in Chrome — they stay in sync automatically.'}
            </p>
            {!search && (
              <Button className="mt-5" onClick={() => openAdd()}>
                <Plus className="h-4 w-4" /> Add Bookmark
              </Button>
            )}
          </div>
        )}

        {/* Pinned highlight strip — only on "all" tab without search/folder filter */}
        {filterTab === 'all' && !search && !activeFolder && pinned.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-3 px-1">
              <Pin className="h-3.5 w-3.5 text-accent" />
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">Pinned</h2>
              <span className="text-xs text-muted">({pinned.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {pinned.map((b) => (
                <BookmarkCard key={b.id} bookmark={b} onEdit={openEdit} />
              ))}
            </div>
          </section>
        )}

        {/* Folder sections */}
        <div>
          {visibleFolders.map((folderName) => {
            const items = groups.get(folderName) ?? [];
            if (items.length === 0) return null;
            const isCollapsed = collapsed.has(folderName);
            const dotColor = folderColor(folderName);

            return (
              <section key={folderName} className="mb-6">
                <button
                  onClick={() => toggleFolder(folderName)}
                  className="flex items-center gap-2.5 w-full px-1 py-2 group"
                >
                  <ChevronRight
                    className={cn(
                      'h-4 w-4 text-muted transition-transform duration-200',
                      !isCollapsed && 'rotate-90'
                    )}
                  />
                  <div
                    className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${dotColor}1f` }}
                  >
                    <Folder className="h-3.5 w-3.5" style={{ color: dotColor }} />
                  </div>
                  <h2 className="text-sm font-semibold text-primary">{folderName}</h2>
                  <span className="px-1.5 py-0.5 rounded-md bg-surface-elevated text-muted text-xs font-medium">
                    {items.length}
                  </span>
                  {items[0]?.folderPath && items[0].folderPath !== folderName && (
                    <span className="text-xs text-muted truncate hidden md:inline">
                      · {items[0].folderPath}
                    </span>
                  )}
                  <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAdd();
                      }}
                      title="Add bookmark to this folder"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </button>

                {!isCollapsed && (
                  <div
                    className={cn(
                      'gap-2.5 pt-1',
                      view === 'grid'
                        ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                        : 'flex flex-col'
                    )}
                  >
                    {items.map((b) => (
                      <BookmarkCard
                        key={b.id}
                        bookmark={b}
                        onEdit={openEdit}
                        compact={view === 'list'}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {/* Form modal */}
      <BookmarkForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        bookmark={editingBookmark}
        defaultCategory={addingCategory}
      />
    </div>
  );
}
