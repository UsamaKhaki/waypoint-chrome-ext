import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Fuse from 'fuse.js';
import {
  Search,
  ArrowRight,
  Clock,
  Bookmark,
  Globe,
  Terminal,
  GitBranch,
  X,
  CornerDownLeft,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCommandPaletteStore } from '@/store/commandPalette.store';
import { useBookmarksStore } from '@/store/bookmarks.store';
import { useEnvironmentsStore } from '@/store/environments.store';
import type { Command } from '@/types';
import { COMMAND_PALETTE_MAX_RESULTS } from '@/constants';
import { useSettingsStore } from '@/store/settings.store';

// ── Types ──────────────────────────────────────────────────────────────────
type ResultItem =
  | { kind: 'command'; data: Command }
  | { kind: 'bookmark'; data: { id: string; title: string; url: string; category: string } }
  | { kind: 'environment'; data: { id: string; name: string; type: string; url?: string } };

type GroupedResults = {
  recent: ResultItem[];
  bookmarks: ResultItem[];
  environments: ResultItem[];
  commands: ResultItem[];
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function flattenResults(groups: GroupedResults): ResultItem[] {
  return [...groups.recent, ...groups.bookmarks, ...groups.environments, ...groups.commands];
}

function getItemKey(item: ResultItem): string {
  return `${item.kind}-${item.data.id}`;
}

// ── Sub-components ──────────────────────────────────────────────────────────
function ResultIcon({ item }: { item: ResultItem }) {
  const cls = 'h-4 w-4 flex-shrink-0';
  if (item.kind === 'bookmark') return <Bookmark className={cn(cls, 'text-accent')} />;
  if (item.kind === 'environment') return <Globe className={cn(cls, 'text-env-stage')} />;
  if (item.kind === 'command') {
    const cat = item.data.category;
    if (cat === 'github') return <GitBranch className={cn(cls, 'text-secondary')} />;
    if (cat === 'navigation') return <ArrowRight className={cn(cls, 'text-secondary')} />;
    return <Terminal className={cn(cls, 'text-secondary')} />;
  }
  return <Terminal className={cls} />;
}

function ResultRow({
  item,
  isSelected,
  onSelect,
  onHover,
}: {
  item: ResultItem;
  isSelected: boolean;
  onSelect: () => void;
  onHover: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isSelected) ref.current?.scrollIntoView({ block: 'nearest' });
  }, [isSelected]);

  const label =
    item.kind === 'bookmark'
      ? item.data.title
      : item.kind === 'environment'
        ? item.data.name
        : item.data.title;

  const sublabel =
    item.kind === 'bookmark'
      ? item.data.url
      : item.kind === 'environment'
        ? item.data.type
        : item.data.description;

  return (
    <button
      ref={ref}
      data-testid={`palette-result-${item.kind}-${item.data.id}`}
      aria-selected={isSelected}
      onClick={onSelect}
      onMouseEnter={onHover}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-colors duration-100',
        isSelected
          ? 'bg-accent/10 text-primary'
          : 'text-secondary hover:bg-surface-elevated hover:text-primary'
      )}
    >
      <ResultIcon item={item} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{label}</div>
        {sublabel && <div className="text-xs text-muted truncate mt-0.5">{sublabel}</div>}
      </div>
      {isSelected && <CornerDownLeft className="h-3.5 w-3.5 text-muted flex-shrink-0" />}
    </button>
  );
}

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 mt-1">
      <Icon className="h-3 w-3 text-muted" />
      <span className="text-xs font-semibold text-muted uppercase tracking-wider">{label}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────
export function CommandPalette() {
  const { isOpen, query, commands, recentCommands, close, toggle, setQuery, executeCommand } =
    useCommandPaletteStore();
  const bookmarks = useBookmarksStore((s) => s.bookmarks);
  const environments = useEnvironmentsStore((s) => s.environments);
  const userName = useSettingsStore((s) => s.settings.userName);

  const [selectedIndex, setSelectedIndex] = useState(0);

  // ── CMD+K global listener ──────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  // The input mounts with the palette and uses autoFocus, so keystrokes typed
  // right after Cmd+K land in the search field instead of being dropped.
  useEffect(() => {
    if (isOpen) setSelectedIndex(0);
  }, [isOpen]);

  // ── Fuse search ────────────────────────────────────────────────────────
  const bookmarkFuse = new Fuse(bookmarks, {
    keys: ['title', 'url', 'tags', 'description'],
    threshold: 0.4,
  });

  const envFuse = new Fuse(environments, {
    keys: ['name', 'type', 'notes'],
    threshold: 0.4,
  });

  const commandFuse = new Fuse(commands, {
    keys: ['title', 'description', 'keywords'],
    threshold: 0.4,
  });

  const buildResults = useCallback((): GroupedResults => {
    const q = query.trim();

    if (!q) {
      // Show recents + top commands when no query
      const recentCmds = recentCommands
        .map((r) => commands.find((c) => c.id === r.commandId))
        .filter(Boolean) as Command[];

      return {
        recent: recentCmds.slice(0, 3).map((c) => ({ kind: 'command', data: c })),
        bookmarks: bookmarks.slice(0, 4).map((b) => ({
          kind: 'bookmark',
          data: { id: b.id, title: b.title, url: b.url, category: b.category },
        })),
        environments: environments.map((e) => ({
          kind: 'environment',
          data: { id: e.id, name: e.name, type: e.type },
        })),
        commands: commands.slice(0, COMMAND_PALETTE_MAX_RESULTS).map((c) => ({
          kind: 'command',
          data: c,
        })),
      };
    }

    return {
      recent: [],
      bookmarks: bookmarkFuse
        .search(q)
        .slice(0, 3)
        .map((r) => ({
          kind: 'bookmark',
          data: { id: r.item.id, title: r.item.title, url: r.item.url, category: r.item.category },
        })),
      environments: envFuse
        .search(q)
        .slice(0, 2)
        .map((r) => ({
          kind: 'environment',
          data: { id: r.item.id, name: r.item.name, type: r.item.type },
        })),
      commands: commandFuse
        .search(q)
        .slice(0, COMMAND_PALETTE_MAX_RESULTS)
        .map((r) => ({
          kind: 'command',
          data: r.item,
        })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, commands, bookmarks, environments, recentCommands]);

  const groups = buildResults();
  const allItems = flattenResults(groups);

  // ── Keyboard navigation ────────────────────────────────────────────────
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, allItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = allItems[selectedIndex];
      if (item) handleSelect(item);
    } else if (e.key === 'Escape') {
      close();
    }
  };

  // ── Execute selected item ──────────────────────────────────────────────
  const handleSelect = (item: ResultItem) => {
    if (item.kind === 'command') {
      executeCommand(item.data);
    } else if (item.kind === 'bookmark') {
      chrome.tabs.create({ url: item.data.url });
      close();
    } else if (item.kind === 'environment') {
      close();
    }
  };

  const isEmpty = allItems.length === 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />

          {/* Panel */}
          <motion.div
            data-testid="command-palette"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-xl glass-elevated rounded-2xl shadow-2xl overflow-hidden"
            onKeyDown={handleKeyDown}
          >
            {/* Search input row */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border-subtle">
              <Search className="h-4 w-4 text-muted flex-shrink-0" />
              <input
                data-testid="command-palette-input"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  userName
                    ? `Ask anything, ${userName}…`
                    : 'Search bookmarks, environments, commands…'
                }
                className="flex-1 bg-transparent text-primary text-sm outline-none placeholder:text-muted"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-muted hover:text-secondary transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <kbd className="hidden sm:flex items-center gap-1 text-xs text-muted">
                <span className="kbd">ESC</span>
              </kbd>
            </div>

            {/* Results */}
            <div
              data-testid="command-palette-results"
              className="max-h-[420px] overflow-y-auto py-2 px-2"
            >
              {isEmpty ? (
                <div
                  data-testid="command-palette-empty"
                  className="flex flex-col items-center justify-center py-10 text-muted"
                >
                  <Search className="h-8 w-8 mb-3 opacity-40" />
                  <p className="text-sm">No results found</p>
                  <p className="text-xs mt-1 opacity-70">Try a different search term</p>
                </div>
              ) : (
                <>
                  {groups.recent.length > 0 && (
                    <div>
                      <SectionLabel icon={Clock} label="Recent" />
                      {groups.recent.map((item, i) => (
                        <ResultRow
                          key={getItemKey(item)}
                          item={item}
                          isSelected={selectedIndex === i}
                          onSelect={() => handleSelect(item)}
                          onHover={() => setSelectedIndex(i)}
                        />
                      ))}
                    </div>
                  )}
                  {groups.bookmarks.length > 0 && (
                    <div>
                      <SectionLabel icon={Bookmark} label="Bookmarks" />
                      {groups.bookmarks.map((item, i) => {
                        const globalIdx = groups.recent.length + i;
                        return (
                          <ResultRow
                            key={getItemKey(item)}
                            item={item}
                            isSelected={selectedIndex === globalIdx}
                            onSelect={() => handleSelect(item)}
                            onHover={() => setSelectedIndex(globalIdx)}
                          />
                        );
                      })}
                    </div>
                  )}
                  {groups.environments.length > 0 && (
                    <div>
                      <SectionLabel icon={Globe} label="Environments" />
                      {groups.environments.map((item, i) => {
                        const globalIdx = groups.recent.length + groups.bookmarks.length + i;
                        return (
                          <ResultRow
                            key={getItemKey(item)}
                            item={item}
                            isSelected={selectedIndex === globalIdx}
                            onSelect={() => handleSelect(item)}
                            onHover={() => setSelectedIndex(globalIdx)}
                          />
                        );
                      })}
                    </div>
                  )}
                  {groups.commands.length > 0 && (
                    <div>
                      <SectionLabel icon={Terminal} label="Commands" />
                      {groups.commands.map((item, i) => {
                        const globalIdx =
                          groups.recent.length +
                          groups.bookmarks.length +
                          groups.environments.length +
                          i;
                        return (
                          <ResultRow
                            key={getItemKey(item)}
                            item={item}
                            isSelected={selectedIndex === globalIdx}
                            onSelect={() => handleSelect(item)}
                            onHover={() => setSelectedIndex(globalIdx)}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2.5 border-t border-border-subtle text-xs text-muted">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="kbd">↑↓</kbd> navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="kbd">↵</kbd> select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="kbd">ESC</kbd> close
                </span>
              </div>
              <span className="opacity-60">
                {allItems.length} result{allItems.length !== 1 ? 's' : ''}
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
