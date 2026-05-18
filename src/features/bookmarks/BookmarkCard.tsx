import { Pin, Star, Edit2, Trash2, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useBookmarksStore } from '@/store/bookmarks.store';
import { getFaviconUrl, copyToClipboard } from '@/utils';
import type { Bookmark } from '@/types';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onEdit: (bookmark: Bookmark) => void;
  compact?: boolean;
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function BookmarkCard({ bookmark, onEdit, compact = false }: BookmarkCardProps) {
  const { remove, togglePin, toggleFavorite, markUsed } = useBookmarksStore();

  const handleOpen = async () => {
    if (bookmark.environment === 'production') {
      const ok = window.confirm(
        `Open Production link?\n\n${bookmark.title}\n${bookmark.url}\n\nThis points to your live environment — make sure that's what you want.`
      );
      if (!ok) return;
    }
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
      data-testid={`bookmark-card-${bookmark.id}`}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      onClick={handleOpen}
      className={cn(
        'group relative card-hover flex items-start gap-3 cursor-pointer min-w-0',
        compact ? 'p-2.5' : 'p-3.5'
      )}
    >
      {/* Pin indicator (only when no hover actions visible) */}
      {bookmark.isPinned && (
        <div className="absolute top-1.5 right-1.5 group-hover:opacity-0 transition-opacity pointer-events-none">
          <Pin className="h-3 w-3 text-accent" />
        </div>
      )}

      {/* Favicon */}
      <div className="flex-shrink-0 mt-0.5">
        <img
          src={getFaviconUrl(bookmark.url)}
          alt=""
          className="h-8 w-8 rounded-lg object-contain bg-surface-elevated p-1"
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-sm font-medium text-primary truncate group-hover:text-accent transition-colors">
            {bookmark.title}
          </span>
          {bookmark.isFavorite && (
            <Star className="h-3 w-3 text-warning fill-warning flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-muted truncate mt-0.5">{hostname(bookmark.url)}</p>
        {!compact && bookmark.environment && (
          <div className="mt-1.5">
            <Badge
              variant={envBadgeVariant as 'local' | 'stage' | 'production' | 'secondary'}
              className="text-xs"
            >
              {bookmark.environment}
            </Badge>
          </div>
        )}
      </div>

      {/* Hover actions — absolute so they never reserve layout space */}
      <div
        className={cn(
          'absolute top-1.5 right-1.5 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150',
          'rounded-lg bg-surface-elevated/95 backdrop-blur-sm border border-border-subtle shadow-sm px-1 py-0.5'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => copyToClipboard(bookmark.url)}
          title="Copy URL"
        >
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => toggleFavorite(bookmark.id)}
          title={bookmark.isFavorite ? 'Unfavorite' : 'Favorite'}
          className={bookmark.isFavorite ? 'text-warning' : ''}
        >
          <Star className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => togglePin(bookmark.id)}
          title={bookmark.isPinned ? 'Unpin' : 'Pin'}
          className={bookmark.isPinned ? 'text-accent' : ''}
        >
          <Pin className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={() => onEdit(bookmark)} title="Edit">
          <Edit2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => remove(bookmark.id)}
          title="Delete"
          className="hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
