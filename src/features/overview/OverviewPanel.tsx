import { useEffect, useState, useRef } from 'react';
import {
  Bookmark as BookmarkIcon,
  Globe,
  GitBranch,
  Target,
  Layers,
  Command,
  SlidersHorizontal,
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Flag,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookmarksStore } from '@/store/bookmarks.store';
import { useCommandPaletteStore } from '@/store/commandPalette.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useSettingsStore } from '@/store/settings.store';
import { useOverviewLayoutStore, type OverviewSectionId } from '@/store/overviewLayout.store';
import { useGitHubAuthStore } from '@/store/githubAuth.store';
import { useGoogleProfileStore } from '@/store/googleProfile.store';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { QuickApps } from './QuickApps';
import { OverviewEditor } from './OverviewEditor';
import { OpenPRs } from './OpenPRs';
import { CicdOverview } from './CicdOverview';
import { IntegrationsWidget } from './IntegrationsWidget';

const SECTION_CARDS = [
  {
    id: 'bookmarks',
    label: 'Bookmarks',
    icon: BookmarkIcon,
    shortcut: '⌘2',
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
  },
  {
    id: 'environments',
    label: 'Environments',
    icon: Globe,
    shortcut: '⌘3',
    color: 'text-env-stage',
    bg: 'bg-orange-500/10',
  },
  {
    id: 'github',
    label: 'GitHub Hub',
    icon: GitBranch,
    shortcut: '⌘4',
    color: 'text-secondary',
    bg: 'bg-slate-500/10',
  },
  {
    id: 'focus',
    label: 'Daily Focus',
    icon: Target,
    shortcut: '⌘5',
    color: 'text-success',
    bg: 'bg-emerald-500/10',
  },
  {
    id: 'tabs',
    label: 'Tab Manager',
    icon: Layers,
    shortcut: '⌘6',
    color: 'text-accent',
    bg: 'bg-indigo-500/10',
  },
];

interface OverviewPanelProps {
  onNavigate: (section: string) => void;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

// ── Right panel: Priorities sidebar ────────────────────────────────────────
function PrioritiesPanel({ onNavigate }: { onNavigate: (s: string) => void }) {
  const { dailyFocus, addPriority, togglePriority, removePriority } = useWorkspaceStore();
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const priorities = dailyFocus?.priorities ?? [];
  const completed = priorities.filter((p) => p.isCompleted).length;
  const total = priorities.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const handleAdd = async () => {
    if (!input.trim()) return;
    await addPriority(input.trim());
    setInput('');
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full card p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-primary">Today's Focus</span>
        </div>
        <button
          onClick={() => onNavigate('focus')}
          className="text-xs text-muted hover:text-accent transition-colors"
        >
          Full view →
        </button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted">
            <span>
              {completed} of {total} done
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-surface-elevated overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-accent"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      )}

      {/* Add input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Add a priority…"
          className="flex-1 min-w-0 rounded-xl bg-surface-elevated border border-border-subtle text-primary text-xs px-3 py-2 outline-none focus:border-accent transition-colors placeholder:text-muted"
        />
        <button
          onClick={handleAdd}
          disabled={!input.trim()}
          className="flex-shrink-0 h-8 w-8 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 flex items-center justify-center transition-colors disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Priority list */}
      <div className="max-h-80 overflow-y-auto space-y-1">
        <AnimatePresence initial={false}>
          {priorities.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <span className="text-3xl mb-2">🎯</span>
              <p className="text-xs text-muted">No priorities yet</p>
              <p className="text-xs text-muted opacity-60">Add what matters today</p>
            </motion.div>
          ) : (
            priorities.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8, height: 0 }}
                transition={{ duration: 0.15 }}
                className="group flex items-start gap-2.5 px-2 py-2 rounded-xl hover:bg-surface-elevated transition-colors"
              >
                <button
                  onClick={() => togglePriority(p.id)}
                  className="flex-shrink-0 mt-0.5 transition-colors text-muted hover:text-accent"
                >
                  {p.isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 text-success" />
                  ) : (
                    <Circle className="h-4 w-4" />
                  )}
                </button>
                <span
                  className={cn(
                    'flex-1 text-xs leading-relaxed transition-all',
                    p.isCompleted ? 'line-through text-muted' : 'text-secondary'
                  )}
                >
                  {p.text}
                </span>
                <button
                  onClick={() => removePriority(p.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-muted hover:text-destructive transition-all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Footer: completed summary */}
      {completed > 0 && (
        <p className="text-xs text-muted text-center pt-2 border-t border-border-subtle">
          {completed === total ? '🎉 All done!' : `${completed} completed`}
        </p>
      )}
    </div>
  );
}

// ── Left column section renderer ────────────────────────────────────────────
function LeftSection({
  id,
  onNavigate,
  bookmarks,
  openPalette,
  userName,
}: {
  id: OverviewSectionId;
  onNavigate: (s: string) => void;
  bookmarks: import('@/types').Bookmark[];
  openPalette: () => void;
  userName: string;
}) {
  switch (id) {
    case 'search':
      return (
        <motion.button
          key="search"
          layout
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          onClick={openPalette}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-border-subtle bg-surface hover:bg-surface-elevated hover:border-border transition-all duration-150 group"
        >
          <Command className="h-4 w-4 text-muted group-hover:text-accent transition-colors" />
          <span className="flex-1 text-left text-sm text-muted group-hover:text-secondary transition-colors">
            {userName ? `Ask anything, ${userName}…` : 'Search bookmarks, environments, commands…'}
          </span>
          <div className="flex items-center gap-1">
            <kbd className="kbd">⌘</kbd>
            <kbd className="kbd">K</kbd>
          </div>
        </motion.button>
      );

    case 'quick-apps':
      return (
        <motion.div
          key="quick-apps"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <QuickApps />
        </motion.div>
      );

    case 'nav-cards':
      return (
        <motion.div
          key="nav-cards"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {SECTION_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.button
                key={card.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: i * 0.04 }}
                onClick={() => onNavigate(card.id)}
                className="card-hover flex items-center gap-3 p-3.5 text-left"
              >
                <div className={cn('p-2 rounded-xl flex-shrink-0', card.bg)}>
                  <Icon className={cn('h-4 w-4', card.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-primary truncate">{card.label}</div>
                </div>
                <kbd className="kbd hidden lg:inline-flex text-xs">{card.shortcut}</kbd>
              </motion.button>
            );
          })}
        </motion.div>
      );

    case 'github-prs':
      return (
        <motion.div
          key="github-prs"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <OpenPRs onNavigate={onNavigate} />
        </motion.div>
      );

    case 'cicd':
      return (
        <motion.div
          key="cicd"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <CicdOverview onNavigate={onNavigate} />
        </motion.div>
      );

    case 'integrations':
      return (
        <motion.div
          key="integrations"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <IntegrationsWidget />
        </motion.div>
      );

    case 'pinned': {
      const pinned = bookmarks.filter((b) => b.isPinned);
      if (pinned.length === 0) return null;
      return (
        <motion.div
          key="pinned"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="space-y-2"
        >
          <p className="section-title px-1">📌 Pinned</p>
          <div className="flex flex-wrap gap-2">
            {pinned.slice(0, 8).map((b) => (
              <button
                key={b.id}
                onClick={() => chrome.tabs.create({ url: b.url })}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-border-subtle bg-surface hover:bg-surface-elevated hover:border-border text-sm text-secondary hover:text-primary transition-all duration-150"
              >
                <img
                  src={`https://www.google.com/s2/favicons?domain=${new URL(b.url).hostname}&sz=16`}
                  alt=""
                  className="h-4 w-4 rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                {b.title}
              </button>
            ))}
          </div>
        </motion.div>
      );
    }

    default:
      return null;
  }
}

// ── Main panel ──────────────────────────────────────────────────────────────
export function OverviewPanel({ onNavigate }: OverviewPanelProps) {
  const bookmarks = useBookmarksStore((s) => s.bookmarks);
  const openPalette = useCommandPaletteStore((s) => s.open);
  const userName = useSettingsStore((s) => s.settings.userName);
  const { sections, load } = useOverviewLayoutStore();
  const githubUser = useGitHubAuthStore((s) => s.user);
  const googleProfile = useGoogleProfileStore((s) => s.profile);
  const [editing, setEditing] = useState(false);

  // Avatar priority: Google photo > GitHub avatar > initials
  const avatarSrc = googleProfile?.picture ?? githubUser?.avatar_url ?? null;
  const displayName = googleProfile?.name ?? userName ?? githubUser?.name ?? '';

  useEffect(() => {
    load();
  }, [load]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  // Left column renders all visible sections (priorities lives in the right panel)
  const leftSections = sections.filter((s) => s.visible);

  return (
    <div className="grid grid-cols-12 gap-5 items-start">
      {/* ── Left: 9 cols ─────────────────────────────────────────────── */}
      <div className="col-span-9 space-y-6">
        {/* Greeting + edit button */}
        <div className="flex items-start justify-between gap-4">
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Avatar
              src={avatarSrc}
              name={displayName || 'W'}
              size="xl"
              className="ring-2 ring-border-subtle flex-shrink-0"
            />
            <div>
              <p className="text-xs text-muted mb-1">{today}</p>
              <h1 className="text-2xl font-semibold text-primary">
                Good {getGreeting()}
                {displayName ? `, ${displayName}` : ''}
              </h1>
              <p className="text-sm text-muted mt-1">
                {displayName
                  ? `What are we building today, ${displayName.split(' ')[0]}?`
                  : 'Your developer command center is ready.'}
              </p>
            </div>
          </motion.div>

          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border mt-1 flex-shrink-0 border-border-subtle text-muted hover:text-secondary hover:border-border"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Edit Layout
          </button>
        </div>

        {/* Modal editor — portal, only mounts when open */}
        {editing && <OverviewEditor onClose={() => setEditing(false)} />}

        {/* Left sections in stored order */}
        <AnimatePresence mode="popLayout">
          {leftSections
            .map((s) => (
              <LeftSection
                key={s.id}
                id={s.id}
                onNavigate={onNavigate}
                bookmarks={bookmarks}
                openPalette={openPalette}
                userName={userName ?? ''}
              />
            ))
            .filter(Boolean)}
        </AnimatePresence>
      </div>

      {/* ── Right: 3 cols — Priorities (sticky) ─────────────────────── */}
      <div className="col-span-3 sticky top-0">
        <PrioritiesPanel onNavigate={onNavigate} />
      </div>
    </div>
  );
}
