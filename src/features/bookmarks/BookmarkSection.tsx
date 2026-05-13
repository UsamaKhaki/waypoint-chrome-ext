import { useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { BookmarkCard } from './BookmarkCard';
import type { Bookmark, BookmarkCategory } from '@/types';
import { BOOKMARK_CATEGORIES } from '@/constants';

interface BookmarkSectionProps {
  category: BookmarkCategory;
  bookmarks: Bookmark[];
  onEdit: (bookmark: Bookmark) => void;
  onAdd: (category: BookmarkCategory) => void;
  compact?: boolean;
}

export function BookmarkSection({
  category,
  bookmarks,
  onEdit,
  onAdd,
  compact,
}: BookmarkSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const meta = BOOKMARK_CATEGORIES[category];

  if (bookmarks.length === 0) return null;

  return (
    <div className="mb-4">
      {/* Section header */}
      <button
        onClick={() => setIsCollapsed((c) => !c)}
        className="flex items-center gap-2 w-full px-1 py-1.5 group"
      >
        <ChevronRight
          className={cn(
            'h-3.5 w-3.5 text-muted transition-transform duration-200',
            !isCollapsed && 'rotate-90'
          )}
        />
        <div
          className="h-2 w-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: meta?.color }}
        />
        <span className="section-title">{meta?.label ?? category}</span>
        <span className="text-xs text-muted ml-1">({bookmarks.length})</span>
        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onAdd(category);
            }}
            title="Add bookmark"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </button>

      {/* Cards */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div
              className={cn(
                'grid gap-2',
                compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
              )}
            >
              {bookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onEdit={onEdit}
                  compact={compact}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
