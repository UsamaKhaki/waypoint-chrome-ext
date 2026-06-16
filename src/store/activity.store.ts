import { create } from 'zustand';
import { storage } from '@/services/storage';
import { generateId } from '@/utils';

/**
 * A lightweight, local "what did I do" log. Powers the Activity panel and the
 * "Yesterday" section of the morning standup digest.
 *
 * Design notes:
 *  - Stays in chrome.storage.local (never synced): it's per-device, append-heavy
 *    and can grow past the 8KB/item sync quota.
 *  - Deduped by `dedupeKey` so polling sources (e.g. GitHub merged PRs) don't log
 *    the same event on every refresh.
 *  - Capped to the most recent MAX_EVENTS / RETENTION_DAYS so it can't grow
 *    unbounded.
 */

export type ActivityType =
  | 'pr_merged'
  | 'pr_opened'
  | 'issue_closed'
  | 'priority_completed'
  | 'focus_session'
  | 'snippet_created'
  | 'session_saved'
  | 'review_submitted';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  title: string;
  /** Optional deep-link (e.g. PR/issue URL). */
  url?: string;
  /** Short contextual label, e.g. repo name or category. */
  context?: string;
  timestamp: number;
  /** Stable key used to avoid logging the same external event twice. */
  dedupeKey?: string;
}

export const ACTIVITY_META: Record<
  ActivityType,
  { label: string; verb: string; icon: string; color: string }
> = {
  pr_merged: { label: 'PR merged', verb: 'Merged', icon: '⎇', color: '#8b5cf6' },
  pr_opened: { label: 'PR opened', verb: 'Opened', icon: '⎇', color: '#3b82f6' },
  issue_closed: { label: 'Issue closed', verb: 'Closed', icon: '✓', color: '#10b981' },
  priority_completed: { label: 'Priority done', verb: 'Completed', icon: '🎯', color: '#f59e0b' },
  focus_session: { label: 'Focus session', verb: 'Focused', icon: '🍅', color: '#f43f5e' },
  snippet_created: { label: 'Snippet saved', verb: 'Saved snippet', icon: '{}', color: '#06b6d4' },
  session_saved: { label: 'Tab session saved', verb: 'Saved session', icon: '⧉', color: '#94a3b8' },
  review_submitted: { label: 'Review submitted', verb: 'Reviewed', icon: '👁', color: '#22c55e' },
};

const MAX_EVENTS = 1000;
const RETENTION_DAYS = 60;
const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

/** Local-day key (YYYY-MM-DD) for a timestamp, used for day grouping. */
function dayKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function prune(events: ActivityEvent[]): ActivityEvent[] {
  const cutoff = Date.now() - RETENTION_MS;
  return events
    .filter((e) => e.timestamp >= cutoff)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, MAX_EVENTS);
}

export interface RecapStats {
  prsMerged: number;
  issuesClosed: number;
  prsOpened: number;
  focusSessions: number;
  prioritiesCompleted: number;
  snippetsCreated: number;
  total: number;
}

interface ActivityState {
  events: ActivityEvent[];
  isLoading: boolean;
  load: () => Promise<void>;
  /** Log a single event. No-ops if an event with the same dedupeKey exists. */
  log: (event: Omit<ActivityEvent, 'id' | 'timestamp'> & { timestamp?: number }) => Promise<void>;
  /** Log many external events at once (deduped). Returns how many were new. */
  logMany: (
    events: Array<Omit<ActivityEvent, 'id' | 'timestamp'> & { timestamp?: number }>
  ) => Promise<number>;
  clear: () => Promise<void>;
  /** Events that occurred on the given day key (YYYY-MM-DD). */
  eventsForDay: (key: string) => ActivityEvent[];
  /** Aggregate counts over the trailing `days` window (default 7). */
  recap: (days?: number) => RecapStats;
}

export const useActivityStore = create<ActivityState>((set, get) => ({
  events: [],
  isLoading: false,

  load: async () => {
    set({ isLoading: true });
    const saved = await storage.get<ActivityEvent[]>('activityLog');
    set({ events: prune(saved ?? []), isLoading: false });
  },

  log: async (event) => {
    const added = await get().logMany([event]);
    void added;
  },

  logMany: async (incoming) => {
    if (incoming.length === 0) return 0;
    const existing = get().events;
    const seenKeys = new Set(existing.map((e) => e.dedupeKey).filter(Boolean) as string[]);

    const fresh: ActivityEvent[] = [];
    for (const e of incoming) {
      if (e.dedupeKey && seenKeys.has(e.dedupeKey)) continue;
      if (e.dedupeKey) seenKeys.add(e.dedupeKey);
      fresh.push({
        ...e,
        id: generateId(),
        timestamp: e.timestamp ?? Date.now(),
      });
    }
    if (fresh.length === 0) return 0;

    const next = prune([...fresh, ...existing]);
    set({ events: next });
    await storage.set('activityLog', next);
    return fresh.length;
  },

  clear: async () => {
    set({ events: [] });
    await storage.set('activityLog', []);
  },

  eventsForDay: (key) => get().events.filter((e) => dayKey(e.timestamp) === key),

  recap: (days = 7) => {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const window = get().events.filter((e) => e.timestamp >= cutoff);
    return {
      prsMerged: window.filter((e) => e.type === 'pr_merged').length,
      issuesClosed: window.filter((e) => e.type === 'issue_closed').length,
      prsOpened: window.filter((e) => e.type === 'pr_opened').length,
      focusSessions: window.filter((e) => e.type === 'focus_session').length,
      prioritiesCompleted: window.filter((e) => e.type === 'priority_completed').length,
      snippetsCreated: window.filter((e) => e.type === 'snippet_created').length,
      total: window.length,
    };
  },
}));

/** Day key for today, in local time. */
export function todayKey(): string {
  return dayKey(Date.now());
}

/** Day key for yesterday, in local time. */
export function yesterdayKey(): string {
  return dayKey(Date.now() - 24 * 60 * 60 * 1000);
}

export { dayKey };

/**
 * Convenience helper so non-React modules (stores, timers) can log without
 * importing the hook shape. Mirrors how other stores call each other.
 */
export const logActivity = (
  event: Omit<ActivityEvent, 'id' | 'timestamp'> & { timestamp?: number }
): void => {
  void useActivityStore.getState().log(event);
};
