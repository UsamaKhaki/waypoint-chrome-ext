import { useEffect, useState, useRef } from 'react';
import { Command, SlidersHorizontal, Plus, CheckCircle2, Circle, Trash2, Flag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookmarksStore } from '@/store/bookmarks.store';
import { useCommandPaletteStore } from '@/store/commandPalette.store';
import { useWorkspaceStore } from '@/store/workspace.store';
import { useSettingsStore } from '@/store/settings.store';
import { useOverviewLayoutStore, type OverviewSectionId } from '@/store/overviewLayout.store';
import { useGitHubAuthStore } from '@/store/githubAuth.store';
import { useLinearAuthStore } from '@/store/linearAuth.store';
import { useJiraAuthStore } from '@/store/jiraAuth.store';
import { useSlackAuthStore } from '@/store/slackAuth.store';
import { useNotionAuthStore } from '@/store/notionAuth.store';
import { useGoogleCalendarAuthStore } from '@/store/googleCalendarAuth.store';
import { useGoogleProfileStore } from '@/store/googleProfile.store';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';
import { QuickApps } from './QuickApps';
import { OverviewEditor } from './OverviewEditor';
import { OpenPRs } from './OpenPRs';
import { StandupDigest } from './StandupDigest';
import { CicdOverview } from './CicdOverview';
import { IntegrationsWidget } from './IntegrationsWidget';
import { SlackOverview } from './SlackOverview';
import { LinearOverview } from './LinearOverview';
import { JiraOverview } from './JiraOverview';
import { NotionOverview } from './NotionOverview';
import { CalendarOverview } from './CalendarOverview';

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
          View all →
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
    case 'standup':
      return (
        <motion.div
          key="standup"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <StandupDigest onNavigate={onNavigate} />
        </motion.div>
      );

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

    case 'linear-issues':
      return (
        <motion.div
          key="linear-issues"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <LinearOverview onNavigate={onNavigate} />
        </motion.div>
      );

    case 'jira-issues':
      return (
        <motion.div
          key="jira-issues"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <JiraOverview onNavigate={onNavigate} />
        </motion.div>
      );

    case 'notion-pages':
      return (
        <motion.div
          key="notion-pages"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <NotionOverview onNavigate={onNavigate} />
        </motion.div>
      );

    case 'calendar-events':
      return (
        <motion.div
          key="calendar-events"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <CalendarOverview onNavigate={onNavigate} />
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

    case 'slack-unread':
      return (
        <motion.div
          key="slack-unread"
          layout
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <SlackOverview onNavigate={onNavigate} />
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

  // Connection status drives the per-connector grouping below — connected
  // services get their own labeled group; disconnected ones fall into the
  // shared "Connect more" bucket.
  const githubConnected = useGitHubAuthStore((s) => s.isConnected);
  const linearConnected = useLinearAuthStore((s) => s.isConnected);
  const jiraConnected = useJiraAuthStore((s) => s.isConnected);
  const slackConnected = useSlackAuthStore((s) => s.isConnected);
  const notionConnected = useNotionAuthStore((s) => s.isConnected);
  const calendarConnected = useGoogleCalendarAuthStore((s) => s.isConnected);

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

  // Left column renders all visible sections — disconnected connector widgets
  // still show, but they're grouped under "Connectors" with their built-in
  // connect prompts. Connected widgets get promoted to their own group below.
  const leftSections = sections.filter((s) => s.visible);

  // Group sections dynamically: a connector with an active connection gets its
  // own labeled group (e.g. "Linear", "Slack"); disconnected ones all fall
  // into "Connectors" so the user has a single place to wire them up.
  type GroupId =
    | 'top'
    | 'github'
    | 'linear'
    | 'jira'
    | 'slack'
    | 'notion'
    | 'calendar'
    | 'connectors'
    | 'bare-bottom';

  function groupFor(id: string): GroupId {
    switch (id) {
      case 'search':
      case 'standup':
      case 'quick-apps':
        return 'top';
      case 'github-prs':
      case 'cicd':
        return githubConnected ? 'github' : 'connectors';
      case 'linear-issues':
        return linearConnected ? 'linear' : 'connectors';
      case 'jira-issues':
        return jiraConnected ? 'jira' : 'connectors';
      case 'slack-unread':
        return slackConnected ? 'slack' : 'connectors';
      case 'notion-pages':
        return notionConnected ? 'notion' : 'connectors';
      case 'calendar-events':
        return calendarConnected ? 'calendar' : 'connectors';
      case 'integrations':
        return 'connectors';
      case 'pinned':
      case 'nav-cards':
        return 'bare-bottom';
      default:
        return 'bare-bottom';
    }
  }

  const GROUP_META: Record<Exclude<GroupId, 'top' | 'bare-bottom'>, { label: string }> = {
    github: { label: 'GitHub' },
    linear: { label: 'Linear' },
    jira: { label: 'Jira' },
    slack: { label: 'Slack' },
    notion: { label: 'Notion' },
    calendar: { label: 'Calendar' },
    connectors: { label: 'Connect more' },
  };

  // Order of the labeled groups when rendered. Connected service groups appear
  // first, then any disconnected ones are bundled under "Connect more".
  const GROUP_ORDER: Exclude<GroupId, 'top' | 'bare-bottom'>[] = [
    'github',
    'calendar',
    'linear',
    'jira',
    'slack',
    'notion',
    'connectors',
  ];

  const topSections = leftSections.filter((s) => groupFor(s.id) === 'top');
  const bareBottomSections = leftSections.filter((s) => groupFor(s.id) === 'bare-bottom');
  const groupedSections = GROUP_ORDER.map((g) => ({
    id: g,
    meta: GROUP_META[g],
    items: leftSections.filter((s) => groupFor(s.id) === g),
  })).filter((g) => g.items.length > 0);

  return (
    <div data-testid="overview-panel" className="grid grid-cols-12 gap-5 items-start pb-12">
      {/* ── Left: 9 cols ─────────────────────────────────────────────── */}
      <div className="col-span-9 space-y-6">
        {/* Greeting */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <motion.div
            className="flex items-center gap-3 min-w-0"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <Avatar
              src={avatarSrc}
              name={displayName || 'W'}
              size="xl"
              className="border border-border-subtle flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs text-muted font-medium uppercase tracking-widest mb-1">
                {today}
              </p>
              <h1 className="text-2xl font-bold text-primary tracking-tight truncate">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all border flex-shrink-0 border-border-subtle bg-surface hover:bg-surface-elevated text-secondary hover:text-primary hover:border-border"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Edit Layout
          </button>
        </div>

        {/* Modal editor — portal, only mounts when open */}
        {editing && <OverviewEditor onClose={() => setEditing(false)} />}

        {/* Top sections (search, quick apps) — render bare, no group header */}
        <AnimatePresence mode="popLayout">
          {topSections.map((s) => (
            <LeftSection
              key={s.id}
              id={s.id}
              onNavigate={onNavigate}
              bookmarks={bookmarks}
              openPalette={openPalette}
              userName={userName ?? ''}
            />
          ))}
        </AnimatePresence>

        {/* Grouped sections with category headers */}
        {groupedSections.map((group) => (
          <div key={group.id} className="space-y-3">
            <div className="flex items-center gap-3 px-1">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
                {group.meta.label}
              </h2>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {group.items.map((s) => (
                  <LeftSection
                    key={s.id}
                    id={s.id}
                    onNavigate={onNavigate}
                    bookmarks={bookmarks}
                    openPalette={openPalette}
                    userName={userName ?? ''}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}

        {/* Bottom sections rendered bare, no group header (e.g. Pinned). */}
        <AnimatePresence mode="popLayout">
          {bareBottomSections.map((s) => (
            <LeftSection
              key={s.id}
              id={s.id}
              onNavigate={onNavigate}
              bookmarks={bookmarks}
              openPalette={openPalette}
              userName={userName ?? ''}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* ── Right: 3 cols — Priorities (sticky) ─────────────────────── */}
      <div className="col-span-3 sticky top-0">
        <PrioritiesPanel onNavigate={onNavigate} />
      </div>
    </div>
  );
}
