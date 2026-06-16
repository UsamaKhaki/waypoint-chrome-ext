import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity as ActivityIcon,
  GitMerge,
  CircleCheck,
  Target,
  Timer,
  Code2,
  Layers,
  Eye,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import {
  useActivityStore,
  ACTIVITY_META,
  type ActivityEvent,
  type ActivityType,
} from '@/store/activity.store';
import { PanelShell, PanelHeader, PanelEmptyState } from '@/features/shared/PanelShell';
import { cn } from '@/lib/utils';

const TYPE_ICON: Record<ActivityType, React.ElementType> = {
  pr_merged: GitMerge,
  pr_opened: GitMerge,
  issue_closed: CircleCheck,
  priority_completed: Target,
  focus_session: Timer,
  snippet_created: Code2,
  session_saved: Layers,
  review_submitted: Eye,
};

function relativeDay(key: string): string {
  const todayD = new Date();
  const todayKey = `${todayD.getFullYear()}-${`${todayD.getMonth() + 1}`.padStart(2, '0')}-${`${todayD.getDate()}`.padStart(2, '0')}`;
  const y = new Date(Date.now() - 86_400_000);
  const yKey = `${y.getFullYear()}-${`${y.getMonth() + 1}`.padStart(2, '0')}-${`${y.getDate()}`.padStart(2, '0')}`;
  if (key === todayKey) return 'Today';
  if (key === yKey) return 'Yesterday';
  const [yr, mo, da] = key.split('-').map(Number);
  return new Date(yr, mo - 1, da).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function timeOfDay(ts: number): string {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function StatCard({
  icon: Icon,
  value,
  label,
  accent,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  accent: string;
}) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${accent}1a`, color: accent }}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-primary leading-none">{value}</p>
        <p className="text-xs text-muted mt-1 truncate">{label}</p>
      </div>
    </div>
  );
}

function EventRow({ event }: { event: ActivityEvent }) {
  const meta = ACTIVITY_META[event.type];
  const Icon = TYPE_ICON[event.type];
  const clickable = !!event.url;

  return (
    <button
      onClick={() => clickable && chrome.tabs.create({ url: event.url! })}
      disabled={!clickable}
      className={cn(
        'group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border-subtle bg-surface text-left transition-all duration-150',
        clickable
          ? 'hover:bg-surface-elevated hover:border-border cursor-pointer'
          : 'cursor-default'
      )}
    >
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-primary truncate">
          <span className="text-muted">{meta.verb}: </span>
          {event.title}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
          <span>{timeOfDay(event.timestamp)}</span>
          {event.context && (
            <>
              <span className="opacity-40">·</span>
              <span className="truncate">{event.context}</span>
            </>
          )}
        </div>
      </div>
      {clickable && (
        <ExternalLink className="h-3.5 w-3.5 text-muted opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity" />
      )}
    </button>
  );
}

export function ActivityPanel() {
  const events = useActivityStore((s) => s.events);
  const clear = useActivityStore((s) => s.clear);
  const recap = useActivityStore((s) => s.recap);

  // `recap` reads the latest events from the store; recompute on each render
  // (cheap — bounded to a capped log) so it tracks `events` changes.
  const stats = recap(7);

  // Group events by local day, preserving recency order.
  const grouped = useMemo(() => {
    const map = new Map<string, ActivityEvent[]>();
    for (const e of events) {
      const d = new Date(e.timestamp);
      const key = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
      const arr = map.get(key) ?? [];
      arr.push(e);
      map.set(key, arr);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [events]);

  return (
    <PanelShell testId="activity-panel">
      <PanelHeader
        icon={ActivityIcon}
        title="Activity"
        subtitle="What you shipped — merged PRs, closed issues, focus, and more."
        actions={
          events.length > 0 ? (
            <button
              onClick={() => clear()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-border-subtle bg-surface hover:bg-surface-elevated text-muted hover:text-destructive transition-all"
            >
              <Trash2 className="h-3.5 w-3.5" /> Clear
            </button>
          ) : undefined
        }
      />

      {/* Weekly recap */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-3 px-1">
          Last 7 days
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={GitMerge} value={stats.prsMerged} label="PRs merged" accent="#8b5cf6" />
          <StatCard
            icon={CircleCheck}
            value={stats.issuesClosed}
            label="Issues closed"
            accent="#10b981"
          />
          <StatCard
            icon={Target}
            value={stats.prioritiesCompleted}
            label="Priorities done"
            accent="#f59e0b"
          />
          <StatCard
            icon={Timer}
            value={stats.focusSessions}
            label="Focus sessions"
            accent="#f43f5e"
          />
        </div>
      </div>

      {/* Timeline */}
      {events.length === 0 ? (
        <PanelEmptyState
          icon={ActivityIcon}
          title="No activity yet"
          hint="As you merge PRs, complete priorities, run focus sessions, and save snippets, they'll show up here — and feed your morning standup."
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([day, dayEvents]) => (
            <motion.div
              key={day}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-3 px-1">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
                  {relativeDay(day)}
                </h2>
                <span className="text-xs text-muted opacity-60">{dayEvents.length}</span>
                <div className="flex-1 h-px bg-border-subtle" />
              </div>
              <div className="space-y-1.5">
                {dayEvents.map((e) => (
                  <EventRow key={e.id} event={e} />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </PanelShell>
  );
}
