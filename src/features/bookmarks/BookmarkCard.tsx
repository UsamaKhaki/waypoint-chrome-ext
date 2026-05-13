import { ExternalLink, Pin, Star, Edit2, Trash2, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useBookmarksStore } from '@/store/bookmarks.store';
import { getFaviconUrl, copyToClipboard, truncate } from '@/utils';
import type { Bookmark } from '@/types';
import { BOOKMARK_CATEGORIES } from '@/constants';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  compact?: boolean;
}

export function BookmarkCard({ bookmark, onEdit, compact = false }: BookmarkCardProps) {
  const { remove, togglePin, toggleFavorite, markUsed } = useBookmarksStore();
  const categoryMeta = BOOKMARK_CATEGORIES[bookmark.category];

  const handleOpen = async () => {
    await markUsed(bookmark.id);
    chrome.tabs.create({ url: bookmark.url });
  };

  const envBadgeVariant =
    bookmark.environment === 'local'
      ? 'local'
      : bookmark.environment === 'stage'
        ? 'stage'
        : bookmark.environment === 'production'
          ? 'production'
          : 'secondary';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn(
        'group relative card-hover flex items-start gap-3',
        compact ? 'p-2.5' : 'p-3.5'
      )}
    >
      {/* Pin indicator */}
      {bookmark.isPinned && (
        <div className="absolute top-2 right-2">
          <Pin className="h-3 w-3 text-accent opacity-60" />
        </div>
      )}

      {/* Favicon */}
      <button onClick={handleOpen} className="flex-shrink-0 mt-0.5">
        <img
          src={getFaviconUrl(bookmark.url)}
          alt=""
          className="h-8 w-8 rounded-lg object-contain bg-surface-elevated p-1"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0" onClick={handleOpen}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-primary truncate cursor-pointer hover:text-accent transition-colors">
            {bookmark.title}
          </span>
          {bookmark.isFavorite && (
            <Star className="h-3 w-3 text-warning fill-warning flex-shrink-0" />
          )}
        </div>
        {!compact && (
          <p className="text-xs text-muted truncate mt-0.5">{truncate(bookmark.url, 50)}</p>
        )}
        {!compact && (bookmark.environment || bookmark.tags.length > 0) && (
          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
            {bookmark.environment && (
              <Badge variant={envBadgeVariant as any} className="text-xs">
                {bookmark.environment}
              </Badge>
            )}
            {bookmark.tags.slice(0, 3).map((tag) => (
              <span key={tag} className="tag text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Hover actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            copyToClipboard(bookmark.url);
          }}
          title="Copy URL"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(bookmark.id);
          }}
          title={bookmark.isFavorite ? 'Unfavorite' : 'Favorite'}
          className={bookmark.isFavorite ? 'text-warning' : ''}
        >
          <Star className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            togglePin(bookmark.id);
          }}
          title={bookmark.isPinned ? 'Unpin' : 'Pin'}
          className={bookmark.isPinned ? 'text-accent' : ''}
        >
          <Pin className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(bookmark);
          }}
          title="Edit"
        >
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={(e) => {
            e.stopPropagation();
            remove(bookmark.id);
          }}
          title="Delete"
          className="hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
