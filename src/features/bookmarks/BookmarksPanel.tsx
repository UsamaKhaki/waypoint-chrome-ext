import { useState, useMemo } from 'react';
import { Plus, Search, Star, Pin, Clock } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useBookmarksStore } from '@/store/bookmarks.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BookmarkSection } from './BookmarkSection';
import { BookmarkCard } from './BookmarkCard';
import { BookmarkForm } from './BookmarkForm';
import type { Bookmark, BookmarkCategory } from '@/types';
import { BOOKMARK_CATEGORIES } from '@/constants';

type FilterTab = 'all' | 'pinned' | 'favorites' | 'recent';

export function BookmarksPanel() {
  const { bookmarks } = useBookmarksStore();
  const { config } = useWorkspaceStore();
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | undefined>(undefined);
  const [addingCategory, setAddingCategory] = useState<BookmarkCategory | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filteredBookmarks = useMemo(() => {
    let result = bookmarks.filter((b) => config.visibleCategories.includes(b.category));

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
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
        return [...result].sort((a, b) => (b.lastUsedAt ?? 0) - (a.lastUsedAt ?? 0)).slice(0, 20);
      default:
        return result;
    }
  }, [bookmarks, search, filterTab, config.visibleCategories]);

  const groupedByCategory = useMemo(() => {
    const groups: Partial<Record<BookmarkCategory, Bookmark[]>> = {};
    for (const b of filteredBookmarks) {
      if (!groups[b.category]) groups[b.category] = [];
      groups[b.category]!.push(b);
    }
    return groups;
  }, [filteredBookmarks]);

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

  const filterTabs: { id: FilterTab; label: string; icon: React.ElementType }[] = [
    { id: 'all', label: 'All', icon: () => null },
    { id: 'pinned', label: 'Pinned', icon: Pin },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'recent', label: 'Recent', icon: Clock },
  ];

  return (
    <div data-testid="bookmarks-panel" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-primary">Bookmarks</h1>
          <p className="text-sm text-muted mt-0.5">{bookmarks.length} saved links</p>
        </div>
        <Button data-testid="add-bookmark-btn" onClick={() => openAdd()} size="sm">
          <Plus className="h-3.5 w-3.5" />
          Add Bookmark
        </Button>
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            data-testid="bookmark-search"
            placeholder="Search bookmarks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-3.5 w-3.5" />}
          />
        </div>
        <div className="flex items-center gap-1 bg-surface-elevated rounded-xl p-1">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                data-testid={`bookmark-filter-${tab.id}`}
                onClick={() => setFilterTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  filterTab === tab.id
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:text-secondary'
                }`}
              >
                <Icon className="h-3 w-3" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {filteredBookmarks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">🔖</div>
          <h3 className="text-base font-medium text-secondary">
            {search ? 'No bookmarks match your search' : 'No bookmarks yet'}
          </h3>
          <p className="text-sm text-muted mt-1">
            {search ? 'Try a different keyword' : 'Add your first bookmark to get started'}
          </p>
          {!search && (
            <Button className="mt-4" size="sm" onClick={() => openAdd()}>
              <Plus className="h-3.5 w-3.5" /> Add Bookmark
            </Button>
          )}
        </div>
      )}

      {/* Pinned (always shown at top if not in pinned tab) */}
      {filterTab === 'all' &&
        !search &&
        (() => {
          const pinned = bookmarks.filter((b) => b.isPinned);
          if (!pinned.length) return null;
          return (
            <div className="mb-4">
              <p className="section-title mb-2 px-1">📌 Pinned</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {pinned.map((b) => (
                  <BookmarkCard key={b.id} bookmark={b} onEdit={openEdit} />
                ))}
              </div>
            </div>
          );
        })()}

      {/* Sections grouped by category */}
      <AnimatePresence>
        {(Object.keys(BOOKMARK_CATEGORIES) as BookmarkCategory[])
          .filter((cat) => groupedByCategory[cat]?.length)
          .map((cat) => (
            <BookmarkSection
              key={cat}
              category={cat}
              bookmarks={groupedByCategory[cat]!}
              onEdit={openEdit}
              onAdd={openAdd}
            />
          ))}
      </AnimatePresence>

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
